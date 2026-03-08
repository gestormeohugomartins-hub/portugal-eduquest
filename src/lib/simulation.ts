// Village simulation: food, services, happiness, population dynamics, seasons
import { PlacedBuilding, BUILDING_DEFS } from './gameTypes';

// ====== Simulation constants ======
export const FOOD_PER_CITIZEN_PER_MIN = 0.2;
export const SIM_TICK_MS = 15000;

// ====== Seasons ======
export type Season = 'primavera' | 'verao' | 'outono' | 'inverno';

export const SEASON_CONFIG: Record<Season, { label: string; emoji: string; foodMultiplier: number; color: string }> = {
  primavera: { label: 'Primavera', emoji: '🌸', foodMultiplier: 1.2, color: '#4ade80' },
  verao:     { label: 'Verão',     emoji: '☀️', foodMultiplier: 1.5, color: '#facc15' },
  outono:    { label: 'Outono',    emoji: '🍂', foodMultiplier: 0.8, color: '#f97316' },
  inverno:   { label: 'Inverno',   emoji: '❄️', foodMultiplier: 0.4, color: '#93c5fd' },
};

const SEASON_ORDER: Season[] = ['primavera', 'verao', 'outono', 'inverno'];
// Each season lasts 5 real minutes (300s)
const SEASON_DURATION_MS = 300000;

export function getCurrentSeason(): Season {
  const cyclePos = Date.now() % (SEASON_DURATION_MS * 4);
  const idx = Math.floor(cyclePos / SEASON_DURATION_MS);
  return SEASON_ORDER[idx];
}

export function getSeasonProgress(): number {
  const cyclePos = Date.now() % SEASON_DURATION_MS;
  return cyclePos / SEASON_DURATION_MS;
}

// ====== Building production/service rates ======
export interface SimRates {
  foodProduction: number;
  coinProduction: number;
  serviceCapacity: number;
  serviceType?: 'health' | 'education' | 'religion' | 'water';
}

export const SIM_RATES: Record<string, SimRates> = {
  farm:           { foodProduction: 5,  coinProduction: 0, serviceCapacity: 0 },
  windmill:       { foodProduction: 8,  coinProduction: 1, serviceCapacity: 0 },
  workshop:       { foodProduction: 0,  coinProduction: 2, serviceCapacity: 0 },
  market:         { foodProduction: 0,  coinProduction: 4, serviceCapacity: 0 },
  hospital:       { foodProduction: 0,  coinProduction: 0, serviceCapacity: 20, serviceType: 'health' },
  school_building:{ foodProduction: 0,  coinProduction: 0, serviceCapacity: 30, serviceType: 'education' },
  church:         { foodProduction: 0,  coinProduction: 0, serviceCapacity: 25, serviceType: 'religion' },
  well:           { foodProduction: 0,  coinProduction: 0, serviceCapacity: 15, serviceType: 'water' },
};

// ====== Simulation state ======
export interface SimState {
  foodStored: number;
  foodCapacity: number;
  foodPerMin: number;
  foodConsumedPerMin: number;
  happiness: number;
  healthCoverage: number;
  educationCoverage: number;
  waterCoverage: number;
  religionCoverage: number;
  complaints: Complaint[];
  populationDelta: number;
  diseaseRisk: number;
  season: Season;
  seasonMultiplier: number;
}

export interface Complaint {
  type: 'food' | 'health' | 'education' | 'water' | 'religion' | 'disease';
  message: string;
  emoji: string;
}

const COMPLAINT_MESSAGES: Record<string, { messages: string[]; emoji: string }> = {
  food:      { messages: ['Tenho fome!', 'Não há comida!', 'Precisamos de hortas!'], emoji: '🍖' },
  health:    { messages: ['Estou doente!', 'Precisamos de hospital!', 'Dói-me tudo!'], emoji: '🏥' },
  education: { messages: ['Quero aprender!', 'Precisamos de escola!', 'Onde é a escola?'], emoji: '📚' },
  water:     { messages: ['Tenho sede!', 'Não há água!', 'Precisamos de poço!'], emoji: '💧' },
  religion:  { messages: ['Precisamos de igreja!', 'Queremos rezar!'], emoji: '⛪' },
  disease:   { messages: ['Há doença na aldeia!', 'Epidemia!', 'Estamos doentes!'], emoji: '🤒' },
};

export function calculateSimState(buildings: PlacedBuilding[], citizenCount: number): SimState {
  const season = getCurrentSeason();
  const seasonMult = SEASON_CONFIG[season].foodMultiplier;

  let foodPerMin = 0;
  let healthCap = 0;
  let eduCap = 0;
  let waterCap = 0;
  let religionCap = 0;

  for (const b of buildings) {
    const rates = SIM_RATES[b.defId];
    if (!rates) continue;
    const lvl = b.level;
    // Apply season multiplier to food production
    foodPerMin += rates.foodProduction * lvl * (rates.foodProduction > 0 ? seasonMult : 1);
    if (rates.serviceType === 'health') healthCap += rates.serviceCapacity * lvl;
    if (rates.serviceType === 'education') eduCap += rates.serviceCapacity * lvl;
    if (rates.serviceType === 'water') waterCap += rates.serviceCapacity * lvl;
    if (rates.serviceType === 'religion') religionCap += rates.serviceCapacity * lvl;
  }

  const foodConsumedPerMin = citizenCount * FOOD_PER_CITIZEN_PER_MIN;
  const pop = Math.max(citizenCount, 1);
  const healthCoverage = Math.min(100, (healthCap / pop) * 100);
  const educationCoverage = Math.min(100, (eduCap / pop) * 100);
  const waterCoverage = Math.min(100, (waterCap / pop) * 100);
  const religionCoverage = Math.min(100, (religionCap / pop) * 100);

  const foodBalance = foodPerMin - foodConsumedPerMin;
  const foodStored = Math.max(0, foodBalance * 5);
  const foodCapacity = Math.max(50, buildings.filter(b => b.defId === 'market' || b.defId === 'windmill').length * 50);

  const diseaseRisk = Math.max(0, 100 - (healthCoverage * 0.6 + waterCoverage * 0.4));

  const foodHappy = foodBalance >= 0 ? 30 : Math.max(0, 30 + foodBalance * 3);
  const serviceHappy = (healthCoverage * 0.2 + educationCoverage * 0.15 + waterCoverage * 0.2 + religionCoverage * 0.15);
  const diseaseHappy = -diseaseRisk * 0.2;
  const happiness = Math.min(100, Math.max(0, foodHappy + serviceHappy + diseaseHappy));

  let populationDelta = 0;
  if (happiness >= 70) populationDelta = 1;
  else if (happiness >= 40) populationDelta = 0;
  else if (happiness < 20) populationDelta = -2;
  else populationDelta = -1;

  const complaints: Complaint[] = [];
  if (foodBalance < 0) addComplaint(complaints, 'food');
  if (healthCoverage < 50 && citizenCount > 5) addComplaint(complaints, 'health');
  if (waterCoverage < 50 && citizenCount > 5) addComplaint(complaints, 'water');
  if (educationCoverage < 30 && citizenCount > 10) addComplaint(complaints, 'education');
  if (religionCoverage < 30 && citizenCount > 15) addComplaint(complaints, 'religion');
  if (diseaseRisk > 60) addComplaint(complaints, 'disease');

  return {
    foodStored: Math.round(foodStored),
    foodCapacity,
    foodPerMin: Math.round(foodPerMin * 10) / 10,
    foodConsumedPerMin: Math.round(foodConsumedPerMin * 10) / 10,
    happiness: Math.round(happiness),
    healthCoverage: Math.round(healthCoverage),
    educationCoverage: Math.round(educationCoverage),
    waterCoverage: Math.round(waterCoverage),
    religionCoverage: Math.round(religionCoverage),
    complaints,
    populationDelta,
    diseaseRisk: Math.round(diseaseRisk),
    season,
    seasonMultiplier: seasonMult,
  };
}

function addComplaint(list: Complaint[], type: Complaint['type']) {
  const data = COMPLAINT_MESSAGES[type];
  if (!data) return;
  list.push({
    type,
    message: data.messages[Math.floor(Math.random() * data.messages.length)],
    emoji: data.emoji,
  });
}

// ====== Animated citizen types ======
export interface AnimatedCitizen {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  complaint?: string;
  complaintTimer: number;
  direction: number;
}

let citizenIdCounter = 0;
const CITIZEN_COLORS = ['#e8c170', '#d4a056', '#c48842', '#a06830', '#8b5e3c', '#f0d090'];

export function createAnimatedCitizen(roadTiles: { x: number; y: number }[]): AnimatedCitizen | null {
  if (roadTiles.length === 0) return null;
  const start = roadTiles[Math.floor(Math.random() * roadTiles.length)];
  const target = roadTiles[Math.floor(Math.random() * roadTiles.length)];
  return {
    id: citizenIdCounter++,
    x: start.x, y: start.y,
    targetX: target.x, targetY: target.y,
    speed: 0.01 + Math.random() * 0.01,
    color: CITIZEN_COLORS[Math.floor(Math.random() * CITIZEN_COLORS.length)],
    complaintTimer: 0,
    direction: 0,
  };
}

export function updateCitizen(c: AnimatedCitizen, roadTiles: { x: number; y: number }[]): void {
  const dx = c.targetX - c.x;
  const dy = c.targetY - c.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.1) {
    if (roadTiles.length > 0) {
      const t = roadTiles[Math.floor(Math.random() * roadTiles.length)];
      c.targetX = t.x;
      c.targetY = t.y;
    }
  } else {
    c.x += (dx / dist) * c.speed;
    c.y += (dy / dist) * c.speed;
    if (Math.abs(dx) > Math.abs(dy)) {
      c.direction = dx > 0 ? 1 : 3;
    } else {
      c.direction = dy > 0 ? 2 : 0;
    }
  }

  if (c.complaintTimer > 0) c.complaintTimer--;
}

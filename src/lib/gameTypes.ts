// ====== Isometric Game Types ======

export const MAX_GRID_SIZE = 20; // max expandable size
export const MIN_GRID_SIZE = 8;  // starting size
export const TILE_W = 64;   // isometric tile width
export const TILE_H = 32;   // isometric tile height

// Expansion costs per level (8→10, 10→12, ..., 18→20)
export const EXPANSION_LEVELS = [
  { size: 8,  cost: 0,    diamonds: 0,  label: 'Início' },
  { size: 10, cost: 100,  diamonds: 0,  label: 'Pequena Expansão' },
  { size: 12, cost: 250,  diamonds: 2,  label: 'Expansão Média' },
  { size: 14, cost: 500,  diamonds: 5,  label: 'Grande Expansão' },
  { size: 16, cost: 1000, diamonds: 10, label: 'Expansão Épica' },
  { size: 18, cost: 2000, diamonds: 20, label: 'Expansão Lendária' },
  { size: 20, cost: 5000, diamonds: 50, label: 'Território Máximo' },
];

export type TileType = 'grass' | 'road' | 'water' | 'wall';

export interface GridTile {
  x: number;
  y: number;
  type: TileType;
  buildingId?: string;
}

export type NaturalResourceType = 'wood' | 'stone' | 'iron' | 'coal' | 'food' | 'leather' | 'fish';

export interface ResourceCost {
  resource: NaturalResourceType;
  amount: number;
}

export interface BuildingDef {
  id: string;
  name: string;
  emoji: string;
  category: 'residential' | 'military' | 'production' | 'decoration' | 'infrastructure' | 'monument';
  width: number;
  height: number;
  costCoins: number;
  costDiamonds: number;
  resourceCosts: ResourceCost[];
  maxLevel: number;
  citizenBonus: number;
  defenseBonus: number;
  xpBonus: number;
  requiresRoad: boolean;
  premiumOnly: boolean;
  minVillageLevel: number;
  description: string;
  upgradeCostMultiplier: number;
  // District monuments (premium)
  districtExclusive?: string;
}

export interface PlacedBuilding {
  id: string;
  defId: string;
  x: number;
  y: number;
  level: number;
  dbId?: string; // database id
  constructionStartedAt?: string | null;
  constructionDuration?: number; // seconds
}

// ====== Evolution Level Names (Aldeia → Vila → Cidade) ======
// Returns the evolution tier name for a building at a given level
export const EVOLUTION_TIERS = [
  { level: 1, name: 'Palhoça', emoji: '🛖', tier: 'aldeia' },
  { level: 2, name: 'Cabana', emoji: '🏚️', tier: 'aldeia' },
  { level: 3, name: 'Casa Rústica', emoji: '🏠', tier: 'vila' },
  { level: 4, name: 'Edifício', emoji: '🏢', tier: 'vila' },
  { level: 5, name: 'Construção Nobre', emoji: '🏛️', tier: 'cidade' },
];

export function getEvolutionTier(level: number): typeof EVOLUTION_TIERS[0] {
  return EVOLUTION_TIERS[Math.min(level, EVOLUTION_TIERS.length) - 1];
}

export function getSettlementType(villageLevel: number): { name: string; emoji: string } {
  if (villageLevel <= 2) return { name: 'Aldeia', emoji: '🛖' };
  if (villageLevel <= 4) return { name: 'Vila', emoji: '🏘️' };
  if (villageLevel <= 6) return { name: 'Cidade', emoji: '🏙️' };
  return { name: 'Metrópole', emoji: '🌆' };
}

// ====== Building Definitions ======
// Base buildings start as palhotas (huts) – cheap to build, with 5 evolution levels
export const BUILDING_DEFS: Record<string, BuildingDef> = {
  // Infrastructure
  road: {
    id: 'road', name: 'Caminho', emoji: '🛤️',
    category: 'infrastructure', width: 1, height: 1,
    costCoins: 2, costDiamonds: 0, resourceCosts: [{ resource: 'stone', amount: 1 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 0, xpBonus: 1,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Caminho de terra. Liga edifícios e permite acesso.',
    upgradeCostMultiplier: 1.4,
  },
  // Residential
  house: {
    id: 'house', name: 'Palhoça', emoji: '🛖',
    category: 'residential', width: 1, height: 1,
    costCoins: 10, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 2 }], maxLevel: 5,
    citizenBonus: 3, defenseBonus: 0, xpBonus: 5,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Abrigo simples de palha. Evolui para casa e mansão.',
    upgradeCostMultiplier: 1.8,
  },
  mansion: {
    id: 'mansion', name: 'Cabana Grande', emoji: '🏚️',
    category: 'residential', width: 2, height: 2,
    costCoins: 40, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 5 }, { resource: 'stone', amount: 2 }], maxLevel: 5,
    citizenBonus: 10, defenseBonus: 1, xpBonus: 15,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Cabana grande para mais famílias. Evolui para solar.',
    upgradeCostMultiplier: 2,
  },
  // Production
  workshop: {
    id: 'workshop', name: 'Bancada', emoji: '🪵',
    category: 'production', width: 1, height: 1,
    costCoins: 15, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 3 }], maxLevel: 5,
    citizenBonus: 1, defenseBonus: 0, xpBonus: 8,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Bancada de trabalho rústica. Evolui para oficina.',
    upgradeCostMultiplier: 1.7,
  },
  market: {
    id: 'market', name: 'Banca de Troca', emoji: '🪺',
    category: 'production', width: 2, height: 1,
    costCoins: 25, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 4 }, { resource: 'stone', amount: 2 }], maxLevel: 5,
    citizenBonus: 2, defenseBonus: 0, xpBonus: 10,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Banca simples de trocas. Evolui para mercado.',
    upgradeCostMultiplier: 1.8,
  },
  // Military
  wall: {
    id: 'wall', name: 'Paliçada', emoji: '🪵',
    category: 'military', width: 1, height: 1,
    costCoins: 5, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 2 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 2, xpBonus: 2,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Cerca de madeira. Evolui para muralha de pedra.',
    upgradeCostMultiplier: 1.5,
  },
  tower: {
    id: 'tower', name: 'Atalaia', emoji: '🗼',
    category: 'military', width: 1, height: 1,
    costCoins: 30, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 4 }, { resource: 'stone', amount: 3 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 8, xpBonus: 10,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Torre de vigia rústica. Evolui para torre de defesa.',
    upgradeCostMultiplier: 2,
  },
  barracks: {
    id: 'barracks', name: 'Acampamento', emoji: '⛺',
    category: 'military', width: 2, height: 2,
    costCoins: 50, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 6 }, { resource: 'stone', amount: 4 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 12, xpBonus: 20,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Acampamento militar. Evolui para quartel.',
    upgradeCostMultiplier: 2.2,
  },
  // Agriculture
  farm: {
    id: 'farm', name: 'Canteiro', emoji: '🌱',
    category: 'production', width: 2, height: 2,
    costCoins: 15, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 2 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 0, xpBonus: 8,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Pequeno canteiro de cultivo. Evolui para horta e quinta.',
    upgradeCostMultiplier: 1.6,
  },
  windmill: {
    id: 'windmill', name: 'Mó de Mão', emoji: '🫓',
    category: 'production', width: 2, height: 2,
    costCoins: 40, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 5 }, { resource: 'stone', amount: 3 }], maxLevel: 5,
    citizenBonus: 1, defenseBonus: 0, xpBonus: 12,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Mó artesanal. Evolui para moinho de vento.',
    upgradeCostMultiplier: 1.8,
  },
  // Services
  hospital: {
    id: 'hospital', name: 'Curandeiro', emoji: '🌿',
    category: 'infrastructure', width: 2, height: 2,
    costCoins: 50, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 5 }, { resource: 'stone', amount: 3 }], maxLevel: 5,
    citizenBonus: 3, defenseBonus: 0, xpBonus: 18,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Cabana do curandeiro. Evolui para boticário e hospital.',
    upgradeCostMultiplier: 2,
  },
  school_building: {
    id: 'school_building', name: 'Mestre-Escola', emoji: '📖',
    category: 'infrastructure', width: 2, height: 2,
    costCoins: 40, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 4 }, { resource: 'stone', amount: 3 }], maxLevel: 5,
    citizenBonus: 4, defenseBonus: 0, xpBonus: 20,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Aula ao ar livre. Evolui para escola e colégio.',
    upgradeCostMultiplier: 1.8,
  },
  church: {
    id: 'church', name: 'Altar', emoji: '🪨',
    category: 'infrastructure', width: 2, height: 2,
    costCoins: 35, costDiamonds: 0, resourceCosts: [{ resource: 'stone', amount: 4 }, { resource: 'wood', amount: 2 }], maxLevel: 5,
    citizenBonus: 3, defenseBonus: 0, xpBonus: 15,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Altar de pedra simples. Evolui para capela e igreja.',
    upgradeCostMultiplier: 1.8,
  },
  well: {
    id: 'well', name: 'Poça de Água', emoji: '💧',
    category: 'infrastructure', width: 1, height: 1,
    costCoins: 10, costDiamonds: 0, resourceCosts: [{ resource: 'stone', amount: 1 }], maxLevel: 5,
    citizenBonus: 1, defenseBonus: 0, xpBonus: 5,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Poça natural de água. Evolui para poço e fonte.',
    upgradeCostMultiplier: 1.4,
  },
  // Decoration
  fountain: {
    id: 'fountain', name: 'Pedra Decorativa', emoji: '🪨',
    category: 'decoration', width: 1, height: 1,
    costCoins: 8, costDiamonds: 0, resourceCosts: [{ resource: 'stone', amount: 1 }], maxLevel: 5,
    citizenBonus: 1, defenseBonus: 0, xpBonus: 3,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Pedra decorativa. Evolui para fonte ornamental.',
    upgradeCostMultiplier: 1.4,
  },
  garden: {
    id: 'garden', name: 'Arbusto', emoji: '🌿',
    category: 'decoration', width: 1, height: 1,
    costCoins: 5, costDiamonds: 0, resourceCosts: [], maxLevel: 5,
    citizenBonus: 1, defenseBonus: 0, xpBonus: 2,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Arbusto simples. Evolui para jardim florido.',
    upgradeCostMultiplier: 1.3,
  },
  statue: {
    id: 'statue', name: 'Totem', emoji: '🗿',
    category: 'decoration', width: 1, height: 1,
    costCoins: 20, costDiamonds: 1, resourceCosts: [{ resource: 'stone', amount: 3 }], maxLevel: 5,
    citizenBonus: 3, defenseBonus: 0, xpBonus: 12,
    requiresRoad: false, premiumOnly: true, minVillageLevel: 1,
    description: 'Premium: Totem tribal. Evolui para estátua.',
    upgradeCostMultiplier: 1.8,
  },
  // Premium district monuments - all 20 districts
  torre_belem: {
    id: 'torre_belem', name: 'Torre de Belém', emoji: '🏛️',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 30, defenseBonus: 20, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Lisboa. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'lisboa',
  },
  ponte_dom_luis: {
    id: 'ponte_dom_luis', name: 'Ponte D. Luís', emoji: '🌉',
    category: 'monument', width: 3, height: 1,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 25, defenseBonus: 10, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento do Porto. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'porto',
  },
  universidade_coimbra: {
    id: 'universidade_coimbra', name: 'Universidade', emoji: '🎓',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 35, defenseBonus: 5, xpBonus: 120,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Coimbra. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'coimbra',
  },
  castelo_guimaraes: {
    id: 'castelo_guimaraes', name: 'Castelo Guimarães', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 20, defenseBonus: 30, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Braga. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'braga',
  },
  fortaleza_sagres: {
    id: 'fortaleza_sagres', name: 'Fortaleza de Sagres', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 15, defenseBonus: 35, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Faro. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'faro',
  },
  templo_romano: {
    id: 'templo_romano', name: 'Templo Romano', emoji: '🏛️',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 30, defenseBonus: 10, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Évora. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'evora',
  },
  castelo_braganca: {
    id: 'castelo_braganca', name: 'Castelo de Bragança', emoji: '🏯',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 20, defenseBonus: 35, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Bragança. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'braganca',
  },
  moliceiro_aveiro: {
    id: 'moliceiro_aveiro', name: 'Canal dos Moliceiros', emoji: '🚣',
    category: 'monument', width: 3, height: 1,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 25, defenseBonus: 5, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Aveiro. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'aveiro',
  },
  castelo_beja: {
    id: 'castelo_beja', name: 'Castelo de Beja', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 20, defenseBonus: 30, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Beja. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'beja',
  },
  jardim_episcopal: {
    id: 'jardim_episcopal', name: 'Jardim Episcopal', emoji: '🌺',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 30, defenseBonus: 5, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de C. Branco. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'castelo_branco',
  },
  se_guarda: {
    id: 'se_guarda', name: 'Sé da Guarda', emoji: '⛪',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 25, defenseBonus: 15, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento da Guarda. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'guarda',
  },
  castelo_leiria: {
    id: 'castelo_leiria', name: 'Castelo de Leiria', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 20, defenseBonus: 30, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Leiria. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'leiria',
  },
  castelo_marvao: {
    id: 'castelo_marvao', name: 'Castelo de Marvão', emoji: '🏔️',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 15, defenseBonus: 35, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Portalegre. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'portalegre',
  },
  castelo_almourol: {
    id: 'castelo_almourol', name: 'Castelo de Almourol', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 20, defenseBonus: 30, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Santarém. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'santarem',
  },
  castelo_palmela: {
    id: 'castelo_palmela', name: 'Castelo de Palmela', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 20, defenseBonus: 25, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Setúbal. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'setubal',
  },
  santuario_luzia: {
    id: 'santuario_luzia', name: 'Santa Luzia', emoji: '⛪',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 30, defenseBonus: 10, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Viana do Castelo. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'viana_castelo',
  },
  solar_mateus: {
    id: 'solar_mateus', name: 'Solar de Mateus', emoji: '🏡',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 30, defenseBonus: 5, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Vila Real. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'vila_real',
  },
  se_viseu: {
    id: 'se_viseu', name: 'Sé de Viseu', emoji: '⛪',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 25, defenseBonus: 15, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Viseu. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'viseu',
  },
  lagoa_sete_cidades: {
    id: 'lagoa_sete_cidades', name: 'Sete Cidades', emoji: '🌋',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 30, defenseBonus: 10, xpBonus: 120,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento dos Açores. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'acores',
  },
  monte_funchal: {
    id: 'monte_funchal', name: 'Monte do Funchal', emoji: '🚡',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, resourceCosts: [], maxLevel: 1,
    citizenBonus: 25, defenseBonus: 10, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento da Madeira. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'madeira',
  },
};

// Building categories for the build menu
export const BUILDING_CATEGORIES = [
  { id: 'infrastructure', name: 'Infraestrutura', emoji: '🛤️' },
  { id: 'residential', name: 'Residencial', emoji: '🏠' },
  { id: 'production', name: 'Produção', emoji: '🔨' },
  { id: 'military', name: 'Militar', emoji: '⚔️' },
  { id: 'decoration', name: 'Decoração', emoji: '🌳' },
  { id: 'monument', name: 'Monumentos', emoji: '🏛️' },
] as const;

// Tile colors for isometric rendering
export const TILE_COLORS: Record<TileType, string> = {
  grass: '#4a7c3f',
  road: '#8b7355',
  water: '#4a90d9',
  wall: '#6b6b6b',
};

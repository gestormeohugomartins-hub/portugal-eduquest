// ====== Isometric Game Types ======

export const GRID_SIZE = 20; // 20x20 tiles
export const TILE_W = 64;   // isometric tile width
export const TILE_H = 32;   // isometric tile height

export type TileType = 'grass' | 'road' | 'water' | 'wall';

export interface GridTile {
  x: number;
  y: number;
  type: TileType;
  buildingId?: string;
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
}

// ====== Building Definitions ======
export const BUILDING_DEFS: Record<string, BuildingDef> = {
  // Infrastructure
  road: {
    id: 'road', name: 'Estrada', emoji: '🛤️',
    category: 'infrastructure', width: 1, height: 1,
    costCoins: 5, costDiamonds: 0, maxLevel: 3,
    citizenBonus: 0, defenseBonus: 0, xpBonus: 2,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Liga edifícios e permite acesso.',
    upgradeCostMultiplier: 1.5,
  },
  // Residential
  house: {
    id: 'house', name: 'Casa', emoji: '🏠',
    category: 'residential', width: 1, height: 1,
    costCoins: 50, costDiamonds: 0, maxLevel: 5,
    citizenBonus: 5, defenseBonus: 0, xpBonus: 10,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Abrigo para cidadãos. Precisa de estrada.',
    upgradeCostMultiplier: 2,
  },
  mansion: {
    id: 'mansion', name: 'Mansão', emoji: '🏰',
    category: 'residential', width: 2, height: 2,
    costCoins: 200, costDiamonds: 5, maxLevel: 5,
    citizenBonus: 20, defenseBonus: 2, xpBonus: 30,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 3,
    description: 'Grande residência. +20 cidadãos.',
    upgradeCostMultiplier: 2.2,
  },
  // Production
  workshop: {
    id: 'workshop', name: 'Oficina', emoji: '🔨',
    category: 'production', width: 1, height: 1,
    costCoins: 75, costDiamonds: 0, maxLevel: 5,
    citizenBonus: 2, defenseBonus: 0, xpBonus: 15,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Produz recursos extras.',
    upgradeCostMultiplier: 1.8,
  },
  market: {
    id: 'market', name: 'Mercado', emoji: '🏪',
    category: 'production', width: 2, height: 1,
    costCoins: 120, costDiamonds: 2, maxLevel: 5,
    citizenBonus: 3, defenseBonus: 0, xpBonus: 20,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Gera moedas extra por hora.',
    upgradeCostMultiplier: 2,
  },
  // Military
  wall: {
    id: 'wall', name: 'Muralha', emoji: '🧱',
    category: 'military', width: 1, height: 1,
    costCoins: 30, costDiamonds: 0, maxLevel: 5,
    citizenBonus: 0, defenseBonus: 5, xpBonus: 5,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Protege contra invasores.',
    upgradeCostMultiplier: 1.5,
  },
  tower: {
    id: 'tower', name: 'Torre de Defesa', emoji: '🗼',
    category: 'military', width: 1, height: 1,
    costCoins: 150, costDiamonds: 3, maxLevel: 5,
    citizenBonus: 0, defenseBonus: 15, xpBonus: 20,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Ataca invasores à distância.',
    upgradeCostMultiplier: 2.2,
  },
  barracks: {
    id: 'barracks', name: 'Quartel', emoji: '⚔️',
    category: 'military', width: 2, height: 2,
    costCoins: 250, costDiamonds: 5, maxLevel: 5,
    citizenBonus: 0, defenseBonus: 25, xpBonus: 40,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 3,
    description: 'Treina soldados para defesa.',
    upgradeCostMultiplier: 2.5,
  },
  // Decoration
  fountain: {
    id: 'fountain', name: 'Fonte', emoji: '⛲',
    category: 'decoration', width: 1, height: 1,
    costCoins: 40, costDiamonds: 1, maxLevel: 3,
    citizenBonus: 2, defenseBonus: 0, xpBonus: 8,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Embeleza a aldeia.',
    upgradeCostMultiplier: 1.5,
  },
  garden: {
    id: 'garden', name: 'Jardim', emoji: '🌳',
    category: 'decoration', width: 1, height: 1,
    costCoins: 25, costDiamonds: 0, maxLevel: 3,
    citizenBonus: 1, defenseBonus: 0, xpBonus: 5,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Área verde para cidadãos.',
    upgradeCostMultiplier: 1.3,
  },
  statue: {
    id: 'statue', name: 'Estátua', emoji: '🗽',
    category: 'decoration', width: 1, height: 1,
    costCoins: 100, costDiamonds: 5, maxLevel: 3,
    citizenBonus: 5, defenseBonus: 0, xpBonus: 25,
    requiresRoad: false, premiumOnly: true, minVillageLevel: 2,
    description: 'Premium: Estátua decorativa.',
    upgradeCostMultiplier: 2,
  },
  // Premium district monuments
  torre_belem: {
    id: 'torre_belem', name: 'Torre de Belém', emoji: '🏛️',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 30, defenseBonus: 20, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Lisboa. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'lisboa',
  },
  ponte_dom_luis: {
    id: 'ponte_dom_luis', name: 'Ponte D. Luís', emoji: '🌉',
    category: 'monument', width: 3, height: 1,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 25, defenseBonus: 10, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento do Porto. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'porto',
  },
  universidade_coimbra: {
    id: 'universidade_coimbra', name: 'Universidade', emoji: '🎓',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 35, defenseBonus: 5, xpBonus: 120,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Coimbra. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'coimbra',
  },
  castelo_guimaraes: {
    id: 'castelo_guimaraes', name: 'Castelo Guimarães', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 20, defenseBonus: 30, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Braga. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'braga',
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

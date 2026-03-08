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
}

// ====== Building Definitions ======
export const BUILDING_DEFS: Record<string, BuildingDef> = {
  // Infrastructure
  road: {
    id: 'road', name: 'Estrada', emoji: '🛤️',
    category: 'infrastructure', width: 1, height: 1,
    costCoins: 5, costDiamonds: 0, resourceCosts: [{ resource: 'stone', amount: 2 }], maxLevel: 3,
    citizenBonus: 0, defenseBonus: 0, xpBonus: 2,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Liga edifícios e permite acesso.',
    upgradeCostMultiplier: 1.5,
  },
  // Residential
  house: {
    id: 'house', name: 'Casa', emoji: '🏠',
    category: 'residential', width: 1, height: 1,
    costCoins: 50, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 5 }, { resource: 'stone', amount: 3 }], maxLevel: 5,
    citizenBonus: 5, defenseBonus: 0, xpBonus: 10,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Abrigo para cidadãos. Precisa de estrada.',
    upgradeCostMultiplier: 2,
  },
  mansion: {
    id: 'mansion', name: 'Mansão', emoji: '🏰',
    category: 'residential', width: 2, height: 2,
    costCoins: 200, costDiamonds: 5, resourceCosts: [{ resource: 'wood', amount: 15 }, { resource: 'stone', amount: 10 }, { resource: 'iron', amount: 3 }], maxLevel: 5,
    citizenBonus: 20, defenseBonus: 2, xpBonus: 30,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 3,
    description: 'Grande residência. +20 cidadãos.',
    upgradeCostMultiplier: 2.2,
  },
  // Production
  workshop: {
    id: 'workshop', name: 'Oficina', emoji: '🔨',
    category: 'production', width: 1, height: 1,
    costCoins: 75, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 8 }, { resource: 'iron', amount: 2 }], maxLevel: 5,
    citizenBonus: 2, defenseBonus: 0, xpBonus: 15,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Produz recursos extras.',
    upgradeCostMultiplier: 1.8,
  },
  market: {
    id: 'market', name: 'Mercado', emoji: '🏪',
    category: 'production', width: 2, height: 1,
    costCoins: 120, costDiamonds: 2, resourceCosts: [{ resource: 'wood', amount: 10 }, { resource: 'stone', amount: 5 }], maxLevel: 5,
    citizenBonus: 3, defenseBonus: 0, xpBonus: 20,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Gera moedas extra por hora.',
    upgradeCostMultiplier: 2,
  },
  // Military
  wall: {
    id: 'wall', name: 'Muralha', emoji: '🧱',
    category: 'military', width: 1, height: 1,
    costCoins: 30, costDiamonds: 0, resourceCosts: [{ resource: 'stone', amount: 5 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 5, xpBonus: 5,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Protege contra invasores.',
    upgradeCostMultiplier: 1.5,
  },
  tower: {
    id: 'tower', name: 'Torre de Defesa', emoji: '🗼',
    category: 'military', width: 1, height: 1,
    costCoins: 150, costDiamonds: 3, resourceCosts: [{ resource: 'stone', amount: 10 }, { resource: 'iron', amount: 5 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 15, xpBonus: 20,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Ataca invasores à distância.',
    upgradeCostMultiplier: 2.2,
  },
  barracks: {
    id: 'barracks', name: 'Quartel', emoji: '⚔️',
    category: 'military', width: 2, height: 2,
    costCoins: 250, costDiamonds: 5, resourceCosts: [{ resource: 'wood', amount: 12 }, { resource: 'stone', amount: 15 }, { resource: 'iron', amount: 8 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 25, xpBonus: 40,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 3,
    description: 'Treina soldados para defesa.',
    upgradeCostMultiplier: 2.5,
  },
  // Agriculture
  farm: {
    id: 'farm', name: 'Horta', emoji: '🌾',
    category: 'production', width: 2, height: 2,
    costCoins: 80, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 6 }], maxLevel: 5,
    citizenBonus: 0, defenseBonus: 0, xpBonus: 15,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 1,
    description: 'Produz alimentos para a população.',
    upgradeCostMultiplier: 1.8,
  },
  windmill: {
    id: 'windmill', name: 'Moinho', emoji: '🏭',
    category: 'production', width: 2, height: 2,
    costCoins: 200, costDiamonds: 3, resourceCosts: [{ resource: 'wood', amount: 12 }, { resource: 'stone', amount: 8 }, { resource: 'iron', amount: 3 }], maxLevel: 5,
    citizenBonus: 2, defenseBonus: 0, xpBonus: 25,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Processa cereais em farinha. +Alimentação.',
    upgradeCostMultiplier: 2,
  },
  // Services
  hospital: {
    id: 'hospital', name: 'Hospital', emoji: '🏥',
    category: 'infrastructure', width: 2, height: 2,
    costCoins: 300, costDiamonds: 5, resourceCosts: [{ resource: 'wood', amount: 15 }, { resource: 'stone', amount: 12 }, { resource: 'iron', amount: 5 }], maxLevel: 5,
    citizenBonus: 5, defenseBonus: 0, xpBonus: 35,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Cura doenças e previne epidemias.',
    upgradeCostMultiplier: 2.2,
  },
  school_building: {
    id: 'school_building', name: 'Escola', emoji: '🏫',
    category: 'infrastructure', width: 2, height: 2,
    costCoins: 250, costDiamonds: 3, resourceCosts: [{ resource: 'wood', amount: 12 }, { resource: 'stone', amount: 10 }], maxLevel: 5,
    citizenBonus: 8, defenseBonus: 0, xpBonus: 40,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 2,
    description: 'Educa a população. +Cidadãos felizes.',
    upgradeCostMultiplier: 2,
  },
  church: {
    id: 'church', name: 'Igreja', emoji: '⛪',
    category: 'infrastructure', width: 2, height: 2,
    costCoins: 200, costDiamonds: 5, resourceCosts: [{ resource: 'stone', amount: 15 }, { resource: 'wood', amount: 8 }], maxLevel: 5,
    citizenBonus: 5, defenseBonus: 0, xpBonus: 30,
    requiresRoad: true, premiumOnly: false, minVillageLevel: 3,
    description: 'Lugar de culto. Aumenta felicidade.',
    upgradeCostMultiplier: 2,
  },
  well: {
    id: 'well', name: 'Poço', emoji: '🪣',
    category: 'infrastructure', width: 1, height: 1,
    costCoins: 60, costDiamonds: 0, resourceCosts: [{ resource: 'stone', amount: 4 }], maxLevel: 3,
    citizenBonus: 2, defenseBonus: 0, xpBonus: 10,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Fornece água à população.',
    upgradeCostMultiplier: 1.5,
  },
  // Decoration
  fountain: {
    id: 'fountain', name: 'Fonte', emoji: '⛲',
    category: 'decoration', width: 1, height: 1,
    costCoins: 40, costDiamonds: 1, resourceCosts: [{ resource: 'stone', amount: 3 }], maxLevel: 3,
    citizenBonus: 2, defenseBonus: 0, xpBonus: 8,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Embeleza a aldeia.',
    upgradeCostMultiplier: 1.5,
  },
  garden: {
    id: 'garden', name: 'Jardim', emoji: '🌳',
    category: 'decoration', width: 1, height: 1,
    costCoins: 25, costDiamonds: 0, resourceCosts: [{ resource: 'wood', amount: 2 }], maxLevel: 3,
    citizenBonus: 1, defenseBonus: 0, xpBonus: 5,
    requiresRoad: false, premiumOnly: false, minVillageLevel: 1,
    description: 'Área verde para cidadãos.',
    upgradeCostMultiplier: 1.3,
  },
  statue: {
    id: 'statue', name: 'Estátua', emoji: '🗽',
    category: 'decoration', width: 1, height: 1,
    costCoins: 100, costDiamonds: 5, resourceCosts: [{ resource: 'stone', amount: 8 }, { resource: 'iron', amount: 3 }], maxLevel: 3,
    citizenBonus: 5, defenseBonus: 0, xpBonus: 25,
    requiresRoad: false, premiumOnly: true, minVillageLevel: 2,
    description: 'Premium: Estátua decorativa.',
    upgradeCostMultiplier: 2,
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
  // Faro
  fortaleza_sagres: {
    id: 'fortaleza_sagres', name: 'Fortaleza de Sagres', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 15, defenseBonus: 35, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Faro. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'faro',
  },
  // Évora
  templo_romano: {
    id: 'templo_romano', name: 'Templo Romano', emoji: '🏛️',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 30, defenseBonus: 10, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Évora. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'evora',
  },
  // Bragança
  castelo_braganca: {
    id: 'castelo_braganca', name: 'Castelo de Bragança', emoji: '🏯',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 20, defenseBonus: 35, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Bragança. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'braganca',
  },
  // Aveiro
  moliceiro_aveiro: {
    id: 'moliceiro_aveiro', name: 'Canal dos Moliceiros', emoji: '🚣',
    category: 'monument', width: 3, height: 1,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 25, defenseBonus: 5, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Aveiro. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'aveiro',
  },
  // Beja
  castelo_beja: {
    id: 'castelo_beja', name: 'Castelo de Beja', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 20, defenseBonus: 30, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Beja. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'beja',
  },
  // Castelo Branco
  jardim_episcopal: {
    id: 'jardim_episcopal', name: 'Jardim Episcopal', emoji: '🌺',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 30, defenseBonus: 5, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de C. Branco. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'castelo_branco',
  },
  // Guarda
  se_guarda: {
    id: 'se_guarda', name: 'Sé da Guarda', emoji: '⛪',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 25, defenseBonus: 15, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento da Guarda. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'guarda',
  },
  // Leiria
  castelo_leiria: {
    id: 'castelo_leiria', name: 'Castelo de Leiria', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 20, defenseBonus: 30, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Leiria. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'leiria',
  },
  // Portalegre
  castelo_marvao: {
    id: 'castelo_marvao', name: 'Castelo de Marvão', emoji: '🏔️',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 15, defenseBonus: 35, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Portalegre. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'portalegre',
  },
  // Santarém
  castelo_almourol: {
    id: 'castelo_almourol', name: 'Castelo de Almourol', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 20, defenseBonus: 30, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Santarém. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'santarem',
  },
  // Setúbal
  castelo_palmela: {
    id: 'castelo_palmela', name: 'Castelo de Palmela', emoji: '🏰',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 20, defenseBonus: 25, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Setúbal. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'setubal',
  },
  // Viana do Castelo
  santuario_luzia: {
    id: 'santuario_luzia', name: 'Santa Luzia', emoji: '⛪',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 30, defenseBonus: 10, xpBonus: 110,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Viana do Castelo. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'viana_castelo',
  },
  // Vila Real
  solar_mateus: {
    id: 'solar_mateus', name: 'Solar de Mateus', emoji: '🏡',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 30, defenseBonus: 5, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Vila Real. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'vila_real',
  },
  // Viseu
  se_viseu: {
    id: 'se_viseu', name: 'Sé de Viseu', emoji: '⛪',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 25, defenseBonus: 15, xpBonus: 100,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento de Viseu. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'viseu',
  },
  // Açores
  lagoa_sete_cidades: {
    id: 'lagoa_sete_cidades', name: 'Sete Cidades', emoji: '🌋',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
    citizenBonus: 30, defenseBonus: 10, xpBonus: 120,
    requiresRoad: true, premiumOnly: true, minVillageLevel: 1,
    description: 'Monumento dos Açores. Prémio de teste mensal.',
    upgradeCostMultiplier: 1, districtExclusive: 'acores',
  },
  // Madeira
  monte_funchal: {
    id: 'monte_funchal', name: 'Monte do Funchal', emoji: '🚡',
    category: 'monument', width: 2, height: 2,
    costCoins: 0, costDiamonds: 0, maxLevel: 1,
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

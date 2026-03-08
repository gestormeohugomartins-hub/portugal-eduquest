import svgRaw from '@/assets/portugal-districts.svg?raw';

// SVG district ID → our district key mapping
const svgIdToKey: Record<string, string> = {
  'D_Viseu': 'viseu',
  'D_Santarém': 'santarem',
  'D_Évora': 'evora',
  'D_Lisboa': 'lisboa',
  'D_Beja': 'beja',
  'D_Porto': 'porto',
  'D_Braga': 'braga',
  'D_Vila_Real': 'vila_real',
  'D_Bragança': 'braganca',
  'D_Castelo_Branco': 'castelo_branco',
  'D_Leiria': 'leiria',
  'D_Portalegre': 'portalegre',
  'D_Aveiro': 'aveiro',
  'D_Guarda': 'guarda',
  'D_Coimbra': 'coimbra',
  'D_Viana_do_Castelo': 'viana_castelo',
  'D_Setúbal': 'setubal',
  'D_Faro': 'faro',
};

// Human-readable labels for each district
export const districtLabelNames: Record<string, string> = {
  viana_castelo: "V. Castelo",
  braga: "Braga",
  vila_real: "Vila Real",
  braganca: "Bragança",
  porto: "Porto",
  aveiro: "Aveiro",
  viseu: "Viseu",
  guarda: "Guarda",
  coimbra: "Coimbra",
  castelo_branco: "C. Branco",
  leiria: "Leiria",
  santarem: "Santarém",
  portalegre: "Portalegre",
  lisboa: "Lisboa",
  setubal: "Setúbal",
  evora: "Évora",
  beja: "Beja",
  faro: "Faro",
  acores: "Açores",
  madeira: "Madeira",
};

// Hardcoded island label positions (not in mainland SVG)
const islandLabelPositions: Record<string, { x: number; y: number }> = {
  acores: { x: -155, y: 68 },
  madeira: { x: -155, y: 210 },
};

// Compute approximate centroid from an SVG path 'd' attribute
function computeCentroid(d: string): { x: number; y: number } {
  const nums: number[] = [];
  // Extract all numbers from the path
  const regex = /-?\d+\.?\d*/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    nums.push(parseFloat(match[0]));
  }
  if (nums.length < 2) return { x: 0, y: 0 };
  let sumX = 0, sumY = 0, count = 0;
  for (let i = 0; i < nums.length - 1; i += 2) {
    sumX += nums[i];
    sumY += nums[i + 1];
    count++;
  }
  return { x: sumX / count, y: sumY / count };
}

// Cached computed labels
let _districtLabels: Record<string, { label: string; x: number; y: number }> | null = null;

export function getDistrictLabels(paths: Record<string, string>): Record<string, { label: string; x: number; y: number }> {
  if (_districtLabels) return _districtLabels;
  _districtLabels = {};
  for (const [key, label] of Object.entries(districtLabelNames)) {
    if (key === 'acores' || key === 'madeira') {
      _districtLabels[key] = { label, ...islandLabelPositions[key] };
    } else if (paths[key]) {
      const c = computeCentroid(paths[key]);
      _districtLabels[key] = { label, x: c.x, y: c.y };
    }
  }
  return _districtLabels;
}

// Islands paths (manual, since they're not in the mainland SVG)
export const islandPaths: Record<string, string> = {
  acores: "M-195,50 C-192,45 -182,42 -172,41 C-165,40 -158,42 -155,46 C-152,50 -154,56 -160,60 C-166,64 -178,65 -186,62 C-192,60 -196,55 -195,50Z M-148,58 C-144,53 -134,50 -124,51 C-117,52 -112,55 -111,60 C-110,65 -114,70 -122,72 C-130,74 -140,71 -145,67 C-149,64 -150,61 -148,58Z M-122,42 C-118,37 -108,34 -98,35 C-92,36 -88,39 -88,44 C-88,49 -92,54 -100,56 C-108,57 -117,54 -120,50 C-123,47 -123,44 -122,42Z M-172,76 C-168,72 -158,70 -150,72 C-144,74 -140,77 -141,82 C-142,87 -148,91 -156,92 C-164,93 -172,90 -174,85 C-176,81 -175,78 -172,76Z M-128,80 C-124,76 -114,74 -106,76 C-100,78 -97,82 -98,87 C-99,92 -105,96 -113,97 C-121,97 -128,94 -130,89 C-131,85 -130,82 -128,80Z",
  madeira: "M-190,190 C-185,182 -170,178 -150,179 C-135,180 -120,184 -113,192 C-109,197 -111,204 -117,209 C-125,215 -143,219 -160,218 C-177,217 -189,211 -192,204 C-194,199 -193,194 -190,190Z M-163,224 C-159,220 -149,218 -139,220 C-132,222 -128,226 -129,231 C-130,236 -137,240 -145,240 C-153,240 -160,237 -162,232 C-164,229 -164,226 -163,224Z",
};

// Parse the SVG file and extract district paths
let _parsedPaths: Record<string, string> | null = null;

export function getDistrictPaths(): Record<string, string> {
  if (_parsedPaths) return _parsedPaths;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
  const pathElements = doc.querySelectorAll('path[id^="D_"]');

  _parsedPaths = {};
  pathElements.forEach(el => {
    const id = el.getAttribute('id');
    const d = el.getAttribute('d');
    if (id && d && svgIdToKey[id]) {
      _parsedPaths![svgIdToKey[id]] = d;
    }
  });

  // Add islands
  _parsedPaths.acores = islandPaths.acores;
  _parsedPaths.madeira = islandPaths.madeira;

  return _parsedPaths;
}

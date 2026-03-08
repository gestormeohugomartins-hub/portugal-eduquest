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

// Label positions (approximate centroids in the original SVG coordinate space)
// These are in the coordinate system AFTER the translate(-65,0) transform
export const districtLabels: Record<string, { label: string; x: number; y: number }> = {
  viana_castelo: { label: "V. Castelo", x: 62, y: 20 },
  braga: { label: "Braga", x: 78, y: 38 },
  vila_real: { label: "Vila Real", x: 100, y: 32 },
  braganca: { label: "Bragança", x: 140, y: 30 },
  porto: { label: "Porto", x: 68, y: 56 },
  aveiro: { label: "Aveiro", x: 58, y: 82 },
  viseu: { label: "Viseu", x: 100, y: 70 },
  guarda: { label: "Guarda", x: 130, y: 82 },
  coimbra: { label: "Coimbra", x: 73, y: 105 },
  castelo_branco: { label: "C. Branco", x: 115, y: 118 },
  leiria: { label: "Leiria", x: 52, y: 130 },
  santarem: { label: "Santarém", x: 82, y: 155 },
  portalegre: { label: "Portalegre", x: 130, y: 150 },
  lisboa: { label: "Lisboa", x: 38, y: 175 },
  setubal: { label: "Setúbal", x: 55, y: 210 },
  evora: { label: "Évora", x: 105, y: 195 },
  beja: { label: "Beja", x: 98, y: 240 },
  faro: { label: "Faro", x: 100, y: 285 },
  acores: { label: "Açores", x: -155, y: 75 },
  madeira: { label: "Madeira", x: -155, y: 210 },
};

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

// Sprite sheet definitions - maps building IDs to sprite regions
// Each sprite is a crop from the sprite sheet images

import buildingsSprite from '@/assets/buildings-sprite.png';
import mansionSprite from '@/assets/building-mansion.png';
import monumentsSprite from '@/assets/monuments-sprite.png';
import extraSprite from '@/assets/buildings-extra.png';

export interface SpriteRegion {
  image: string;
  sx: number; // source x
  sy: number; // source y
  sw: number; // source width
  sh: number; // source height
}

// Map building IDs to their sprite regions from the sprite sheet
// buildings-sprite.png layout (1024x1024):
// Row 1: house(0,0), workshop(256,0), market(512,0), fountain(768,0)
// Row 2: wall(0,512), tower(256,512), barracks(512,512), road(768,512)
export const BUILDING_SPRITES: Record<string, SpriteRegion> = {
  house:    { image: buildingsSprite, sx: 0,   sy: 0,   sw: 256, sh: 256 },
  workshop: { image: buildingsSprite, sx: 256, sy: 0,   sw: 256, sh: 256 },
  market:   { image: buildingsSprite, sx: 512, sy: 0,   sw: 256, sh: 256 },
  fountain: { image: buildingsSprite, sx: 768, sy: 0,   sw: 256, sh: 256 },
  wall:     { image: buildingsSprite, sx: 0,   sy: 512, sw: 256, sh: 256 },
  tower:    { image: buildingsSprite, sx: 256, sy: 512, sw: 256, sh: 512 },
  barracks: { image: buildingsSprite, sx: 512, sy: 512, sw: 256, sh: 256 },
  road:     { image: buildingsSprite, sx: 768, sy: 512, sw: 256, sh: 256 },
  mansion:  { image: mansionSprite,   sx: 0,   sy: 0,   sw: 512, sh: 512 },
  // Monuments (monuments-sprite.png 1024x1024, 2x2 grid)
  torre_belem:           { image: monumentsSprite, sx: 0,   sy: 0,   sw: 512, sh: 512 },
  templo_romano:         { image: monumentsSprite, sx: 512, sy: 0,   sw: 512, sh: 512 },
  castelo_guimaraes:     { image: monumentsSprite, sx: 0,   sy: 512, sw: 512, sh: 512 },
  universidade_coimbra:  { image: monumentsSprite, sx: 512, sy: 512, sw: 512, sh: 512 },
};

// Image cache for loaded HTMLImageElements
const imageCache = new Map<string, HTMLImageElement>();
const loadingImages = new Map<string, Promise<HTMLImageElement>>();

export function loadSpriteImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);
  if (loadingImages.has(src)) return loadingImages.get(src)!;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      loadingImages.delete(src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
  loadingImages.set(src, promise);
  return promise;
}

export function getSpriteImage(src: string): HTMLImageElement | null {
  return imageCache.get(src) ?? null;
}

// Preload all sprite sheets
export function preloadSprites(): Promise<void> {
  const sources = [buildingsSprite, mansionSprite, monumentsSprite];
  return Promise.all(sources.map(loadSpriteImage)).then(() => {});
}

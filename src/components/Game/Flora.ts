import { Flora } from '../../types';

/**
 * Initialize flora elements
 */
export const initializeFlora = (canvas: HTMLCanvasElement, floraImages: HTMLImageElement[]): Flora[] => {
  if (!canvas) return [];
  
  const MAX_FLORA = 50;
  const floraItems: Flora[] = [];
  
  for (let i = 0; i < MAX_FLORA; i++) {
    const randomImage = floraImages[Math.floor(Math.random() * floraImages.length)];
    const height = 30 + Math.random() * 80;
    const width = (height / randomImage.height) * randomImage.width;
    
    floraItems.push({
      x: canvas.width + (Math.random() * canvas.width),
      y: canvas.height,
      width,
      height,
      image: randomImage,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.3 + Math.random() * 0.4,
      scrollSpeed: 1.5 + Math.random(),
      active: true
    });
  }
  
  return floraItems;
};

/**
 * Draw flora items
 */
export const drawFlora = (
  ctx: CanvasRenderingContext2D, 
  floraItems: Flora[], 
  amplitude: number, 
  factor: number, 
  speedMultiplier: number,
  currentLevelId: number
) => {
  if (!ctx.canvas) return;
  
  // Don't draw flora in level 2
  if (currentLevelId === 2) return;
  
  const canvas = ctx.canvas;
  const time = Date.now() / 1000;
  
  floraItems.forEach((flora) => {
    // Update position
    flora.x -= flora.scrollSpeed * speedMultiplier * factor;
    
    // Reset position if off-screen
    if (flora.x + flora.width < 0) {
      flora.x = canvas.width + (Math.random() * canvas.width);
    }
    
    // Set y position at bottom of canvas
    flora.y = canvas.height;
    
    // Draw with swaying effect
    ctx.save();
    const sway = Math.sin(time * flora.swaySpeed + flora.swayOffset) * (5 + amplitude / 10);
    const pivotX = flora.x + flora.width / 2;
    const pivotY = flora.y;
    
    ctx.translate(pivotX, pivotY);
    ctx.rotate(sway * 0.05);
    ctx.globalAlpha = 0.50;
    ctx.drawImage(flora.image, -flora.width / 2, -flora.height, flora.width, flora.height);
    ctx.restore();
  });
};
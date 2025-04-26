import { Player } from '../../types';

/**
 * Draw the player character (fish)
 */
export const drawPlayer = (
  ctx: CanvasRenderingContext2D, 
  player: Player, 
  fishImage: HTMLImageElement | null
) => {
  if (!fishImage || !fishImage.complete) return;
  
  // Calculate dimensions preserving aspect ratio
  const aspect = fishImage.naturalWidth / fishImage.naturalHeight;
  const drawWidth = player.width * 1.25;
  const drawHeight = drawWidth / aspect;
  
  ctx.save();
  
  // Position at center of player for rotation
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  ctx.translate(centerX, centerY);
  
  // Apply rotation for swimming and spinning effects
  ctx.rotate(player.rotation + player.spinRotation);
  
  // Draw fish image
  ctx.drawImage(fishImage, -drawWidth / 2 + 20, -drawHeight / 2, drawWidth, drawHeight);
  
  // Add visual effect when hit
  if (player.hitTime) {
    const elapsed = Date.now() - player.hitTime;
    if (elapsed < 3000) {
      const overlayAlpha = 1 - (elapsed / 3000);
      const tintColor = player.hitType === 'fishhook' ? '255,0,0' : '0,0,0';
      
      // Create off-screen canvas for tinting effect
      const offscreen = document.createElement('canvas');
      offscreen.width = drawWidth;
      offscreen.height = drawHeight;
      const offCtx = offscreen.getContext('2d');
      
      if (offCtx) {
        // Draw fish to offscreen canvas
        offCtx.drawImage(fishImage, 0, 0, drawWidth, drawHeight);
        
        // Apply tint as overlay
        offCtx.globalCompositeOperation = 'source-atop';
        offCtx.fillStyle = `rgba(${tintColor},${overlayAlpha})`;
        offCtx.fillRect(0, 0, drawWidth, drawHeight);
        
        // Draw the tinted image back to main canvas
        ctx.drawImage(offscreen, -drawWidth / 2 + 20, -drawHeight / 2);
      }
    } else {
      // Reset hit state after effect duration
      player.hitTime = undefined;
      player.hitType = undefined;
    }
  }
  
  ctx.restore();
};

/**
 * Update player position based on input
 */
export const updatePlayerPosition = (
  player: Player,
  targetY: number,
  factor: number,
  isInputActive: boolean
) => {
  if (isInputActive) {
    // Calculate target position based on input
    const targetPlayerY = targetY - (player.height / 2);
    const currentY = player.y;
    const dy = targetPlayerY - currentY;
    
    // Apply smoothing to movement
    player.vy = player.vy * 0.9 + dy * 0.1 ;
    player.y += player.vy * 0.1 * factor;
    
    // Calculate rotation based on vy without the extra factor multiplication
    // This prevents exaggerated tilting when frame rate drops (e.g., during low battery)
    const targetRotation = Math.atan2(player.vy * 0.1, 2) * 0.25;
    player.rotation = targetRotation;
  } else {
    // Gradually slow down when no input
    player.vy *= 0.95;
    player.rotation *= 0.95;
  }
  
  // Handle spin rotation (from collisions or other events)
  if (player.spinRotation !== 0) {
    player.spinRotation *= 0.97;
    if (Math.abs(player.spinRotation) < 0.01) {
      player.spinRotation = 0;
    }
  }
  
  // Reset tiny rotations to zero (only if not actively receiving input)
  if (Math.abs(player.rotation) < 0.01 && !isInputActive) {
    player.rotation = 0;
  }
};

/**
 * Draw player for portrait mode preview
 */
export const drawPlayerPortrait = (
  ctx: CanvasRenderingContext2D,
  fishImage: HTMLImageElement | null,
  position: { x: number, y: number, rotation: number }
) => {
  if (!fishImage || !fishImage.complete || !ctx.canvas) return;
  
  const time = Date.now() / 1000;
  const canvas = ctx.canvas;
  
  // Update fish position with gentle bobbing motion
  position.x = canvas.width * 0.5;
  position.y = canvas.height * 0.25 + Math.sin(time * 2) * 20;
  position.rotation = Math.sin(time * 2) * 0.1;
  
  // Draw the fish
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(position.rotation);
  
  const fishWidth = 100;
  const fishHeight = (fishWidth / fishImage.width) * fishImage.height;
  ctx.drawImage(fishImage, -fishWidth / 2, -fishHeight / 2, fishWidth, fishHeight);
  
  ctx.restore();
  
  return { x: position.x - fishWidth / 2, y: position.y };
};
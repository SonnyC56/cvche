import { Particle, Player } from '../../types';
import { getParticleColorFromStreak } from '../../utils/colorUtils';

/**
 * Draw a heart shape particle
 */
export const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
  ctx.bezierCurveTo(-size / 2, size / 2, 0, size, 0, size);
  ctx.bezierCurveTo(0, size, size / 2, size / 2, size / 2, topCurveHeight);
  ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
  ctx.closePath();
  
  let r = parseInt(color.slice(1), 16) >> 16;
  let g = (parseInt(color.slice(1), 16) >> 8) & 255;
  let b = parseInt(color.slice(1), 16) & 255;
  ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
  ctx.fill();
  ctx.restore();
};

/**
 * Create particles at a specific position
 */
export const createParticles = (particles: Particle[], x: number, y: number, color: string, count: number, shape: 'circle' | 'heart' = 'circle') => {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1.0,
      color,
      size: 3 + Math.random() * 2,
      opacity: 0.7,
      shape,
    });
  }
};

/**
 * Create swimming particles behind the fish based on streak
 */
export const createSwimParticles = (particles: Particle[], player: Player, streak: number) => {
  const fishCenterX = player.x + player.width;
  const fishCenterY = player.y + player.height / 2;
  const tailX = fishCenterX - player.width;
  const particleCount = 1 + Math.floor(streak / 10);
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: tailX + (Math.random() - 0.5) * 10,
      y: fishCenterY + (Math.random() - 0.5) * 10,
      vx: -2 - Math.random() * 2 - (streak * 0.1),
      vy: (Math.random() - 0.5) * (0.5 + streak * 0.05),
      life: 1.0,
      color: getParticleColorFromStreak(streak),
      size: 4 + Math.random() * 3 + (streak * 0.1),
      opacity: 0.8,
      shape: 'circle',
    });
  }
};

/**
 * Create particles for portrait mode animation
 */
export const createPortraitParticles = (particles: Particle[], x: number, y: number) => {
  for (let i = 0; i < 2; i++) {
    particles.push({
      x,
      y: y + (Math.random() - 0.5) * 10,
      vx: -2 - Math.random() * 2,
      vy: (Math.random() - 0.5) * 0.5,
      life: 1.0,
      color: '#FFD700',
      size: 4 + Math.random() * 3,
      opacity: 0.8,
      shape: 'circle'
    });
  }
};

/**
 * Update and draw particles
 */
export const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[], factor: number) => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    // Update position
    p.x += p.vx * factor;
    p.y += p.vy * factor;
    
    // Update life and opacity
    p.life -= 0.02 * factor;
    p.opacity *= 0.97;
    
    // Remove dead particles
    if (p.life <= 0) { 
      particles.splice(i, 1); 
      continue; 
    }
    
    // Draw based on shape
    if (p.shape === 'heart') {
      drawHeart(ctx, p.x, p.y, p.size * p.life * 5, p.color, p.opacity);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      const opacityHex = Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = `${p.color}${opacityHex}`;
      ctx.fill();
    }
  }
};
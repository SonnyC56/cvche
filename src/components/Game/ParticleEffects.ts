import { Particle, Player } from '../../types';
import { getParticleColorFromStreak } from '../../utils/colorUtils';
import { ObjectPool, ColorCache } from '../../utils/objectPool';

// Initialize color cache for performance
const colorCache = new ColorCache();

// Initialize particle pool
const particlePool = new ObjectPool<Particle>(
  // Create function
  () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 1.0,
    color: '#FFFFFF',
    size: 5,
    opacity: 1,
    shape: 'circle'
  }),
  // Reset function
  (particle) => {
    particle.life = 1.0;
    particle.opacity = 1;
  },
  100, // Initial size
  500  // Max size
);

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
  
  // Use color cache for performance
  const { r, g, b } = colorCache.parseColor(color);
  ctx.fillStyle = colorCache.toRGBA(r, g, b, opacity);
  ctx.fill();
  ctx.restore();
};

/**
 * Create particles at a specific position
 */
export const createParticles = (particles: Particle[], x: number, y: number, color: string, count: number, shape: 'circle' | 'heart' = 'circle') => {
  for (let i = 0; i < count; i++) {
    const particle = particlePool.acquire();
    particle.x = x;
    particle.y = y;
    particle.vx = (Math.random() - 0.5) * 8;
    particle.vy = (Math.random() - 0.5) * 8;
    particle.life = 1.0;
    particle.color = color;
    particle.size = 3 + Math.random() * 2;
    particle.opacity = 0.7;
    particle.shape = shape;
    particles.push(particle);
  }
};

/**
 * Create swimming particles behind the fish based on streak
 */
export const createSwimParticles = (particles: Particle[], player: Player, streak: number, customColor?: string) => {
  const fishCenterX = player.x + player.width;
  const fishCenterY = player.y + player.height / 2;
  const tailX = fishCenterX - player.width;
  const particleCount = Math.min(1 + Math.floor(streak / 10), 5); // Cap max particles
  
  for (let i = 0; i < particleCount; i++) {
    const particle = particlePool.acquire();
    particle.x = tailX + (Math.random() - 0.5) * 10;
    particle.y = fishCenterY + (Math.random() - 0.5) * 10;
    particle.vx = -2 - Math.random() * 2 - (streak * 0.1);
    particle.vy = (Math.random() - 0.5) * (0.5 + streak * 0.05);
    particle.life = 1.0;
    particle.color = customColor || getParticleColorFromStreak(streak);
    particle.size = 4 + Math.random() * 3 + (streak * 0.1);
    particle.opacity = 0.8;
    particle.shape = 'circle';
    particles.push(particle);
  }
};

/**
 * Create particles for portrait mode animation
 */
export const createPortraitParticles = (particles: Particle[], x: number, y: number) => {
  for (let i = 0; i < 2; i++) {
    const particle = particlePool.acquire();
    particle.x = x;
    particle.y = y + (Math.random() - 0.5) * 10;
    particle.vx = -2 - Math.random() * 2;
    particle.vy = (Math.random() - 0.5) * 0.5;
    particle.life = 1.0;
    particle.color = '#FFD700';
    particle.size = 4 + Math.random() * 3;
    particle.opacity = 0.8;
    particle.shape = 'circle';
    particles.push(particle);
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
    // Remove dead particles and return to pool
    if (p.life <= 0 || p.opacity <= 0.01) {
      // Return to pool
      particlePool.release(p);
      // Swap the dead particle with the last particle
      particles[i] = particles[particles.length - 1];
      // Remove the last particle (which is now the dead one or a duplicate)
      particles.pop();
      continue; // Skip drawing this particle as it's now replaced or removed
    }
    
    // Draw based on shape
    if (p.shape === 'heart') {
      drawHeart(ctx, p.x, p.y, p.size * p.life * 5, p.color, p.opacity);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      // Use color cache for performance
      const { r, g, b } = colorCache.parseColor(p.color);
      ctx.fillStyle = colorCache.toRGBA(r, g, b, p.opacity);
      ctx.fill();
    }
  }
};

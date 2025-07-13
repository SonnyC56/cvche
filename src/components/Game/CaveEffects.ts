import { CaveState, Player, Particle } from '../../types';
import { createParticles } from './ParticleEffects';
import { TrigCache } from '../../utils/objectPool';

// Initialize trig cache for performance
const trigCache = new TrigCache();

// Cache for cave boundary calculations
let lastCaveUpdate = 0;
const CAVE_UPDATE_INTERVAL = 50; // Update cave every 50ms instead of every frame

/**
 * Update cave boundaries based on audio amplitude
 */
export const updateCaveBoundaries = (
  canvas: HTMLCanvasElement | null,
  cave: CaveState,
  amplitude: number,
  isDesktop: boolean
) => {
  if (!canvas) return;
  
  const now = Date.now();
  
  // Only update cave boundaries at intervals, not every frame
  if (now - lastCaveUpdate < CAVE_UPDATE_INTERVAL) {
    return;
  }
  lastCaveUpdate = now;
  
  const time = now / 1000;
  cave.upper.points = [];
  cave.lower.points = [];
  
  const playerMinWidth = 50; // Default player width
  const minCaveHeight = playerMinWidth * 3;
  const maxAmplitude = (canvas.height - minCaveHeight) / 2;
  const computedBeatAmplitude = amplitude * 4;
  
  // Limit amplitude more for desktop to avoid difficult gameplay
  const effectiveBeatAmplitude = isDesktop
    ? Math.min(computedBeatAmplitude, 50)
    : Math.min(computedBeatAmplitude, maxAmplitude);
  
  const centerY = canvas.height / 2;
  
  // Create cave boundary points with reduced frequency and cached trig
  for (let x = 0; x <= canvas.width; x += 20) { // Increased from 10 to 20
    const waveOffset = trigCache.sin(x / 150 + time * 3) * effectiveBeatAmplitude +
      trigCache.sin(x / 75 + time * 2) * (effectiveBeatAmplitude * 0.5) +
      trigCache.sin(x / 37.5 + time * 4) * (effectiveBeatAmplitude * 0.25);
    
    const curveY = centerY + waveOffset;
    
    cave.upper.points.push({
      x,
      y: curveY - minCaveHeight - (effectiveBeatAmplitude * 0.5)
    });
    
    cave.lower.points.push({
      x,
      y: curveY + minCaveHeight + (effectiveBeatAmplitude * 0.5)
    });
  }
};

/**
 * Draw cave effect
 */
export const drawCaveEffect = (
  ctx: CanvasRenderingContext2D,
  cave: CaveState,
  amplitude: number,
  isWarningPeriod: boolean,
  levelId: number = 1 // Default to level 1 if not specified
) => {
  const canvas = ctx.canvas;
  if (!canvas) return;
  
  ctx.save();
  
  const isLevel2 = levelId === 2;
  
  // For level 2, only apply animation during warning period
  // For level 1, keep the existing behavior
  let caveFillOpacity;
  
  if (isLevel2) {
    caveFillOpacity = isWarningPeriod
      ? 0.5 + 0.5 * Math.abs(trigCache.sin(Date.now() / 100)) // Only animate during warning
      : 0.9; // Fixed opacity for level 2 outside warning period
  } else {
    // Original behavior for level 1
    caveFillOpacity = isWarningPeriod
      ? 0.5 + 0.5 * Math.abs(trigCache.sin(Date.now() / 100))
      : 0.75;
  }
  
  // Choose color based on level - fixed colors with no animation except during warning
  const caveColor = isLevel2 
    ? `rgba(255, 105, 180, ${caveFillOpacity})` // Hot pink for level 2
    : `rgba(26, 26, 26, ${caveFillOpacity})`; // Black for level 1
  
  // Draw upper cave wall
  ctx.fillStyle = caveColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  cave.upper.points.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(canvas.width, 0);
  ctx.fill();
  
  // Draw lower cave wall
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  cave.lower.points.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(canvas.width, canvas.height);
  ctx.fill();
  
  // Only draw center line for level 1
  if (!isLevel2) {
    // Draw center line with glow effect
    ctx.beginPath();
    const caveStrokeOpacity = isWarningPeriod
      ? 0.5 + 0.5 * Math.abs(Math.sin(Date.now() / 100))
      : 0.3 + (amplitude / 255) * 0.7;
    
    // Draw center line connecting upper and lower cave points
    cave.upper.points.forEach((point, i) => {
      const lowerPoint = cave.lower.points[i];
      const centerY = (point.y + lowerPoint.y) / 2;
      if (i === 0) {
        ctx.moveTo(point.x, centerY);
      } else {
        ctx.lineTo(point.x, centerY);
      }
    });
    
    // Give it a nice glow effect
    const hue = 120; // Green hue for center line
    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${caveStrokeOpacity})`;
    ctx.lineWidth = 4 + (amplitude / 255) * 6;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = amplitude / 10;
    ctx.stroke();
  }
  
  ctx.restore();
};

/**
 * Check if player collides with cave walls and handle collision
 */
export const checkCaveCollision = (
  player: Player,
  cave: CaveState,
  isWarningPeriod: boolean,
  lastCollisionTimeRef: React.MutableRefObject<number>,
  particles: Particle[],
  hitSound: HTMLAudioElement | null,
  setScore: (callback: (prev: number) => number) => void,
  setHealth: (callback: (prev: number) => number) => void,
  scorePopups: any[],
  setStreak: (value: number) => void,
  setMultiplier: (value: number) => void,
  setLevelEnded: (value: boolean) => void,
  gameLoopRef: React.MutableRefObject<boolean>,
  animationFrameIdRef: React.MutableRefObject<number | null>
): boolean => {
  if (isWarningPeriod) return false;
  
  const playerBox = {
    top: player.y,
    bottom: player.y + player.height,
    left: player.x,
    right: player.x + player.width
  };
  
  // Check collision with cave walls
  for (let i = 1; i < cave.upper.points.length; i++) {
    const upperP1 = cave.upper.points[i - 1];
    const upperP2 = cave.upper.points[i];
    const lowerP1 = cave.lower.points[i - 1];
    const lowerP2 = cave.lower.points[i];
    
    if (playerBox.right >= upperP1.x && playerBox.left <= upperP2.x) {
      const t = (playerBox.left - upperP1.x) / (upperP2.x - upperP1.x);
      const upperY = upperP1.y + t * (upperP2.y - upperP1.y);
      const lowerY = lowerP1.y + t * (lowerP2.y - lowerP1.y);
      
      if (playerBox.top <= upperY || playerBox.bottom >= lowerY) {
        const collisionX = playerBox.top <= upperY ? player.x : player.x;
        const collisionY = playerBox.top <= upperY ? upperY : lowerY;
        
        const now = Date.now();
        const PROXIMITY_SCORE_COOLDOWN = 500;
        
        // Don't process collision too frequently
        if (now - lastCollisionTimeRef.current > PROXIMITY_SCORE_COOLDOWN) {
          lastCollisionTimeRef.current = now;
          
          // Create particles at collision point
          createParticles(particles, collisionX, collisionY, '#000000', 30);
          createParticles(particles, collisionX, collisionY, '#FFFFFF', 15);
          
          // Reduce score
          setScore(prev => Math.max(0, prev - 30));
          
          // Reset streak
          setStreak(0);
          setMultiplier(1);
          
          // Show score popup
          scorePopups.push({
            x: collisionX,
            y: collisionY,
            text: "-30",
            opacity: 1,
            lifetime: 100
          });
          
          // Play hit sound
          hitSound?.play().catch(console.error);
          
          // Apply effects to player
          player.spinRotation = Math.PI * 2;
          player.hitTime = now;
          player.hitType = 'obstacle';
          
          // Reduce health
          setHealth(prev => {
            const newHealth = prev - 1;
            if (newHealth <= 0) {
              setLevelEnded(true);
              gameLoopRef.current = false;
              if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
              }
            }
            return newHealth;
          });
          
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Calculate player proximity to center of cave and reward points
 */
export const calculateCaveProximityScore = (
  player: Player,
  cave: CaveState,
  lastProximityScoreTimeRef: React.MutableRefObject<number>,
  setScore: (callback: (prev: number) => number) => void,
  scorePopups: any[]
) => {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  let nearestCenterY = 0;
  let nearestPoint = cave.upper.points[0];
  
  // Find the nearest cave center point to the player
  for (let i = 0; i < cave.upper.points.length; i++) {
    const point = cave.upper.points[i];
    const lowerPoint = cave.lower.points[i];
    const centerY = (point.y + lowerPoint.y) / 2;
    
    if (Math.abs(point.x - playerCenterX) < Math.abs(nearestPoint.x - playerCenterX)) {
      nearestPoint = point;
      nearestCenterY = centerY;
    }
  }
  
  // Calculate proximity to center (1.0 = directly in center, 0.0 = far from center)
  const maxDistance = (cave.upper.points.length > 0 && cave.lower.points.length > 0) ? 
    (cave.lower.points[0].y - cave.upper.points[0].y) / 6 : 100;
  
  const distance = Math.abs(playerCenterY - nearestCenterY);
  const proximity = 1 - Math.min(distance / maxDistance, 1);
  
  // Award points for staying in the center
  const now = Date.now();
  const PROXIMITY_SCORE_COOLDOWN = 500;
  
  if (proximity > 0.5 && now - lastProximityScoreTimeRef.current > PROXIMITY_SCORE_COOLDOWN) {
    lastProximityScoreTimeRef.current = now;
    const proximityBonus = Math.floor(proximity * 50);
    
    if (proximityBonus > 0) {
      setScore(prev => prev + proximityBonus);
      
      scorePopups.push({
        x: player.x,
        y: player.y - 30,
        text: `+${proximityBonus}`,
        opacity: 1,
        lifetime: 60
      });
    }
  }
  
  return proximity;
};
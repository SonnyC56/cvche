import { Bubble, LevelToggles } from '../../types';
import { GradientCache, ColorCache } from '../../utils/objectPool';

// Initialize caches for performance
const gradientCache = new GradientCache();
const colorCache = new ColorCache();

/**
 * Draw the background of the game
 */
export const drawBackground = (
  ctx: CanvasRenderingContext2D, 
  amplitudeFactor: number, 
  backgroundColorRef: React.MutableRefObject<string>,
  currentLevelId: number,
  showBackgroundPattern: boolean,
  bgPatternBubblesRef: React.MutableRefObject<Bubble[]>,
  levelToggles?: LevelToggles
) => {
  if (!ctx.canvas) return;
  amplitudeFactor = 1; // Placeholder for actual amplitude factor
  
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Skip drawing background for level 2 (video background)
  if (currentLevelId === 2) {
    ctx.clearRect(0, 0, width, height);
    
    // Draw color shift overlay for level 2 if enabled
    if (levelToggles?.showColorShiftOverlay && levelToggles?.overlayColor) {
      ctx.save();
      ctx.fillStyle = levelToggles.overlayColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
    return;
  }
  
  // Fill with base color
  ctx.fillStyle = backgroundColorRef.current;
  ctx.fillRect(0, 0, width, height);
  
  // Create radial gradient for glow effect using cache
  const gradientSize = Math.max(width, height) * (0.8 + amplitudeFactor * 0.4);
  const alpha = 0.15 + amplitudeFactor * 0.2;
  const gradient = gradientCache.getRadialGradient(
    ctx,
    width / 2, height / 2, 0,
    width / 2, height / 2, gradientSize,
    [
      [0, `rgba(255,255,255,${alpha})`],
      [0.5, `rgba(255,255,255,${alpha * 0.5})`],
      [1, 'rgba(255,255,255,0)']
    ]
  );
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Create vignette effect using cache
  const vignetteAlpha1 = 0.2 + amplitudeFactor * 0.1;
  const vignetteAlpha2 = 0.3 + amplitudeFactor * 0.15;
  const vignetteGradient = gradientCache.getRadialGradient(
    ctx,
    width / 2, height / 2, 0,
    width / 2, height / 2, width * 0.7,
    [
      [0, 'rgba(0,0,0,0)'],
      [0.7, `rgba(0,0,0,${vignetteAlpha1})`],
      [1, `rgba(0,0,0,${vignetteAlpha2})`]
    ]
  );
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw background pattern if enabled
  if (showBackgroundPattern) {
    drawBackgroundPattern(ctx, amplitudeFactor, bgPatternBubblesRef);
  }
};

/**
 * Draw the background pattern
 */
export const drawBackgroundPattern = (
  ctx: CanvasRenderingContext2D, 
  amplitudeFactor: number, 
  bgPatternBubblesRef: React.MutableRefObject<Bubble[]>
) => {
  if (!ctx.canvas) return;
  
  ctx.save();
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const currentTime = Date.now();
  
  // Create wave pattern at bottom - optimized
  const timeOffset = currentTime / 1000;
  const baseFrequency = 4 + Math.sin(timeOffset) * 2 * (1 + amplitudeFactor * 0.5);
  const waveAmplitude = 50 + amplitudeFactor * 70;
  
  // Reduce iteration frequency and bubble spawn rate
  for (let x = 0; x <= width; x += 10) { // Changed from 5 to 10
    const y = height + Math.sin((x / width * baseFrequency * Math.PI) + timeOffset) * waveAmplitude;
    
    // Randomly add bubbles with reduced frequency
    if (Math.random() < 0.05 && bgPatternBubblesRef.current.length < 50) { // Limit total bubbles
      bgPatternBubblesRef.current.push({
        x,
        y,
        radius: 2 + Math.random() * 2,
        speed: 0.3 + Math.random() * 0.2,
        opacity: 1,
      });
    }
  }
  
  // Update and draw bubbles
  for (let i = bgPatternBubblesRef.current.length - 1; i >= 0; i--) {
    const bubble = bgPatternBubblesRef.current[i];
    bubble.y -= bubble.speed;
    bubble.opacity -= 0.005;
    
    if (bubble.opacity <= 0 || bubble.y + bubble.radius < 0) {
      bgPatternBubblesRef.current.splice(i, 1);
      continue;
    }
    
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(173,216,230,${bubble.opacity})`;
    ctx.fill();
  }
  
  ctx.restore();
};

/**
 * Draw the audio spectrum visualizer
 */
export const drawSpectrum = (
  ctx: CanvasRenderingContext2D, 
  analyserRef: React.MutableRefObject<AnalyserNode | null>,
  dataArrayRef: React.MutableRefObject<Uint8Array | null>,
  waveColorRef: React.MutableRefObject<string>
) => {
  const analyser = analyserRef.current;
  const dataArray = dataArrayRef.current;
  
  if (!analyser || !dataArray || !ctx.canvas) return;
  
  const barWidth = (ctx.canvas.width / dataArray.length) * 2.5;
  let posX = 0;
  
  analyser.getByteFrequencyData(dataArray);
  
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = dataArray[i] / 2;
    // Use color cache for performance
    const { r, g, b } = colorCache.parseColor(waveColorRef.current);
    const startColor = colorCache.toRGBA(r, g, b, 0.3);
    const endColor = colorCache.toRGBA(r, g, b, 0);
    
    const gradient = gradientCache.getLinearGradient(
      ctx,
      0, ctx.canvas.height,
      0, ctx.canvas.height - barHeight,
      [
        [0, startColor],
        [1, endColor]
      ]
    );
    
    ctx.fillStyle = gradient;
    ctx.fillRect(posX, ctx.canvas.height - barHeight, barWidth, barHeight);
    
    posX += barWidth + 1;
  }
};

/**
 * Update and draw bubble effects
 */
export const updateAndDrawBubbles = (ctx: CanvasRenderingContext2D, bubbles: Bubble[], amplitude: number, factor: number) => {
  const canvas = ctx.canvas;
  if (!canvas) return;
  
  // Add new bubbles based on audio amplitude
  if (Math.random() < (amplitude / 255) * 0.5) {
    bubbles.push({
      x: Math.random() * canvas.width,
      y: canvas.height,
      radius: 2 + Math.random() * 3,
      speed: 1 + Math.random() * 2,
      opacity: 1,
    });
  }
  
  // Update and draw existing bubbles
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    bubble.y -= bubble.speed * factor;
    bubble.opacity -= 0.005 * factor;
    
    if (bubble.opacity <= 0 || bubble.y + bubble.radius < 0) {
      bubbles.splice(i, 1);
      continue;
    }
    
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(173,216,230,${bubble.opacity})`;
    ctx.fill();
  }
};

/**
 * Update and draw score popups
 */
export const updateAndDrawScorePopups = (ctx: CanvasRenderingContext2D, popups: any[], factor: number) => {
  for (let i = popups.length - 1; i >= 0; i--) {
    const popup = popups[i];
    
    ctx.save();
    ctx.font = "20px Orbitron";
    ctx.fillStyle = "black";
    ctx.globalAlpha = popup.opacity;
    ctx.fillText(popup.text, popup.x, popup.y);
    ctx.restore();
    
    popup.y -= 0.5 * factor;
    popup.lifetime -= factor;
    popup.opacity = popup.lifetime / 100;
    
    if (popup.lifetime <= 0) popups.splice(i, 1);
  }
};

/**
 * Update and draw timed text events
 */

export const updateAndDrawTimedTexts = (ctx: CanvasRenderingContext2D, activeTimedTexts: any[], factor: number) => {
  if (!ctx.canvas) return;
  
  // Remove expired text events before processing
  for (let i = activeTimedTexts.length - 1; i >= 0; i--) {
    activeTimedTexts[i].lifetime -= factor;
    if (activeTimedTexts[i].lifetime <= 0) {
      activeTimedTexts.splice(i, 1);
    }
  }
  
  // Only display one text at a time (the most recent one)
  if (activeTimedTexts.length > 0) {
    const item = activeTimedTexts[activeTimedTexts.length - 1];
    let fontSize = 80;
    const margin = 40;
    
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Adjust font size to fit within canvas width
    let textWidth;
    do {
      ctx.font = `${fontSize}px Orbitron`;
      textWidth = ctx.measureText(item.text).width;
      if (textWidth > (ctx.canvas?.width ?? 400) - margin) {
        fontSize -= 2;
      } else {
        break;
      }
    } while (fontSize > 10);
    
    const opacity = item.lifetime / 200;
    ctx.fillStyle = item.color ?? `rgba(0, 0, 0, ${opacity})`;
    ctx.fillText(item.text, (ctx.canvas?.width ?? 400) / 2, (ctx.canvas?.height ?? 200) / 2);
    ctx.restore();
  }
};
import { GameState, LevelToggles, ActiveTimedText, TimedTextEvent, TimedColorEvent, Level2TimedEvents, Level3TimedEvents, ActiveColor, Bubble, StreakDisplay, Level, CaveState } from '../../types';
import { getMultiplierFromStreak, interpolateColor } from '../../utils/colorUtils';
import { drawBackground, updateAndDrawBubbles, updateAndDrawScorePopups, updateAndDrawTimedTexts } from './BackgroundEffects';
import { drawFlora } from './Flora';
import { drawPlayer, updatePlayerPosition } from './Player';
import { createSwimParticles, updateAndDrawParticles } from './ParticleEffects';
import { updateCaveBoundaries, drawCaveEffect, checkCaveCollision, calculateCaveProximityScore } from './CaveEffects';
import { processColorEvents, processLevel2Events, processLevel3Events, spawnItemsOnBeat, updateAndCheckObstacleCollisions, updateAndCheckTrashCollisions, updateLevelToggles } from './GameHelpers';

// Use a constant top buffer to ensure nothing spawns behind the hearts
const TOP_BUFFER = 80;

// Get a random Y position for spawning items
export const getSpawnY = (canvas: HTMLCanvasElement | null, itemHeight: number): number => {
  if (!canvas) return TOP_BUFFER;
  return TOP_BUFFER + Math.random() * (canvas.height - TOP_BUFFER - itemHeight);
};

// Get a safe spawn Y position that avoids overlapping with existing obstacles
export const getSafeSpawnY = (
  canvas: HTMLCanvasElement | null, 
  itemHeight: number,
  existingObstacles: any[],
  minDistance: number = 100
): number => {
  if (!canvas) return TOP_BUFFER;
  
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const y = getSpawnY(canvas, itemHeight);
    
    // Check if this Y position conflicts with existing obstacles
    const hasConflict = existingObstacles.some(obstacle => {
      // Only check recently spawned obstacles (within screen)
      if (obstacle.x > canvas.width - 200) {
        const distance = Math.abs(obstacle.y - y);
        return distance < minDistance;
      }
      return false;
    });
    
    if (!hasConflict) {
      return y;
    }
    
    attempts++;
  }
  
  // Fallback to regular spawn if no safe position found
  return getSpawnY(canvas, itemHeight);
};

// Draw a game item (trash, obstacle, etc)
export const drawItem = (
  ctx: CanvasRenderingContext2D,
  item: any,
  pulse: number
) => {
  ctx.save();

  if (
    (item.type === 'trash' ||
      item.type === 'flipflop' ||
      item.type === 'toothbrush' ||
      item.type === 'hotdog' ||
      item.type === 'rubberducky') && item.pickupImage
  ) {
    // Rotate trash items for visual interest
    item.rotation = (item.rotation || 0) + 0.0125;

    // Calculate dimensions preserving aspect ratio
    const aspect = item.pickupImage!.naturalWidth / item.pickupImage!.naturalHeight;
    const effectiveWidth = item.width * pulse;
    const effectiveHeight = effectiveWidth / aspect;

    // Draw with rotation
    const centerX = item.x + effectiveWidth / 2;
    const centerY = item.y + effectiveHeight / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(item.rotation!);
    ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
  }
  else if (item.type === 'obstacle' && (item.pickupImage || item.animator)) {
    // Check if the item is a cloud, bus, or eagle (which shouldn't rotate)
    const isCloud = item.pickupImage?.src.includes('clouds');
    const isBus = item.pickupImage?.src.includes('bus');
    const isEagle = item.pickupImage?.src.includes('eagle');
    const isGull = item.pickupImage?.src.includes('black-headed-gull');
    const isBat = item.animator && !item.pickupImage; // Bats have animator but no pickupImage

    const effectiveWidth = item.width, effectiveHeight = item.height;
    const centerX = item.x + effectiveWidth / 2, centerY = item.y + effectiveHeight / 2;

    // Handle animated bats GIF specially
    if (isBat && item.animator && item.animator.isLoaded()) {
      ctx.translate(centerX, centerY);
      // Use the FrameAnimator to draw the animated bat with flapping wings
      // Animation frame updating is handled automatically inside draw()
      item.animator.draw(ctx, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
    }
    // Only rotate if it's not a cloud, bus, eagle, or gull
    else if (!isCloud && !isBus && !isEagle && !isGull && !isBat) {
      item.rotation = (item.rotation || 0) + 0.0125;
      ctx.translate(centerX, centerY);
      ctx.rotate(item.rotation!);
      ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
    } else {
      // Draw without rotation for clouds and buses
      ctx.translate(centerX, centerY);

      // Apply dark grey filter for clouds during storm
      if (isCloud && item.stormEffect) {
        // Save context to restore after applying filters
        ctx.save();
        // Apply stronger dark grey filter
        ctx.filter = 'brightness(0.4) contrast(1.4) grayscale(1.0)';
        ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
        ctx.restore();
      } else {
        ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
      }
    }
  }
  else if (item.type === 'fishhook' && item.pickupImage) {
    // Handle fishhooks
    const effectiveWidth = item.width, effectiveHeight = item.height;
    const centerX = item.x + effectiveWidth / 2, centerY = item.y + effectiveHeight / 2;
    ctx.drawImage(item.pickupImage, centerX - effectiveWidth / 2, centerY - effectiveHeight / 2, effectiveWidth, effectiveHeight);
  }
  else {
    // Fallback red rectangle for missing images
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, item.width, item.height);
  }

  ctx.restore();
};

// Performance monitoring
let frameCount = 0;
let lastFPSUpdate = 0;
let currentFPS = 60;
let frameDrops = 0;
const FPS_UPDATE_INTERVAL = 1000; // Update FPS every second
const TARGET_FPS = 60;
const MAX_FRAME_SKIP = 5;

// Export performance metrics for external monitoring
export const getPerformanceMetrics = () => ({
  currentFPS,
  frameDrops,
  targetFPS: TARGET_FPS
});

// Main game loop
export const gameLoop = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  gameStateRef: React.MutableRefObject<GameState>,
  lastFrameTimeRef: React.MutableRefObject<number>,
  gameLoopRef: React.MutableRefObject<boolean>,
  animationFrameIdRef: React.MutableRefObject<number | null>,

  // Audio and input
  audioRef: React.RefObject<HTMLAudioElement>,
  audioProgressRef: React.MutableRefObject<number>,
  getAverageAmplitude: () => number,
  detectBeat: (amplitude: number, lastBeatTimeRef: React.MutableRefObject<number>) => boolean,
  lastBeatTimeRef: React.MutableRefObject<number>,
  inputRef: React.MutableRefObject<{ isTouching: boolean; touchY: number; isDesktop: boolean }>,

  // Visuals
  backgroundColorRef: React.MutableRefObject<string>,
  waveColorRef: React.MutableRefObject<string>,
  activeColorTransitionRef: React.MutableRefObject<ActiveColor>,
  bgPatternBubblesRef: React.MutableRefObject<Bubble[]>,
  levelTogglesRef: React.MutableRefObject<LevelToggles>,
  bubblesRef: React.MutableRefObject<Bubble[]>,
  amplitudeRef: React.MutableRefObject<number>,
  activeTimedTextsRef: React.MutableRefObject<ActiveTimedText[]>,
  floraItemsRef: React.MutableRefObject<any[]>,
  streakDisplayRef: React.MutableRefObject<StreakDisplay>,

  // Images
  fishImageRef: React.RefObject<HTMLImageElement>,
  waterBottleRef: React.RefObject<HTMLImageElement>,
  plasticBagRef: React.RefObject<HTMLImageElement>,
  oilSplatImageRef: React.RefObject<HTMLImageElement>,
  fishHookRef: React.RefObject<HTMLImageElement>,
  flipflopRef: React.RefObject<HTMLImageElement>,
  toothbrushRef: React.RefObject<HTMLImageElement>,
  hotdogRef: React.RefObject<HTMLImageElement>,
  rubberDuckyRef: React.RefObject<HTMLImageElement>,
  level2ObstacleImagesRef: React.MutableRefObject<HTMLImageElement[]>,
  level2PickupImagesRef: React.MutableRefObject<HTMLImageElement[]>,
  level3ObstacleImagesRef: React.MutableRefObject<HTMLImageElement[]>,
  level3MushroomImagesRef: React.MutableRefObject<HTMLImageElement[]>,
  level3TrippyImagesRef: React.MutableRefObject<HTMLImageElement[]>,

  // Level data
  currentLevelRef: React.MutableRefObject<Level>,
  timedTextEventsRef: React.MutableRefObject<TimedTextEvent[]>,
  colorEventsRef: React.MutableRefObject<TimedColorEvent[]>,
  level2TimedEventsRef: React.MutableRefObject<Level2TimedEvents>,
  level3TimedEventsRef: React.MutableRefObject<Level3TimedEvents>,
  caveRef: React.MutableRefObject<CaveState>,
  speedMultiplier: React.MutableRefObject<number>,

  // Game state setters
  setScore: (value: number) => void,
  setHealth: (callback: (prev: number) => number) => void,
  setLevelEnded: (value: boolean) => void,

  // Collision handling
  lastCollisionTimeRef: React.MutableRefObject<number>,
  lastProximityScoreTimeRef: React.MutableRefObject<number>,

  // Sound effects
  pickupSoundRef: React.RefObject<HTMLAudioElement>,
  hitSoundRef: React.RefObject<HTMLAudioElement>
) => {
  if (!gameLoopRef.current || !canvasRef.current) return;
  const ctx = canvasRef.current.getContext('2d');
  if (!ctx) return;
  
  // Get current time for delta time calculation
  const nowTime = performance.now();
  
  // Performance monitoring (removed frame rate limiting for smooth fish dragging)
  const timeSinceLastFrame = nowTime - lastFrameTimeRef.current;
  
  // Update FPS counter
  frameCount++;
  if (nowTime - lastFPSUpdate >= FPS_UPDATE_INTERVAL) {
    currentFPS = Math.round((frameCount * 1000) / (nowTime - lastFPSUpdate));
    frameCount = 0;
    lastFPSUpdate = nowTime;
    
    // Detect significant frame drops
    if (currentFPS < TARGET_FPS * 0.8) {
      frameDrops++;
      // Could trigger quality reduction here if needed
    }
  }
  
  // Calculate delta time with improved capping
  let deltaTime = timeSinceLastFrame / 1000;
  
  // More aggressive capping for extreme values
  if (deltaTime > 0.1) {
    deltaTime = 0.016667; // Force to 60fps equivalent
  }
  
  // Update last frame time
  lastFrameTimeRef.current = nowTime;
  
  // Calculate factor using capped delta time with smoother interpolation
  const targetFactor = deltaTime * 120;
  const factor = Math.min(targetFactor, MAX_FRAME_SKIP);
  const canvas = canvasRef.current;
  const audioTime = audioRef.current?.currentTime || 0;
  const songDuration = audioRef.current?.duration || 1;
  
  // Early exit if audio hasn't started
  if (!audioRef.current || audioTime === 0) {
    animationFrameIdRef.current = requestAnimationFrame(() => gameLoop(
      canvasRef, gameStateRef, lastFrameTimeRef, gameLoopRef, animationFrameIdRef,
      audioRef, audioProgressRef, getAverageAmplitude, detectBeat, lastBeatTimeRef,
      inputRef, backgroundColorRef, waveColorRef, activeColorTransitionRef,
      bgPatternBubblesRef, levelTogglesRef, bubblesRef, amplitudeRef,
      activeTimedTextsRef, floraItemsRef, streakDisplayRef, fishImageRef,
      waterBottleRef, plasticBagRef, oilSplatImageRef, fishHookRef,
      flipflopRef, toothbrushRef, hotdogRef, rubberDuckyRef,
      level2ObstacleImagesRef, level2PickupImagesRef, level3ObstacleImagesRef,
      level3MushroomImagesRef, level3TrippyImagesRef, currentLevelRef,
      timedTextEventsRef, colorEventsRef, level2TimedEventsRef,
      level3TimedEventsRef, caveRef, speedMultiplier, setScore,
      setHealth, setLevelEnded, lastCollisionTimeRef, lastProximityScoreTimeRef,
      pickupSoundRef, hitSoundRef
    ));
    return;
  }
  updateLevelToggles(audioTime, currentLevelRef.current.id, levelTogglesRef);
  if (currentLevelRef.current.id === 2) {
    processLevel2Events(
      audioTime,
      canvasRef.current,
      level2TimedEventsRef.current,
      level2ObstacleImagesRef.current,
      level2PickupImagesRef.current,
      gameStateRef.current
    );
  } else if (currentLevelRef.current.id === 3) {
    processLevel3Events(
      audioTime,
      canvasRef.current,
      level3TimedEventsRef.current,
      level3ObstacleImagesRef.current,
      level3MushroomImagesRef.current,
      level3TrippyImagesRef.current,
      gameStateRef.current
    );
  }
  processColorEvents(audioTime, colorEventsRef.current, activeColorTransitionRef.current, backgroundColorRef, waveColorRef);
  // Interpolate active color transition for background and wave colors
  if (activeColorTransitionRef.current.progress < 1) {
    activeColorTransitionRef.current.progress += factor / (activeColorTransitionRef.current.transitionDuration * 60);
    if (activeColorTransitionRef.current.progress > 1) activeColorTransitionRef.current.progress = 1;
    backgroundColorRef.current = interpolateColor(
      activeColorTransitionRef.current.backgroundColor,
      activeColorTransitionRef.current.targetBackgroundColor,
      activeColorTransitionRef.current.progress
    );
    waveColorRef.current = interpolateColor(
      activeColorTransitionRef.current.waveColor,
      activeColorTransitionRef.current.targetWaveColor,
      activeColorTransitionRef.current.progress
    );
  }
  const amplitude = getAverageAmplitude();
  amplitudeRef.current = amplitude;
  // Reduced audio reactivity scaling by 75%
  const pulse = 1 + (amplitude / 100) * 0.25;
  // Optimize calculations - cache commonly used values
  const audioTimeMs = audioTime * 1000;
  const effectiveTime = Math.max(0, audioTimeMs);
  speedMultiplier.current = 1 + (effectiveTime / 240000); // Simplified calculation
  drawBackground(
    ctx, 
    amplitude / 100, 
    backgroundColorRef, 
    currentLevelRef.current.id, 
    levelTogglesRef.current.showBackgroundPattern, 
    bgPatternBubblesRef,
    levelTogglesRef.current
  );
  if (levelTogglesRef.current.showFlora) {
    drawFlora(ctx, floraItemsRef.current, amplitude, factor, speedMultiplier.current, currentLevelRef.current.id);
  }
  // Optimize timed text event processing - only check untriggered events
  if (timedTextEventsRef.current && Array.isArray(timedTextEventsRef.current)) {
    for (let i = 0; i < timedTextEventsRef.current.length; i++) {
      const event = timedTextEventsRef.current[i];
      if (event.triggered) continue; // Skip already triggered events
      if (audioTime >= event.timestamp) {
        event.triggered = true;
        activeTimedTextsRef.current.push({ 
          text: event.text, 
          lifetime: event.lifetime ?? 200, 
          color: event.color ?? 'black' 
        });
      } else {
        break; // Events are time-ordered, so we can stop checking
      }
    }
  }
  if (levelTogglesRef.current.showBubbles) {
    updateAndDrawBubbles(ctx, bubblesRef.current, amplitude, factor);
  }
  updateAndDrawTimedTexts(ctx, activeTimedTextsRef.current, factor);
  updatePlayerPosition(
    gameStateRef.current.player,
    inputRef.current.touchY,
    factor,
    inputRef.current.isDesktop || inputRef.current.isTouching
  );
  if (detectBeat(amplitude, lastBeatTimeRef)) {
    // Safely access currentLevel ID with a fallback to prevent undefined errors
    const currentLevelId = currentLevelRef?.current?.id || 1;

    spawnItemsOnBeat(
      canvas,
      levelTogglesRef.current,
      gameStateRef.current,
      currentLevelId,
      audioProgressRef.current,
      waterBottleRef.current,
      plasticBagRef.current,
      oilSplatImageRef.current,
      fishHookRef.current,
      flipflopRef.current,
      toothbrushRef.current,
      hotdogRef.current,
      rubberDuckyRef.current,
      level2PickupImagesRef.current,
      level2ObstacleImagesRef.current,
      level3ObstacleImagesRef.current,
      level3MushroomImagesRef.current,
      level3TrippyImagesRef.current,
      audioTime
    );
  }
  updateAndCheckTrashCollisions(
    ctx,
    gameStateRef.current,
    factor,
    speedMultiplier.current,
    pulse,
    getMultiplierFromStreak,
    setHealth,
    pickupSoundRef.current
  );
  updateAndCheckObstacleCollisions(
    ctx,
    gameStateRef.current,
    audioTime,
    songDuration,
    factor,
    speedMultiplier.current,
    setScore,
    setHealth,
    hitSoundRef.current,
    setLevelEnded,
    gameLoopRef,
    animationFrameIdRef
  );
  // Optimize particle creation - reduce frequency
  if (frameCount % 2 === 0) { // Only create particles every other frame
    const trippyMode = currentLevelRef.current.id === 3 && audioTime >= 304;
    if (trippyMode) {
      // Pre-calculated rainbow colors array (moved outside loop)
      const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
      const colorIndex = Math.floor(nowTime / 100) % rainbowColors.length;
      createSwimParticles(gameStateRef.current.particles, gameStateRef.current.player, gameStateRef.current.streak, rainbowColors[colorIndex]);
    } else {
      createSwimParticles(gameStateRef.current.particles, gameStateRef.current.player, gameStateRef.current.streak);
    }
  }
  updateAndDrawParticles(ctx, gameStateRef.current.particles, factor);
  updateAndDrawScorePopups(ctx, gameStateRef.current.scorePopups, factor);
  drawPlayer(ctx, gameStateRef.current.player, fishImageRef.current);
  // Optimize storm effect - reduce random calculations
  const stormActive = currentLevelRef.current.id === 3 && levelTogglesRef.current.showStormEffects;
  if (stormActive && frameCount % 100 === 0 && Math.random() < 0.5) { // Check less frequently
    // Save the current background color
    const originalBgColor = backgroundColorRef.current;

    // Flash with bright white-blue lightning
    ctx.save();
    ctx.fillStyle = 'rgba(200, 220, 255, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (currentLevelRef.current.id === 3 && audioTime >= 185 && audioTime < 270) {
      // Draw lightning bolt
      const startX = Math.random() * canvas.width;
      const startY = 0;
      ctx.strokeStyle = 'rgba(220, 240, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      // Create a jagged lightning path
      let x = startX;
      let y = startY;
      const zigzags = 5 + Math.floor(Math.random() * 3);
      const segmentLength = canvas.height / zigzags;

      for (let i = 0; i < zigzags; i++) {
        // Add some randomness to the lightning path
        x += (Math.random() - 0.5) * 150;
        y += segmentLength;
        ctx.lineTo(x, y);
      }

      ctx.stroke();

      // Add a glow effect
      ctx.shadowColor = 'rgba(180, 230, 255, 0.8)';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Create a random timeout to revert the flash (between 80-150ms)
    setTimeout(() => {
      if (backgroundColorRef.current === originalBgColor) {
        // Apply a second, fainter flash for realism
        setTimeout(() => {
          if (backgroundColorRef.current === originalBgColor) {
            // Finally revert back completely
          }
        }, 50);
      }
    }, 80 + Math.random() * 70);
  }

  const caveActive = currentLevelRef.current.isCaveMechanic || (currentLevelRef.current.id === 1 && audioTime >= 330 && audioTime < 390) || (currentLevelRef.current.id === 2 && audioTime >= 252 && audioTime < 286);
  if (caveActive) {
    const CAVE_WARNING_DURATION = 3;
    const isWarningPeriod = (currentLevelRef.current.id === 1 && audioTime < 330 + CAVE_WARNING_DURATION) || (currentLevelRef.current.id === 2 && audioTime < 252 + CAVE_WARNING_DURATION);
    // Normalize amplitude for cave mode
    const normalizedAmplitude = amplitude / 100;
    updateCaveBoundaries(canvas, caveRef.current, normalizedAmplitude, inputRef.current.isDesktop);
    // Pass the current level ID to drawCaveEffect
    drawCaveEffect(ctx, caveRef.current, normalizedAmplitude, isWarningPeriod, currentLevelRef.current.id);
    calculateCaveProximityScore(
      gameStateRef.current.player,
      caveRef.current,
      lastProximityScoreTimeRef,
      (callback) => setScore(callback(gameStateRef.current.score)),
      gameStateRef.current.scorePopups
    );
    checkCaveCollision(
      gameStateRef.current.player,
      caveRef.current,
      isWarningPeriod,
      lastCollisionTimeRef,
      gameStateRef.current.particles,
      hitSoundRef.current,
      (callback) => setScore(callback(gameStateRef.current.score)),
      setHealth,
      gameStateRef.current.scorePopups,
      (value) => { gameStateRef.current.streak = value; },
      (value) => { gameStateRef.current.multiplier = value; },
      setLevelEnded,
      gameLoopRef,
      animationFrameIdRef
    );
  }
  setScore(gameStateRef.current.score);
  const streakScale = Math.min(1.2, 0.5 + (gameStateRef.current.streak / 50) + (amplitudeRef.current / 255) * 0.5);
  streakDisplayRef.current.scale = streakScale;
  animationFrameIdRef.current = requestAnimationFrame(() => gameLoop(
    canvasRef,
    gameStateRef,
    lastFrameTimeRef,
    gameLoopRef,
    animationFrameIdRef,
    audioRef,
    audioProgressRef,
    getAverageAmplitude,
    detectBeat,
    lastBeatTimeRef,
    inputRef,
    backgroundColorRef,
    waveColorRef,
    activeColorTransitionRef,
    bgPatternBubblesRef,
    levelTogglesRef,
    bubblesRef,
    amplitudeRef,
    activeTimedTextsRef,
    floraItemsRef,
    streakDisplayRef,
    fishImageRef,
    waterBottleRef,
    plasticBagRef,
    oilSplatImageRef,
    fishHookRef,
    flipflopRef,
    toothbrushRef,
    hotdogRef,
    rubberDuckyRef,
    level2ObstacleImagesRef,
    level2PickupImagesRef,
    level3ObstacleImagesRef,
    level3MushroomImagesRef,
    level3TrippyImagesRef,
    currentLevelRef,
    timedTextEventsRef,
    colorEventsRef,
    level2TimedEventsRef,
    level3TimedEventsRef,
    caveRef,
    speedMultiplier,
    setScore,
    setHealth,
    setLevelEnded,
    lastCollisionTimeRef,
    lastProximityScoreTimeRef,
    pickupSoundRef,
    hitSoundRef
  ));
};

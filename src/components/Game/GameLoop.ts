import { GameState, LevelToggles, ActiveTimedText, TimedTextEvent, TimedColorEvent, Level2TimedEvents, ActiveColor, Bubble, StreakDisplay, Level, CaveState } from '../../types';
import { interpolateColor, getMultiplierFromStreak } from '../../utils/colorUtils';
import { drawBackground, drawSpectrum, updateAndDrawBubbles, updateAndDrawScorePopups, updateAndDrawTimedTexts } from './BackgroundEffects';
import { drawFlora } from './Flora';
import { drawPlayer, updatePlayerPosition } from './Player';
import { createParticles, createSwimParticles, updateAndDrawParticles } from './ParticleEffects';
import { updateCaveBoundaries, drawCaveEffect, checkCaveCollision, calculateCaveProximityScore } from './CaveEffects';
import { processColorEvents, processLevel2Events, spawnItemsOnBeat, updateAndCheckObstacleCollisions, updateAndCheckTrashCollisions, updateLevelToggles } from './GameHelpers';

// Use a constant top buffer to ensure nothing spawns behind the hearts
const TOP_BUFFER = 80;

// Get a random Y position for spawning items
export const getSpawnY = (canvas: HTMLCanvasElement | null, itemHeight: number): number => {
  if (!canvas) return TOP_BUFFER;
  return TOP_BUFFER + Math.random() * (canvas.height - TOP_BUFFER - itemHeight);
};

// Draw a game item (trash, obstacle, etc)
export const drawItem = (ctx: CanvasRenderingContext2D, item: any, pulse: number) => {
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
  else if (item.type === 'obstacle' && item.pickupImage) {
    // Handle obstacles
    item.rotation = (item.rotation || 0) + 0.0125;
    const effectiveWidth = item.width, effectiveHeight = item.height;
    const centerX = item.x + effectiveWidth / 2, centerY = item.y + effectiveHeight / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(item.rotation!);
    ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
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

// Main game loop
export const gameLoop = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  gameStateRef: React.RefObject<GameState>,
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
  obstacleImageRef: React.RefObject<HTMLImageElement>,
  fishHookRef: React.RefObject<HTMLImageElement>,
  flipflopRef: React.RefObject<HTMLImageElement>,
  toothbrushRef: React.RefObject<HTMLImageElement>,
  hotdogRef: React.RefObject<HTMLImageElement>,
  rubberDuckyRef: React.RefObject<HTMLImageElement>,
  level2ObstacleImagesRef: React.MutableRefObject<HTMLImageElement[]>,
  level2PickupImagesRef: React.MutableRefObject<HTMLImageElement[]>,
  
  // Level data
  currentLevelRef: React.MutableRefObject<Level>,
  timedTextEventsRef: React.MutableRefObject<TimedTextEvent[]>,
  colorEventsRef: React.MutableRefObject<TimedColorEvent[]>,
  level2TimedEventsRef: React.MutableRefObject<Level2TimedEvents>,
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
  
  // Calculate delta time for smooth animation
  const nowTime = performance.now();
  const deltaTime = (nowTime - lastFrameTimeRef.current) / 1000;
  lastFrameTimeRef.current = nowTime;
  const factor = deltaTime * 120;
  
  // Resize canvas to window size
  const canvas = canvasRef.current;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Get current audio position
  const audioTime = audioRef.current?.currentTime || 0;
  const songDuration = audioRef.current?.duration || 1;
  
  // Handle level-specific toggles based on audio time
  updateLevelToggles(audioTime, currentLevelRef.current.id, levelTogglesRef);
  
  // Process level 2 specific events
  if (currentLevelRef.current.id === 2) {
    processLevel2Events(
      audioTime, 
      canvasRef.current, 
      level2TimedEventsRef.current, 
      level2ObstacleImagesRef.current,
      level2PickupImagesRef.current,
      gameStateRef.current
    );
  }
  
  // Check for color transition events
  processColorEvents(audioTime, colorEventsRef.current, activeColorTransitionRef.current, backgroundColorRef, waveColorRef);
  
  // Get current audio amplitude
  const amplitude = getAverageAmplitude();
  amplitudeRef.current = amplitude;
  const pulse = 1 + amplitude / 100;
  
  // Update speed multiplier based on song progress
  const audioTimeMs = audioRef.current ? audioRef.current.currentTime * 1000 : 0;
  const levelStartDelay = 0;
  const effectiveTime = Math.max(0, audioTimeMs - levelStartDelay);
  speedMultiplier.current = 1 + ((effectiveTime / 1000) / 120) * 0.5;
  
  // Draw background with effects
  drawBackground(ctx, amplitude / 100, backgroundColorRef, currentLevelRef.current.id, levelTogglesRef.current.showBackgroundPattern, bgPatternBubblesRef);
  
  // Draw audio visualizer if enabled
  if (levelTogglesRef.current.showVisualizer) {
   // drawSpectrum(ctx);
  }
  
  // Draw flora if enabled
  if (levelTogglesRef.current.showFlora) {
    drawFlora(ctx, floraItemsRef.current, amplitude, factor, speedMultiplier.current, currentLevelRef.current.id);
  }
  
  // Process timed text events
  timedTextEventsRef.current.forEach(event => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;
      activeTimedTextsRef.current.push({ text: event.text, lifetime: 200 });
    }
  });
  
  // Draw bubbles if enabled
  if (levelTogglesRef.current.showBubbles) {
    updateAndDrawBubbles(ctx, bubblesRef.current, amplitude, factor);
  }
  
  // Draw timed text events
  updateAndDrawTimedTexts(ctx, activeTimedTextsRef.current, factor);
  
  // Update player position based on input
  updatePlayerPosition(
    gameStateRef.current.player,
    inputRef.current.touchY,
    factor,
    inputRef.current.isDesktop || inputRef.current.isTouching
  );
  
  // Detect beat and spawn items
  if (detectBeat(amplitude, lastBeatTimeRef)) {
    spawnItemsOnBeat(
      canvas,
      levelTogglesRef.current,
      gameStateRef.current,
      currentLevelRef.current.id,
      audioProgressRef.current,
      waterBottleRef.current,
      plasticBagRef.current,
      obstacleImageRef.current,
      fishHookRef.current,
      flipflopRef.current,
      toothbrushRef.current,
      hotdogRef.current,
      rubberDuckyRef.current,
      level2PickupImagesRef.current,
      level2ObstacleImagesRef.current
    );
  }
  
  // Update and check collisions for trash items
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
  
  // Update and check collisions for obstacles
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
  
  // Create swimming particles
  createSwimParticles(gameStateRef.current.particles, gameStateRef.current.player, gameStateRef.current.streak);
  
  // Update and draw particles
  updateAndDrawParticles(ctx, gameStateRef.current.particles, factor);
  
  // Update and draw score popups
  updateAndDrawScorePopups(ctx, gameStateRef.current.scorePopups, factor);
  
  // Draw player
  drawPlayer(ctx, gameStateRef.current.player, fishImageRef.current);
  
  // Check for cave mechanic
  const caveActive = currentLevelRef.current.isCaveMechanic || (currentLevelRef.current.id === 1 && audioTime >= 330 && audioTime < 390);
  if (caveActive) {
    const CAVE_WARNING_DURATION = 3;
    const isWarningPeriod = currentLevelRef.current.id === 1 && audioTime < 330 + CAVE_WARNING_DURATION;
    
    // Update cave boundaries
    updateCaveBoundaries(canvas, caveRef.current, amplitude, inputRef.current.isDesktop);
    
    // Draw cave effect
    drawCaveEffect(ctx, caveRef.current, amplitude, isWarningPeriod);
    
    // Calculate proximity score
    calculateCaveProximityScore(
      gameStateRef.current.player,
      caveRef.current,
      lastProximityScoreTimeRef,
      (callback) => setScore(callback(gameStateRef.current.score)),
      gameStateRef.current.scorePopups
    );
    
    // Check for collision with cave walls
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
  
  // Update score and streak display
  setScore(gameStateRef.current.score);
  const streakScale = Math.min(3, 0.5 + (gameStateRef.current.streak / 50) + (amplitudeRef.current / 255) * 0.5);
  streakDisplayRef.current.scale = streakScale;
  
  // Schedule next frame
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
    obstacleImageRef,
    fishHookRef,
    flipflopRef,
    toothbrushRef,
    hotdogRef,
    rubberDuckyRef,
    level2ObstacleImagesRef,
    level2PickupImagesRef,
    currentLevelRef,
    timedTextEventsRef,
    colorEventsRef,
    level2TimedEventsRef,
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
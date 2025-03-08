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
    // Check if the item is a cloud or a bus (which shouldn't rotate)
    const isCloud = item.pickupImage.src.includes('clouds');
    const isBus = item.pickupImage.src.includes('bus');
    
    const effectiveWidth = item.width, effectiveHeight = item.height;
    const centerX = item.x + effectiveWidth / 2, centerY = item.y + effectiveHeight / 2;
    
    // Only rotate if it's not a cloud or bus
    if (!isCloud && !isBus) {
      item.rotation = (item.rotation || 0) + 0.0125;
      ctx.translate(centerX, centerY);
      ctx.rotate(item.rotation!);
      ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
    } else {
      // Draw without rotation for clouds and buses
      ctx.translate(centerX, centerY);
      ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
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
  const nowTime = performance.now();
  const deltaTime = (nowTime - lastFrameTimeRef.current) / 1000;
  lastFrameTimeRef.current = nowTime;
  const factor = deltaTime * 120;
  const canvas = canvasRef.current;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const audioTime = audioRef.current?.currentTime || 0;
  const songDuration = audioRef.current?.duration || 1;
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
  const pulse = 1 + amplitude / 100;
  const audioTimeMs = audioRef.current ? audioRef.current.currentTime * 1000 : 0;
  const levelStartDelay = 0;
  const effectiveTime = Math.max(0, audioTimeMs - levelStartDelay);
  speedMultiplier.current = 1 + ((effectiveTime / 1000) / 120) * 0.5;
  drawBackground(ctx, amplitude / 100, backgroundColorRef, currentLevelRef.current.id, levelTogglesRef.current.showBackgroundPattern, bgPatternBubblesRef);
  if (levelTogglesRef.current.showFlora) {
    drawFlora(ctx, floraItemsRef.current, amplitude, factor, speedMultiplier.current, currentLevelRef.current.id);
  }
  // Ensure timedTextEventsRef.current is an array
  const timedEvents = Array.isArray(timedTextEventsRef.current) ? timedTextEventsRef.current : [];
  
  // Now safely iterate through the events
  timedEvents.forEach(event => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;
      activeTimedTextsRef.current.push({ text: event.text, lifetime: event.lifetime ?? 200, color: event.color ?? 'black' });
    }
  });
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
  createSwimParticles(gameStateRef.current.particles, gameStateRef.current.player, gameStateRef.current.streak);
  updateAndDrawParticles(ctx, gameStateRef.current.particles, factor);
  updateAndDrawScorePopups(ctx, gameStateRef.current.scorePopups, factor);
  drawPlayer(ctx, gameStateRef.current.player, fishImageRef.current);
  const caveActive = currentLevelRef.current.isCaveMechanic || (currentLevelRef.current.id === 1 && audioTime >= 330 && audioTime < 390);
  if (caveActive) {
    const CAVE_WARNING_DURATION = 3;
    const isWarningPeriod = currentLevelRef.current.id === 1 && audioTime < 330 + CAVE_WARNING_DURATION;
    // Normalize amplitude for cave mode
    const normalizedAmplitude = amplitude / 100;
    updateCaveBoundaries(canvas, caveRef.current, normalizedAmplitude, inputRef.current.isDesktop);
    drawCaveEffect(ctx, caveRef.current, normalizedAmplitude, isWarningPeriod);
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
  const streakScale = Math.min(3, 0.5 + (gameStateRef.current.streak / 50) + (amplitudeRef.current / 255) * 0.5);
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

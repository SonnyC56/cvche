// UnderwaterDoodleJumpGame.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

// Global declaration for Safari
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// ----------------- Types -----------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  opacity: number;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  opacity: number;
  lifetime: number;
}

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

interface Flora {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  swayOffset: number;
  swaySpeed: number;
  scrollSpeed: number;
  active: boolean;
}

interface StreakDisplay {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

interface Level {
  id: number;
  title: string;
  songFile: string;
  initialBackground: string;
  initialWaveColor: string;
  unlocked: boolean;
  isCaveMechanic?: boolean;
  highScore?: number;
}

// Each platform is scored only once.
interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  scored?: boolean;
}

// Our game state.
interface GameState {
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
    vx: number;
    vy: number;
    rotation: number;
    spinRotation: number;
    hitAnimation: number; // used to animate the fish on landing
  };
  platforms: Platform[];
  particles: Particle[];
  score: number;
  scorePopups: ScorePopup[];
  streak: number;
  multiplier: number;
  highestStreak: number;
}


interface Props {
  onGameStart?: () => void;
}

// ----------------- Audio Buffer Utilities -----------------

function cloneAudioBuffer(audioBuffer: AudioBuffer, context: AudioContext): AudioBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels[i] = new Float32Array(audioBuffer.getChannelData(i));
  }
  const newBuffer = context.createBuffer(numChannels, audioBuffer.length, audioBuffer.sampleRate);
  for (let i = 0; i < numChannels; i++) {
    newBuffer.getChannelData(i).set(channels[i]);
  }
  return newBuffer;
}

// ----------------- Helper Drawing Functions -----------------

/* const interpolateColor = (color1: string, color2: string, factor: number) => {
  if (color1.startsWith('rgba') && color2.startsWith('rgba')) {
    const c1 = color1.match(/[\d.]+/g)?.map(Number) || [];
    const c2 = color2.match(/[\d.]+/g)?.map(Number) || [];
    return `rgba(${Math.round(c1[0] + (c2[0] - c1[0]) * factor)},${Math.round(c1[1] + (c2[1] - c1[1]) * factor)},${Math.round(c1[2] + (c2[2] - c1[2]) * factor)},${c1[3] + (c2[3] - c1[3]) * factor})`;
  }
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}; */

const drawBackgroundPattern = (ctx: CanvasRenderingContext2D, amplitudeFactor: number, canvas: HTMLCanvasElement) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,102,255,0.4)';
  ctx.lineWidth = 2 + amplitudeFactor * 2;
  const { width, height } = canvas;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const offset = i * 50, timeOffset = Date.now() / (1000 + i * 500);
    for (let x = 0; x < width; x += 5) {
      const frequency = (4 + Math.sin(timeOffset) * 2) * (1 + amplitudeFactor * 0.5);
      const y = height + Math.sin((x / width * frequency * Math.PI) + timeOffset + offset) * (50 + amplitudeFactor * 70);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
};

const drawBackground = (ctx: CanvasRenderingContext2D, amplitudeFactor: number, backgroundColor: string, canvas: HTMLCanvasElement) => {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const gradientSize = Math.max(canvas.width, canvas.height) * (0.8 + amplitudeFactor * 0.4);
  const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, gradientSize);
  const alpha = 0.15 + amplitudeFactor * 0.2;
  gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
  gradient.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.5})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const vignetteGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
  vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
  vignetteGradient.addColorStop(0.7, `rgba(0,0,0,${0.2 + amplitudeFactor * 0.1})`);
  vignetteGradient.addColorStop(1, `rgba(0,0,0,${0.3 + amplitudeFactor * 0.15})`);
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawBackgroundPattern(ctx, amplitudeFactor, canvas);
};

// Draw a pulse overlay when a strong beat is detected.
const drawBeatPulse = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, intensity: number) => {
  if (intensity <= 0) return;
  ctx.save();
  const maxRadius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
  const radius = intensity * maxRadius;
  const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, radius);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${0.2 * intensity})`);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
};

const drawSpectrum = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, waveColor: string, analyser: AnalyserNode | null, dataArray: Uint8Array | null) => {
  if (!analyser || !dataArray) return;
  const barWidth = (canvas.width / dataArray.length) * 2.5;
  let posX = 0;
  analyser.getByteFrequencyData(dataArray);
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = dataArray[i] / 2;
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
    let startColor = waveColor, endColor = waveColor;
    if (waveColor.startsWith('rgba')) {
      const components = waveColor.match(/[\d.]+/g);
      if (components && components.length >= 4) {
        const [r, g, b] = components;
        startColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
        endColor = `rgba(${r}, ${g}, ${b}, 0)`;
      }
    } else if (waveColor.startsWith('#')) {
      const hex = waveColor.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      startColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
      endColor = `rgba(${r}, ${g}, ${b}, 0)`;
    }
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(posX, canvas.height - barHeight, barWidth, barHeight);
    posX += barWidth + 1;
  }
};

const drawFlora = (ctx: CanvasRenderingContext2D, amplitude: number, canvas: HTMLCanvasElement, speedMultiplier: number, floraItems: Flora[]) => {
  const time = Date.now() / 1000;
  floraItems.forEach((flora) => {
    flora.x -= flora.scrollSpeed * speedMultiplier;
    if (flora.x + flora.width < 0) {
      flora.x = canvas.width + (Math.random() * 100);
    }
    flora.y = canvas.height;
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

const updateAndDrawBubbles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, amplitude: number, bubbles: Bubble[]) => {
  if (Math.random() < (amplitude / 255) * 0.5) {
    bubbles.push({
      x: Math.random() * canvas.width,
      y: canvas.height,
      radius: 2 + Math.random() * 3,
      speed: 1 + Math.random() * 2,
      opacity: 1,
    });
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    bubble.y -= bubble.speed;
    bubble.opacity -= 0.005;
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

const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[], speedMultiplier: number) => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * speedMultiplier;
    p.y += p.vy;
    p.life -= 0.02;
    p.opacity *= 0.97;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    const opacityHex = Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
    ctx.fillStyle = `${p.color}${opacityHex}`;
    ctx.fill();
  }
};

const createParticles = (particles: Particle[], x: number, y: number, color: string, count: number) => {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1.0,
      color,
      size: 3 + Math.random() * 2,
      opacity: 0.7,
    });
  }
};

const getMultiplierFromStreak = (streak: number) => Math.min(10, 1 + Math.floor(streak / 5));

const getParticleColorFromStreak = (streak: number): string => {
  if (streak >= 45) return '#FF00FF';
  if (streak >= 35) return '#FF0088';
  if (streak >= 25) return '#FF0000';
  if (streak >= 15) return '#FFA500';
  if (streak >= 5) return '#FFFF00';
  return '#FFD700';
};

const updateAndDrawScorePopups = (ctx: CanvasRenderingContext2D, scorePopups: ScorePopup[]) => {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    const popup = scorePopups[i];
    ctx.save();
    ctx.font = "20px Orbitron";
    ctx.fillStyle = "black";
    ctx.globalAlpha = popup.opacity;
    ctx.fillText(popup.text, popup.x, popup.y);
    ctx.restore();
    popup.y -= 0.5;
    popup.lifetime -= 1;
    popup.opacity = popup.lifetime / 100;
    if (popup.lifetime <= 0) scorePopups.splice(i, 1);
  }
};

const drawPlatform = (ctx: CanvasRenderingContext2D, platform: Platform) => {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.strokeStyle = '#0066FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 5);
  } else {
    ctx.rect(platform.x, platform.y, platform.width, platform.height);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

// Draw the fish with a cute bounce animation when landing on a platform.
const drawPlayer = (ctx: CanvasRenderingContext2D, player: { x: number; y: number; width: number; height: number; rotation: number; spinRotation: number; hitAnimation: number; }, fishImg: HTMLImageElement | null) => {
  if (!fishImg || !fishImg.complete) return;
  const aspect = fishImg.naturalWidth / fishImg.naturalHeight;
  const drawWidth = player.width * 1.25;
  const drawHeight = drawWidth / aspect;
  ctx.save();
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  ctx.translate(centerX, centerY);
  // Apply a scale and slight rotation wiggle based on hitAnimation.
  const scale = 1 + (player.hitAnimation ? 0.2 * player.hitAnimation : 0);
  ctx.scale(scale, scale);
  const additionalRotation = player.hitAnimation ? Math.sin(player.hitAnimation * Math.PI) * 0.1 : 0;
  ctx.rotate(player.rotation + player.spinRotation + additionalRotation);
  ctx.drawImage(fishImg, -drawWidth / 2 + 20, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
};

// ----------------- End Helper Functions -----------------

// ----------------- Main Component -----------------
const UnderwaterDoodleJump: React.FC<Props> = ({ onGameStart }) => {
  // UI and Level state
  const [audioProgress, setAudioProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [levelEnded, setLevelEnded] = useState(false);

  console.log('score', score);

  const [currentLevel, setCurrentLevel] = useState<Level>({
    id: 2,
    title: "SOUL FOOD",
    songFile: "/sounds/soulFood2.mp3",
    initialBackground: "#8A2BE2",
    initialWaveColor: "rgba(255,140,0,0.4)",
    unlocked: true,
    isCaveMechanic: false
  });

  const [levels, setLevels] = useState<Level[]>(() => {
    const savedLevels = localStorage.getItem('gameLevels');
    const defaultLevels: Level[] = [
      {
        id: 1,
        title: "WELCOME TO CVCHE",
        songFile: "/sounds/welcomeToCVCHE.mp3",
        initialBackground: "#FDEE03",
        initialWaveColor: "rgba(0,102,255,0.4)",
        unlocked: true,
        isCaveMechanic: false,
        highScore: 0
      },
      {
        id: 2,
        title: "SOUL FOOD",
        songFile: "/sounds/soulFood2.mp3",
        initialBackground: "#8A2BE2",
        initialWaveColor: "rgba(255,140,0,0.4)",
        unlocked: true,
        isCaveMechanic: false,
        highScore: 0
      }
    ];
    return savedLevels ? JSON.parse(savedLevels) : defaultLevels;
  });

  // Color refs.
  const backgroundColorRef = useRef(currentLevel.initialBackground);
  const waveColorRef = useRef(currentLevel.initialWaveColor);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const starsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio-related refs.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const forwardBufferRef = useRef<AudioBuffer | null>(null);
  const reversedBufferRef = useRef<AudioBuffer | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackOffsetRef = useRef<number>(0);
  const currentReverseOffsetRef = useRef<number>(0);
  const lastReverseUpdateTimeRef = useRef<number>(0);
  const reverseRestartInterval = 0.1; // seconds between restarts in reverse mode
  const isRewindingRef = useRef<boolean>(false);

  // Game loop control.
  const gameLoopRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Audio analyser refs.
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Beat pulse effect ref.
  const beatPulseRef = useRef<number>(0);

  // Preload images.
  const fishImageRef = useRef<HTMLImageElement | null>(null);
  const waterBottleRef = useRef<HTMLImageElement | null>(null);
  const plasticBagRef = useRef<HTMLImageElement | null>(null);
  const obstacleImageRef = useRef<HTMLImageElement | null>(null);
  const fishHookRef = useRef<HTMLImageElement | null>(null);

  // Other refs.
  const speedMultiplier = useRef<number>(1);
  const amplitudeRef = useRef<number>(0);
  const bubblesRef = useRef<Bubble[]>([]);
  const floraImagesRef = useRef<HTMLImageElement[]>([]);
  const floraItemsRef = useRef<Flora[]>([]);
  const pickupSoundRef = useRef<HTMLAudioElement | null>(null);
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);
  const streakDisplayRef = useRef<StreakDisplay>({ x: 0, y: 0, scale: 1, opacity: 1 });
  const inputRef = useRef({ isTouching: false, touchX: window.innerWidth / 2, isDesktop: false });
  // Track last platform hit’s y-coordinate.
  const lastHitPlatformYRef = useRef<number>(window.innerHeight);

  // Physics constants.
  const gravity = 0.3;
  const jumpImpulse = -12;

  // Persistent game state.
  const gameStateRef = useRef<GameState>({
    player: {
      x: window.innerWidth / 2 - 25,
      y: window.innerHeight - 80,
      width: 50,
      height: 30,
      vx: 0,
      vy: 0,
      rotation: 0,
      spinRotation: 0,
      hitAnimation: 0,
    },
    platforms: [],
    particles: [],
    score: 0,
    scorePopups: [],
    streak: 0,
    multiplier: 1,
    highestStreak: 0,
  });

  const generateInitialPlatforms = useCallback(() => {
    const platforms: Platform[] = [];
    const firstPlatformY = window.innerHeight - 50;
    platforms.push({ x: 0, y: firstPlatformY, width: window.innerWidth, height: 10 });
    for (let i = 1; i < 10; i++) {
      const y = firstPlatformY - i * (80 + Math.random() * 20);
      const platformWidth = 80 + Math.random() * 70;
      const x = Math.random() * (window.innerWidth - platformWidth);
      platforms.push({ x, y, width: platformWidth, height: 10 });
    }
    gameStateRef.current.platforms = platforms;
  }, []);

  // Reset the game state if the player falls too far.
  const resetGame = useCallback(() => {
    gameStateRef.current = {
      player: {
        x: window.innerWidth / 2 - 25,
        y: window.innerHeight - 80,
        width: 50,
        height: 30,
        vx: 0,
        vy: 0,
        rotation: 0,
        spinRotation: 0,
        hitAnimation: 0,
      },
      platforms: [],
      particles: [],
      score: 0,
      scorePopups: [],
      streak: 0,
      multiplier: 1,
      highestStreak: 0,
    };
    generateInitialPlatforms();
    // Restart audio from the beginning.
    if (audioCtxRef.current && forwardBufferRef.current) {
      startForwardPlayback(0);
    }
  }, [generateInitialPlatforms]);

  // ----------------- Audio Loading & Playback Functions -----------------
  const stopCurrentSource = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped.
      }
      currentSourceRef.current.disconnect();
      currentSourceRef.current = null;
    }
  }, []);

  const startForwardPlayback = useCallback((offset = 0) => {
    if (!audioCtxRef.current || !forwardBufferRef.current) return;
    stopCurrentSource();
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = forwardBufferRef.current;
    source.connect(audioCtxRef.current.destination);
    playbackStartTimeRef.current = audioCtxRef.current.currentTime;
    playbackOffsetRef.current = offset;
    source.start(0, offset);
    currentSourceRef.current = source;
  }, [stopCurrentSource]);

  const loadAudio = useCallback(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    fetch(currentLevel.songFile)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        forwardBufferRef.current = audioBuffer;
        reversedBufferRef.current = cloneAudioBuffer(audioBuffer, context);
        for (let ch = 0; ch < reversedBufferRef.current.numberOfChannels; ch++) {
          Array.prototype.reverse.call(reversedBufferRef.current.getChannelData(ch));
        }
        startForwardPlayback(0);
      })
      .catch(console.error);
  }, [currentLevel.songFile, startForwardPlayback]);

  const startReversePlayback = useCallback((forwardOffset: number) => {
    if (!audioCtxRef.current || !reversedBufferRef.current || !forwardBufferRef.current) return;
    stopCurrentSource();
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = reversedBufferRef.current;
    source.connect(audioCtxRef.current.destination);
    const reverseStart = forwardBufferRef.current.duration - forwardOffset;
    playbackStartTimeRef.current = audioCtxRef.current.currentTime;
    playbackOffsetRef.current = forwardBufferRef.current.duration - reverseStart;
    source.start(0, reverseStart);
    currentSourceRef.current = source;
  }, [stopCurrentSource]);

  // ----------------- Helper Drawing Functions & Game Loop -----------------

  const getAverageAmplitude = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return 0;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    return sum / dataArrayRef.current.length;
  }, []);

  const gameLoop = useCallback(() => {
    if (!gameLoopRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const amplitude = getAverageAmplitude();
    amplitudeRef.current = amplitude;

    // --- Beat detection visual ---
    // Lower threshold: trigger beat pulse if amplitude > 150.
    if (amplitude > 150) {
      beatPulseRef.current = 1;
    }
    // Decay the beat pulse effect.
    beatPulseRef.current = Math.max(0, beatPulseRef.current - 0.02);

    // Update the hit animation value (decaying over time).
    const player = gameStateRef.current.player;
    if (player.hitAnimation > 0) {
      player.hitAnimation = Math.max(0, player.hitAnimation - 0.05);
    }

    // Draw background and beat pulse overlay.
    drawBackground(ctx, amplitude / 100, backgroundColorRef.current, canvas);
    drawBeatPulse(ctx, canvas, beatPulseRef.current);
    drawSpectrum(ctx, canvas, waveColorRef.current, analyserRef.current, dataArrayRef.current);
    drawFlora(ctx, amplitude, canvas, speedMultiplier.current, floraItemsRef.current);
    updateAndDrawBubbles(ctx, canvas, amplitude, bubblesRef.current);

    // Update player physics.
    const targetX = inputRef.current.touchX;
    const playerCenterX = player.x + player.width / 2;
    player.vx = (targetX - playerCenterX) * 0.1;
    player.x += player.vx;
    // Constrain the player within screen bounds.
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    player.vy += gravity;
    player.vy = Math.min(player.vy, 20);
    player.y += player.vy;

    // If the player falls too far off-screen vertically, reset the game.
    if (player.y > canvas.height + 50) {
      resetGame();
      return;
    }

    // Platform collision detection.
    for (let i = 0; i < gameStateRef.current.platforms.length; i++) {
      const platform = gameStateRef.current.platforms[i];
      if (
        player.vy > 0 &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + 10 &&
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width
      ) {
        player.y = platform.y - player.height;
        player.vy = jumpImpulse;
        // Trigger the cute hit animation.
        player.hitAnimation = 1;
        lastHitPlatformYRef.current = platform.y;
        if (!platform.scored) {
          platform.scored = true;
          gameStateRef.current.streak++;
          const multiplier = getMultiplierFromStreak(gameStateRef.current.streak);
          gameStateRef.current.multiplier = multiplier;
          gameStateRef.current.highestStreak = Math.max(gameStateRef.current.highestStreak, gameStateRef.current.streak);
          const popupX = platform.x + platform.width / 2;
          const popupY = platform.y - 20;
          const scoreText = multiplier > 1 ? `+10 (${multiplier}x)` : `+10`;
          gameStateRef.current.scorePopups.push({ x: popupX, y: popupY, text: scoreText, opacity: 1, lifetime: 100 });
          createParticles(gameStateRef.current.particles, popupX, platform.y, getParticleColorFromStreak(gameStateRef.current.streak), 20);
          pickupSoundRef.current?.play().catch(console.error);
        }
      }
    }

    // Camera scrolling logic.
    const scrollUpThreshold = 150;
    if (player.y < scrollUpThreshold) {
      const delta = scrollUpThreshold - player.y;
      player.y = scrollUpThreshold;
      gameStateRef.current.platforms.forEach(p => p.y += delta);
      gameStateRef.current.particles.forEach(p => p.y += delta);
      gameStateRef.current.score += Math.floor(delta);
    }
    const scrollDownThreshold = canvas.height - 150;
    if (player.y + player.height < canvas.height - 10 && player.y > scrollDownThreshold) {
      const delta = player.y - scrollDownThreshold;
      player.y = scrollDownThreshold;
      gameStateRef.current.platforms.forEach(p => p.y -= delta);
      gameStateRef.current.particles.forEach(p => p.y -= delta);
    }

    // ------------- Continuous Platform Generation -------------
    while (Math.min(...gameStateRef.current.platforms.map(p => p.y)) > -window.innerHeight) {
      const currentHighestY = Math.min(...gameStateRef.current.platforms.map(p => p.y));
      const gap = 80 + Math.random() * 50;
      const newY = currentHighestY - gap;
      const newWidth = 80 + Math.random() * 70;
      const newX = Math.random() * (canvas.width - newWidth);
      gameStateRef.current.platforms.push({ x: newX, y: newY, width: newWidth, height: 10 });
    }
    // ------------- End Platform Generation -------------

    // ------------- Audio Reverse Scrubbing Logic -------------
    if (audioCtxRef.current && forwardBufferRef.current) {
      const ctxTime = audioCtxRef.current.currentTime;
      let forwardTime = (ctxTime - playbackStartTimeRef.current) + playbackOffsetRef.current;
      forwardTime = Math.max(0, Math.min(forwardTime, forwardBufferRef.current.duration));
      // If the player falls below the last hit platform (plus cushion), enter reverse mode.
      if (player.y + player.height > lastHitPlatformYRef.current + 20) {
        // Break the streak on falling / reverse.
        gameStateRef.current.streak = 0;
        gameStateRef.current.multiplier = 1;
        if (!isRewindingRef.current) {
          isRewindingRef.current = true;
          currentReverseOffsetRef.current = forwardTime;
          lastReverseUpdateTimeRef.current = ctxTime;
          startReversePlayback(currentReverseOffsetRef.current);
        } else {
          if (ctxTime - lastReverseUpdateTimeRef.current >= reverseRestartInterval) {
            const dt = ctxTime - lastReverseUpdateTimeRef.current;
            currentReverseOffsetRef.current = Math.max(0, currentReverseOffsetRef.current - (dt * 10));
            lastReverseUpdateTimeRef.current = ctxTime;
            startReversePlayback(currentReverseOffsetRef.current);
          }
        }
      } else {
        if (isRewindingRef.current) {
          isRewindingRef.current = false;
          startForwardPlayback(forwardTime);
        }
      }
      setCurrentTime(forwardTime);
      setDuration(forwardBufferRef.current.duration);
      setAudioProgress((forwardTime / forwardBufferRef.current.duration) * 100);
      if (forwardBufferRef.current.duration - forwardTime < 0.1) {
        setLevelEnded(true);
        gameLoopRef.current = false;
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      }
    }
    // ------------- End Audio Reverse Logic -------------

    // Draw platforms.
    gameStateRef.current.platforms.forEach(platform => drawPlatform(ctx, platform));
    // Draw the ocean floor.
    ctx.save();
    ctx.fillStyle = "#333";
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
    ctx.restore();
    // Draw particles, score popups, and the fish.
    updateAndDrawParticles(ctx, gameStateRef.current.particles, speedMultiplier.current);
    updateAndDrawScorePopups(ctx, gameStateRef.current.scorePopups);
    drawPlayer(ctx, player, fishImageRef.current);

   setScore(gameStateRef.current.score);
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  }, [getAverageAmplitude, startForwardPlayback, startReversePlayback, resetGame]);

  useEffect(() => {
    if (gameStarted) {
      loadAudio();
    }
  }, [gameStarted, loadAudio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hasCoarse = window.matchMedia('(pointer: coarse)').matches;
    inputRef.current.isDesktop = !hasCoarse;
    const handleMouseMove = (e: MouseEvent) => { if (inputRef.current.isDesktop) inputRef.current.touchX = e.clientX; };
    const handleTouchMove = (e: TouchEvent) => { if (e.touches.length > 0) inputRef.current.touchX = e.touches[0].clientX; e.preventDefault(); };
    if (hasCoarse) canvas.addEventListener('touchmove', handleTouchMove);
    else canvas.addEventListener('mousemove', handleMouseMove);
    return () => {
      if (hasCoarse) canvas.removeEventListener('touchmove', handleTouchMove);
      else canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const fishImg = new Image();
    fishImg.onload = () => { fishImageRef.current = fishImg; };
    fishImg.src = '/sprites/cvcheFish.webp';
    const bottleImg = new Image();
    bottleImg.onload = () => { waterBottleRef.current = bottleImg; };
    bottleImg.src = '/sprites/waterBottle.webp';
    const bagImg = new Image();
    bagImg.onload = () => { plasticBagRef.current = bagImg; };
    bagImg.src = '/sprites/plasticBag.webp';
    const barrelImg = new Image();
    barrelImg.onload = () => { obstacleImageRef.current = barrelImg; };
    barrelImg.src = '/sprites/oilBarrel.webp';
    const hookImg = new Image();
    hookImg.onload = () => { fishHookRef.current = hookImg; };
    hookImg.src = '/sprites/fishHook.webp';
    const pickupSound = new Audio('/sounds/pickup.mp3');
    pickupSound.volume = 0.3;
    pickupSoundRef.current = pickupSound;
    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.volume = 0.3;
    hitSoundRef.current = hitSound;
  }, []);

  useEffect(() => {
    const floraFileNames = ['1 (1).webp', ...Array.from({ length: 20 }, (_, i) => `1 (${i + 16}).webp`)];
    let loadedCount = 0;
    floraFileNames.forEach(fileName => {
      const img = new Image();
      img.onload = () => {
        floraImagesRef.current.push(img);
        loadedCount++;
        if (loadedCount === floraFileNames.length) {
          initializeFlora();
        }
      };
      img.src = `/sprites/flora/${fileName}`;
    });
  }, []);

  const initializeFlora = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const MAX_FLORA = 15;
    floraItemsRef.current = [];
    for (let i = 0; i < MAX_FLORA; i++) {
      const randomImage = floraImagesRef.current[Math.floor(Math.random() * floraImagesRef.current.length)];
      const height = 30 + Math.random() * 80;
      const width = (height / randomImage.height) * randomImage.width;
      floraItemsRef.current.push({
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
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        floraItemsRef.current.forEach(flora => { flora.y = canvasRef.current!.height; });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeFlora]);

  useEffect(() => {
    (window as any).unlockAllLevels = () => {
      setLevels(prev => prev.map(level => ({ ...level, unlocked: true })));
      console.log('All levels unlocked!');
    };
  }, [levels]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    onGameStart?.();
    backgroundColorRef.current = currentLevel.initialBackground;
    waveColorRef.current = currentLevel.initialWaveColor;
    if (containerRef.current) containerRef.current.style.background = currentLevel.initialBackground;
    generateInitialPlatforms();
    gameLoopRef.current = true;
    requestAnimationFrame(gameLoop);
  }, [currentLevel, gameLoop, generateInitialPlatforms]);

  useEffect(() => {
    if (!gameStarted) return;
    const intervalId = setInterval(() => {
      if (audioCtxRef.current && forwardBufferRef.current) {
        const ctxTime = audioCtxRef.current.currentTime;
        let forwardTime = (ctxTime - playbackStartTimeRef.current) + playbackOffsetRef.current;
        forwardTime = Math.max(0, Math.min(forwardTime, forwardBufferRef.current.duration));
        setCurrentTime(forwardTime);
        setDuration(forwardBufferRef.current.duration);
        setAudioProgress((forwardTime / forwardBufferRef.current.duration) * 100);
        if (forwardBufferRef.current.duration - forwardTime < 0.1) {
          setLevelEnded(true);
          gameLoopRef.current = false;
          if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
          }
        }
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, [gameStarted]);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const newPaused = !prev;
      if (newPaused) {
        stopCurrentSource();
        gameLoopRef.current = false;
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      } else {
        if (audioCtxRef.current && forwardBufferRef.current) {
          const ctxTime = audioCtxRef.current.currentTime;
          const forwardTime = (ctxTime - playbackStartTimeRef.current) + playbackOffsetRef.current;
          startForwardPlayback(forwardTime);
        }
        gameLoopRef.current = true;
        gameLoop();
      }
      return newPaused;
    });
  }, [gameLoop, startForwardPlayback, stopCurrentSource]);

  const selectLevel = useCallback((level: Level) => {
    if (!level.unlocked) return;
    gameStateRef.current = {
      player: {
        x: window.innerWidth / 2 - 25,
        y: window.innerHeight - 80,
        width: 50,
        height: 30,
        vx: 0,
        vy: 0,
        rotation: 0,
        spinRotation: 0,
        hitAnimation: 0,
      },
      platforms: [],
      particles: [],
      score: 0,
      scorePopups: [],
      streak: 0,
      multiplier: 1,
      highestStreak: 0,
    };
    setCurrentLevel(level);
    backgroundColorRef.current = level.initialBackground;
    waveColorRef.current = level.initialWaveColor;
    if (containerRef.current) containerRef.current.style.background = level.initialBackground;
    setLevelEnded(false);
  }, []);

  useEffect(() => {
    if (levelEnded) {
      setLevels(prev =>
        prev.map(level =>
          level.id === currentLevel.id
            ? { ...level, highScore: Math.max(level.highScore || 0, gameStateRef.current.score) }
            : level
        )
      );
      localStorage.setItem('gameLevels', JSON.stringify(levels));
    }
  }, [levelEnded, currentLevel.id, levels]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '100vh', background: backgroundColorRef.current, fontFamily: 'Orbitron, sans-serif' }}>
      <canvas ref={starsCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '200px', pointerEvents: 'none', zIndex: 5 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '50px', display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 10, color: '#fff', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          {gameStarted && (
            <button onClick={togglePause} style={{ background: '#0066FF', border: 'none', color: '#fff', padding: '5px 15px', cursor: 'pointer', borderRadius: '4px' }}>
              {isPaused ? 'Play' : 'Pause'}
            </button>
          )}
          <div>High Score: {currentLevel.highScore || 0}</div>
          <div>Score: {gameStateRef.current.score}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '500px' }}>
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${audioProgress}%`, height: '100%', background: '#0066FF', transition: 'width 0.1s linear' }} />
          </div>
          <div style={{ fontSize: '14px' }}>{formatTime(currentTime)} / {formatTime(duration)}</div>
        </div>
      </div>
      <div style={{ position: 'fixed', top: '60px', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', zIndex: 10 }}>
        <div style={{ background: `rgba(0,0,0,0.7)`, padding: '10px 20px', borderRadius: '8px', transform: `scale(${streakDisplayRef.current.scale})`, transition: 'transform 0.1s ease-out' }}>
          <div style={{ color: getParticleColorFromStreak(gameStateRef.current.streak), fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,255,255,0.3)', transition: 'color 0.3s' }}>
            {gameStateRef.current.streak} STREAK
          </div>
          <div style={{ color: '#fff', fontSize: '18px', opacity: 0.8 }}>
            {gameStateRef.current.multiplier}x MULTIPLIER
          </div>
        </div>
      </div>
      {!gameStarted && (
        <>
          <div style={{ position: 'absolute', top: '50dvh', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ fontSize: '4rem', margin: 0, color: 'black', textShadow: '0 0 10px rgba(0,0,0,0.3)', lineHeight: '1.2' }}>
                {currentLevel.title}
              </h1>
              <div style={{ fontSize: '2rem', color: 'black', textShadow: '0 0 10px rgba(0,0,0,0.3)' }}>
                High Score: {currentLevel.highScore || 0}
              </div>
            </div>
            <button onClick={startGame} style={{ border: 'none', color: '#fff', padding: '20px 60px', fontSize: '24px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}>
              Play
            </button>
          </div>
          <div style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {levels.map((level) => (
              <button key={level.id} onClick={() => selectLevel(level)} disabled={!level.unlocked} style={{ padding: '10px 20px', width: '180px', fontSize: '16px', borderRadius: '8px', border: 'none', cursor: level.unlocked ? 'pointer' : 'not-allowed', backgroundColor: currentLevel.id === level.id ? '#0066FF' : 'rgba(0,0,0,0.5)', color: '#fff', opacity: level.unlocked ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s, opacity 0.2s', transform: currentLevel.id === level.id ? 'scale(1.1)' : 'scale(1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>LVL {level.id}</span>
                  <span style={{ fontSize: '14px' }}>{level.title}</span>
                </div>
                {!level.unlocked && <span style={{ fontSize: '12px' }}>🔒</span>}
              </button>
            ))}
          </div>
        </>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default UnderwaterDoodleJump;

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  opacity: number;
  shape?: 'circle' | 'heart';
}

interface GameItem {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'trash' | 'obstacle' | 'fishhook' | 'flipflop' | 'toothbrush' | 'hotdog' | 'rubberducky';
  speed: number;
  rotation?: number;
  pickupImage?: HTMLImageElement;
  baseY?: number;
}

interface ExtendedHTMLAudioElement extends HTMLAudioElement {
  _mediaElementSource?: MediaElementAudioSourceNode;
  _audioCtx?: AudioContext;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  opacity: number;
  lifetime: number;
}

interface TimedTextEvent {
  timestamp: number;
  text: string;
  triggered: boolean;
}

interface ActiveTimedText {
  text: string;
  lifetime: number;
}

interface TimedColorEvent {
  timestamp: number;
  backgroundColor: string;
  waveColor: string;
  triggered: boolean;
  transitionDuration: number; // in seconds
}

interface ActiveColor {
  backgroundColor: string;
  waveColor: string;
  progress: number;
  targetBackgroundColor: string;
  targetWaveColor: string;
  transitionDuration: number;
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
  active: boolean; // Add this property
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
  highScore?: number; // Add this property
  highestStreak?: number; // NEW: Save highest streak here
}

/* ──────────────────────────────────────────────────────────────
   NEW: Level Progression Toggles

   This interface now also includes toggles for the new trash types.
────────────────────────────────────────────────────────────── */
interface LevelToggles {
  showFlora: boolean;
  showBags: boolean;         // replaced showTrash
  showBottles: boolean;       // replaced showTrash
  showObstacles: boolean;
  showHooks: boolean;
  showVisualizer: boolean;
  showBubbles: boolean;
  showBackgroundPattern: boolean;
  showFlipFlops: boolean;
  showToothbrushes: boolean;
  showHotdogs: boolean;
  showRubberDuckies: boolean;
}

interface Props {
  onGameStart?: () => void;
}

const MusicReactiveOceanGame: React.FC<Props> = ({ onGameStart }) => {
  // Add new state for flora loading
  const [floraLoaded, setFloraLoaded] = useState(false);

  // UI state
  const [audioProgress, setAudioProgress] = useState(0);
  const audioProgressRef = useRef(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [levelEnded, setLevelEnded] = useState(false);
  // State for pending level selection from the pause menu
  const [pendingLevel, setPendingLevel] = useState<Level | null>(null);
  // Health state – fish starts with 100 hit points
  const [health, setHealth] = useState(100);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  // NEW: About modal state (for replacing merch link)
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Add new state for levels
  const [currentLevel, setCurrentLevel] = useState<Level>({
    id: 1,
    title: "WELCOME TO CVCHE",
    songFile: "https://storage.googleapis.com/assets.urnowhere.com/publicmedia/cvche/welcomeToCVCHE.mp3",
    initialBackground: "#FDF200",
    initialWaveColor: "rgba(253,242,0,0.4)",
    unlocked: true,
    isCaveMechanic: false
  });

  // Create a ref to always hold the current level so that our game loop uses the latest value
  const currentLevelRef = useRef(currentLevel);
  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  // Add new state for high scores
  const [levels, setLevels] = useState<Level[]>(() => {
    const savedLevels = localStorage.getItem('gameLevels');
    const defaultLevels = [
      {
        id: 1,
        title: "WELCOME TO CVCHE",
        songFile: "https://storage.googleapis.com/assets.urnowhere.com/publicmedia/cvche/welcomeToCVCHE.mp3",
        initialBackground: "#FDF200",
        initialWaveColor: "rgba(253,242,0,0.4)",
        unlocked: true,
        isCaveMechanic: false,
        highScore: 0,
        highestStreak: 0
      }

      /* You may add additional levels here */
    ];
    if (savedLevels) {
      const parsedLevels = JSON.parse(savedLevels);
      const mergedLevels = defaultLevels.map(defaultLevel => {
        const savedLevel = parsedLevels.find((level: Level) => level.id === defaultLevel.id);
        return savedLevel ? { ...defaultLevel, ...savedLevel } : defaultLevel;
      });
      return mergedLevels;
    }
    return defaultLevels;
  });

  // Instead of state for colors, use refs so updates are immediate.
  const backgroundColorRef = useRef("#FDF200");
  const waveColorRef = useRef("rgba(253,242,0,0.4)");

  // Outer container ref for immediate background style updates.
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Use a dedicated ref for the stars canvas (sparkling stars effect).
  const starsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // DOM refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Control game loop
  const gameLoopRef = useRef<boolean>(false);
  const lastBeatTimeRef = useRef<number>(0);
  const beatThreshold = 30;
  const levelStartDelay = 0;

  // Store the requestAnimationFrame ID so we can cancel it on pause
  const animationFrameIdRef = useRef<number | null>(null);

  // Ref for deltaTime calculation
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Audio analyser refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Preload images
  const fishImageRef = useRef<HTMLImageElement | null>(null);
  const waterBottleRef = useRef<HTMLImageElement | null>(null);
  const plasticBagRef = useRef<HTMLImageElement | null>(null);
  const obstacleImageRef = useRef<HTMLImageElement | null>(null);
  const fishHookRef = useRef<HTMLImageElement | null>(null);
  // New trash item images
  const flipflopRef = useRef<HTMLImageElement | null>(null);
  const toothbrushRef = useRef<HTMLImageElement | null>(null);
  const hotdogRef = useRef<HTMLImageElement | null>(null);
  const rubberDuckyRef = useRef<HTMLImageElement | null>(null);

  const activeTimedTextsRef = useRef<ActiveTimedText[]>([]);

  // Speed multiplier ref
  const speedMultiplier = useRef<number>(1);

  // Ref to hold current amplitude
  const amplitudeRef = useRef<number>(0);

  // Bubbles ref
  const bubblesRef = useRef<Bubble[]>([]);

  // Flora refs
  const floraImagesRef = useRef<HTMLImageElement[]>([]);
  const floraItemsRef = useRef<Flora[]>([]);

  // Sound effects refs
  const pickupSoundRef = useRef<HTMLAudioElement | null>(null);
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);

  // Streak display animation ref
  const streakDisplayRef = useRef<StreakDisplay>({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1
  });

  // Cave mechanics refs
  const caveRef = useRef<{
    upper: { points: { x: number; y: number }[]; amplitude: number };
    lower: { points: { x: number; y: number }[]; amplitude: number };
  }>({
    upper: { points: [], amplitude: 0 },
    lower: { points: [], amplitude: 0 }
  });

  // Canvas preview ref for landscape mode (before game starts)
  const landscapePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Additional refs
  const lastCollisionTimeRef = useRef<number>(0);
  const lastProximityScoreTimeRef = useRef<number>(0);
  const PROXIMITY_SCORE_COOLDOWN = 500;

  // ─── UPDATED: Level Progression Toggles (with new toggles for flipflops, toothbrushes, hotdogs) ─────────────────────────────
  const levelTogglesRef = useRef<LevelToggles>({
    showFlora: false,
    showBags: false,
    showBottles: false,
    showObstacles: false,
    showHooks: false,
    showVisualizer: false,
    showBubbles: false,
    showBackgroundPattern: false,
    showFlipFlops: false,
    showToothbrushes: false,
    showHotdogs: false,
    showRubberDuckies: false
  });

  // New Refs for Portrait Fish Animation
  const portraitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const portraitParticlesRef = useRef<Particle[]>([]);
  const portraitAnimationFrameRef = useRef<number | null>(null);
  const portraitFishPositionRef = useRef({ x: 0, y: 0, rotation: 0 });

  // Helper: Interpolate between two colors
  const interpolateColor = (color1: string, color2: string, factor: number) => {
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
  };

  // ─── UPDATED: Timed Text Events ─────────────────────────────
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
    barrelImg.src = '/sprites/oilSplat.webp';

    const hookImg = new Image();
    hookImg.onload = () => { fishHookRef.current = hookImg; };
    hookImg.src = '/sprites/fishHook.webp';

    // New trash item images
    const flipflopImg = new Image();
    flipflopImg.onload = () => { flipflopRef.current = flipflopImg; };
    flipflopImg.src = '/sprites/flipflop.webp';

    const toothbrushImg = new Image();
    toothbrushImg.onload = () => { toothbrushRef.current = toothbrushImg; };
    toothbrushImg.src = '/sprites/toothbrush.webp';

    const hotdogImg = new Image();
    hotdogImg.onload = () => { hotdogRef.current = hotdogImg; };
    hotdogImg.src = '/sprites/hotdog.webp';

    const rubberDuckyImg = new Image();
    rubberDuckyImg.onload = () => { rubberDuckyRef.current = rubberDuckyImg; };
    rubberDuckyImg.src = '/sprites/rubberDucky.webp';

    // Initialize sound effects
    const pickupSound = new Audio('/sounds/pickup.mp3');
    pickupSound.volume = 0.3;
    pickupSoundRef.current = pickupSound;

    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.volume = 0.3;
    hitSoundRef.current = hitSound;
  }, []);

  useEffect(() => {
    // Load flora images
    const floraFileNames = ['1 (1).webp', ...Array.from({ length: 20 }, (_, i) => `1 (${i + 16}).webp`)];
    let loadedCount = 0;
    floraFileNames.forEach(fileName => {
      const img = new Image();
      img.onload = () => {
        floraImagesRef.current.push(img);
        loadedCount++;
        if (loadedCount === floraFileNames.length) {
          initializeFlora();
          setFloraLoaded(true);
        }
      };
      img.src = `/sprites/flora/${fileName}`;
    });
  }, []);

  const initializeFlora = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const MAX_FLORA = 50;
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

  // ─── Helper: Draw a heart shape ─────────────────────────────
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number) => {
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

  // ─── Modified createParticles ─────────────────────────────
  const createParticles = (particles: Particle[], x: number, y: number, color: string, count: number, shape: 'circle' | 'heart' = 'circle') => {
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

  // Persistent game state
  const gameStateRef = useRef({
    player: {
      x: 100,
      y: window.innerHeight / 2,
      width: 50,
      height: 30,
      speed: 5,
      rotation: 0,
      spinRotation: 0,
      vy: 0,
      hitTime: undefined as number | undefined,
      hitType: undefined as 'obstacle' | 'fishhook' | 'trash' | 'flipflop' | 'toothbrush' | 'hotdog' | 'rubberducky' | undefined
    },
    trashList: [] as GameItem[],
    obstacles: [] as GameItem[],
    particles: [] as Particle[],
    score: 0,
    scorePopups: [] as ScorePopup[],
    trashStats: { totalSpawned: 0, collected: 0, missed: 0 },
    streak: 0,
    multiplier: 1,
    highestStreak: 0,
  });

  const timedTextEventsRef = useRef<TimedTextEvent[]>([
    { timestamp: 9.35, text: "WELCOME TO CVCHE", triggered: false },
    { timestamp: 11, text: "Save the Reef. Collect The Plastic.", triggered: false },
    { timestamp: 26, text: "Don't Get Sticky!", triggered: false },
    { timestamp: 102, text: "COME ON FLUFFY!", triggered: false },
    { timestamp: 105, text: "PUFF. PUFF. GET FLUFFY!", triggered: false },
    { timestamp: 200, text: "Dance Dance Evolution!", triggered: false },
    { timestamp: 234, text: "Don't Get Hooked!", triggered: false },
    { timestamp: 258, text: "Getting Fluffy!", triggered: false },
    { timestamp: 282, text: "GET FLUFFY - STAY FLUFFY", triggered: false },
    { timestamp: 325, text: "GO BABY GO!", triggered: false },
    { timestamp: 355, text: "ALMOST THERE!", triggered: false },
    { timestamp: 387, text: "YOU ARE AMAZING!", triggered: false },
    { timestamp: 405, text: "FLUFFY LOVES YOU", triggered: false },
    { timestamp: 420, text: "AMAZING JOB FLUFFY! STAY TUNED FOR MORE ADVENTURES! ", triggered: false },
    { timestamp: 431, text: "THE END", triggered: false },
  ]);

  const colorEventsRef = useRef<TimedColorEvent[]>([
    { timestamp: 0, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: true, transitionDuration: 3 },
    { timestamp: 105, backgroundColor: "#FECB07", waveColor: "rgba(254,203,7,0.4)", triggered: false, transitionDuration: 3 },
    { timestamp: 139, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 3 },
    { timestamp: 234, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 240, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 2 },
    { timestamp: 258, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 264, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 274, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 280, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 282, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 288, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 325, backgroundColor: "#F47920", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 330, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 335, backgroundColor: "#FECB07", waveColor: "rgba(254,203,7,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 340, backgroundColor: "#F47920", waveColor: "rgba(244,121,32,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 345, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 350, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 355, backgroundColor: "#A4CE38", waveColor: "rgba(164,206,56,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 360, backgroundColor: "#1489CF", waveColor: "rgba(20,137,207,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 361, backgroundColor: "#ED1D24", waveColor: "rgba(237,29,36,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 362, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 363, backgroundColor: "#FECB07", waveColor: "rgba(254,203,7,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 364, backgroundColor: "#F47920", waveColor: "rgba(244,121,32,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 365, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 390, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 409, backgroundColor: "#A4CE38", waveColor: "rgba(164,206,56,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 410, backgroundColor: "#1489CF", waveColor: "rgba(20,137,207,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 411, backgroundColor: "#ED1D24", waveColor: "rgba(237,29,36,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 412, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 413, backgroundColor: "#FECB07", waveColor: "rgba(254,203,7,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 424, backgroundColor: "#F47920", waveColor: "rgba(244,121,32,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 425, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 426, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 1 },
    { timestamp: 431, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  ]);

  const activeColorTransitionRef = useRef<ActiveColor>({
    backgroundColor: "#1a1a2e",
    waveColor: "rgba(0,102,255,0.4)",
    progress: 1,
    targetBackgroundColor: "#1a1a2e",
    targetWaveColor: "rgba(0,102,255,0.4)",
    transitionDuration: 3
  });

  // Input state
  const inputRef = useRef({
    isTouching: false,
    touchY: window.innerHeight / 2,
    isDesktop: false,
  });

  // Set up AudioContext and analyser when the game starts
  useEffect(() => {
    if (!gameStarted) return;
    const audioEl = audioRef.current as ExtendedHTMLAudioElement;
    if (!audioEl) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.error("Web Audio API not supported.");
      return;
    }
    const audioCtx = audioEl._audioCtx || new AudioContextClass();
    audioEl._audioCtx = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    let source: MediaElementAudioSourceNode;
    if (!audioEl._mediaElementSource) {
      source = audioCtx.createMediaElementSource(audioEl);
      audioEl._mediaElementSource = source;
    } else {
      source = audioEl._mediaElementSource;
    }
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    const resumeAudioCtx = () => {
      if (audioCtx.state !== 'running') audioCtx.resume();
    };
    document.body.addEventListener('touchstart', resumeAudioCtx, { once: true });
    document.body.addEventListener('click', resumeAudioCtx, { once: true });
    return () => {
      document.body.removeEventListener('touchstart', resumeAudioCtx);
      document.body.removeEventListener('click', resumeAudioCtx);
    };
  }, [gameStarted]);

  // Set up input event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hasCoarse = window.matchMedia('(pointer: coarse)').matches;
    inputRef.current.isDesktop = !hasCoarse;
    const handleMouseMove = (e: MouseEvent) => {
      if (inputRef.current.isDesktop) inputRef.current.touchY = e.clientY;
      else if (inputRef.current.isTouching) inputRef.current.touchY = e.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (inputRef.current.isTouching) inputRef.current.touchY = e.touches[0].clientY;
      e.preventDefault();
    };
    const handleTouchStart = (e: TouchEvent) => {
      inputRef.current.isTouching = true;
      inputRef.current.touchY = e.touches[0].clientY;
      e.preventDefault();
    };
    const handleTouchEnd = (e: TouchEvent) => {
      inputRef.current.isTouching = false;
      e.preventDefault();
    };
    if (!hasCoarse) canvas.addEventListener('mousemove', handleMouseMove);
    else {
      canvas.addEventListener('mousedown', () => inputRef.current.isTouching = true);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', () => inputRef.current.isTouching = false);
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (!hasCoarse) canvas.removeEventListener('mousemove', handleMouseMove);
      else {
        canvas.removeEventListener('mousedown', () => inputRef.current.isTouching = true);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', () => inputRef.current.isTouching = false);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);
  
  
  // Update audio progress ref 
  useEffect(() => {
    audioProgressRef.current = audioProgress;
  }, [audioProgress]);

  // Utility: Get average amplitude from analyser data
  const getAverageAmplitude = () => {
    const analyser = analyserRef.current, dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return 0;
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    return sum / dataArray.length;
  };

  // Beat detection helper
  const detectBeat = (amplitude: number) => {
    const now = Date.now();
    if (amplitude > beatThreshold && now - lastBeatTimeRef.current > 500) {
      lastBeatTimeRef.current = now;
      return true;
    }
    return false;
  };

  // ─── Modified drawBackgroundPattern ─────────────────────────────
  const bgPatternBubblesRef = useRef<Bubble[]>([]);
  const drawBackgroundPattern = (ctx: CanvasRenderingContext2D, amplitudeFactor: number) => {
    if (!canvasRef.current) return;
    ctx.save();
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const currentTime = Date.now();
    for (let x = 0; x <= width; x += 5) {
      const timeOffset = currentTime / 1000;
      const frequency = 4 + Math.sin(timeOffset) * 2 * (1 + amplitudeFactor * 0.5);
      const y = height + Math.sin((x / width * frequency * Math.PI) + timeOffset) * (50 + amplitudeFactor * 70);
      if (Math.random() < 0.1) {
        bgPatternBubblesRef.current.push({
          x,
          y,
          radius: 2 + Math.random() * 2,
          speed: 0.3 + Math.random() * 0.2,
          opacity: 1,
        });
      }
    }
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

  const drawBackground = (ctx: CanvasRenderingContext2D, amplitudeFactor: number) => {
    if (!canvasRef.current) return;
    const width = canvasRef.current.width, height = canvasRef.current.height;
    ctx.fillStyle = backgroundColorRef.current;
    ctx.fillRect(0, 0, width, height);
    const gradientSize = Math.max(width, height) * (0.8 + amplitudeFactor * 0.4);
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, gradientSize);
    const alpha = 0.15 + amplitudeFactor * 0.2;
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.5})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const vignetteGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
    vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGradient.addColorStop(0.7, `rgba(0,0,0,${0.2 + amplitudeFactor * 0.1})`);
    vignetteGradient.addColorStop(1, `rgba(0,0,0,${0.3 + amplitudeFactor * 0.15})`);
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
    if (levelTogglesRef.current.showBackgroundPattern) {
      drawBackgroundPattern(ctx, amplitudeFactor);
    }
  };

  const drawSpectrum = (ctx: CanvasRenderingContext2D) => {
    const analyser = analyserRef.current, dataArray = dataArrayRef.current;
    if (!analyser || !dataArray || !canvasRef.current) return;
    const barWidth = (canvasRef.current.width / dataArray.length) * 2.5;
    let posX = 0;
    analyser.getByteFrequencyData(dataArray);
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = dataArray[i] / 2;
      const gradient = ctx.createLinearGradient(0, canvasRef.current.height, 0, canvasRef.current.height - barHeight);
      let startColor = waveColorRef.current, endColor = waveColorRef.current;
      if (waveColorRef.current.startsWith('rgba')) {
        const components = waveColorRef.current.match(/[\d.]+/g);
        if (components && components.length >= 4) {
          const [r, g, b] = components;
          startColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
          endColor = `rgba(${r}, ${g}, ${b}, 0)`;
        }
      } else if (waveColorRef.current.startsWith('#')) {
        const hex = waveColorRef.current.slice(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        startColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
        endColor = `rgba(${r}, ${g}, ${b}, 0)`;
      }
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(posX, canvasRef.current.height - barHeight, barWidth, barHeight);
      posX += barWidth + 1;
    }
  };

  // Updated drawPlayer remains unchanged
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: typeof gameStateRef.current.player, fishImg: HTMLImageElement | null) => {
    if (!fishImg || !fishImg.complete) return;
    const aspect = fishImg.naturalWidth / fishImg.naturalHeight;
    const drawWidth = player.width * 1.25;
    const drawHeight = drawWidth / aspect;
    ctx.save();
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(player.rotation + player.spinRotation);
    ctx.drawImage(fishImg, -drawWidth / 2 + 20, -drawHeight / 2, drawWidth, drawHeight);
    if (player.hitTime) {
      const elapsed = Date.now() - player.hitTime;
      if (elapsed < 3000) {
        const overlayAlpha = 1 - (elapsed / 3000);
        const tintColor = player.hitType === 'fishhook' ? '255,0,0' : '0,0,0';
        const offscreen = document.createElement('canvas');
        offscreen.width = drawWidth;
        offscreen.height = drawHeight;
        const offCtx = offscreen.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(fishImg, 0, 0, drawWidth, drawHeight);
          offCtx.globalCompositeOperation = 'source-atop';
          offCtx.fillStyle = `rgba(${tintColor},${overlayAlpha})`;
          offCtx.fillRect(0, 0, drawWidth, drawHeight);
          ctx.drawImage(offscreen, -drawWidth / 2 + 20, -drawHeight / 2);
        }
      } else {
        player.hitTime = undefined;
        player.hitType = undefined;
      }
    }
    ctx.restore();
  };

  // Updated drawItem to cover trash items plus new types
  const drawItem = (ctx: CanvasRenderingContext2D, item: GameItem, pulse: number) => {
    ctx.save();
    if (
      (item.type === 'trash' ||
        item.type === 'flipflop' ||
        item.type === 'toothbrush' ||
        item.type === 'hotdog' ||
        item.type === 'rubberducky') && item.pickupImage
    ) {
      item.rotation = (item.rotation || 0) + 0.0125;
      const effectiveWidth = item.width * pulse;
      const effectiveHeight = item.height * pulse;
      const centerX = item.x + effectiveWidth / 2;
      const centerY = item.y + effectiveHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(item.rotation!);
      ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
    } else if (item.type === 'obstacle' && item.pickupImage) {
      item.rotation = (item.rotation || 0) + 0.0125;
      const effectiveWidth = item.width, effectiveHeight = item.height;
      const centerX = item.x + effectiveWidth / 2, centerY = item.y + effectiveHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(item.rotation!);
      ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
    } else if (item.type === 'fishhook' && item.pickupImage) {
      // Always use getSpawnY for fishhooks so they don't spawn behind the hearts
      const effectiveWidth = item.width, effectiveHeight = item.height;
      const centerX = item.x + effectiveWidth / 2, centerY = item.y + effectiveHeight / 2;
      ctx.drawImage(item.pickupImage, centerX - effectiveWidth / 2, centerY - effectiveHeight / 2, effectiveWidth, effectiveHeight);
    } else {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, item.width, item.height);
    }
    ctx.restore();
  };

  // Use a constant top buffer to ensure nothing spawns behind the hearts or higher
  const TOP_BUFFER = 80;
  const getSpawnY = (itemHeight: number) => {
    if (!canvasRef.current) return TOP_BUFFER;
    return TOP_BUFFER + Math.random() * (canvasRef.current.height - TOP_BUFFER - itemHeight);
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[], factor: number) => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * speedMultiplier.current * factor;
      p.y += p.vy * factor;
      p.life -= 0.02 * factor;
      p.opacity *= 0.97;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
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

  const getMultiplierFromStreak = (streak: number) => {
    return Math.min(10, 1 + Math.floor(streak / 5));
  };

  const getParticleColorFromStreak = (streak: number): string => {
    if (streak >= 45) return '#FF00FF';
    if (streak >= 35) return '#FF0088';
    if (streak >= 25) return '#FF0000';
    if (streak >= 15) return '#FFA500';
    if (streak >= 5) return '#FFFF00';
    return '#FFD700';
  };

  const createSwimParticles = (particles: Particle[], player: typeof gameStateRef.current.player) => {
    const streak = gameStateRef.current.streak;
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

  const updateAndDrawScorePopups = (ctx: CanvasRenderingContext2D, factor: number) => {
    const popups = gameStateRef.current.scorePopups;
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

  const updateAndDrawTimedTexts = (ctx: CanvasRenderingContext2D, factor: number) => {
    if (!canvasRef.current) return;
    activeTimedTextsRef.current.forEach((item) => {
      let fontSize = 80;
      const margin = 40;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let textWidth;
      do {
        ctx.font = `${fontSize}px Orbitron`;
        textWidth = ctx.measureText(item.text).width;
        if (textWidth > (canvasRef.current?.width ?? 400) - margin) {
          fontSize -= 2;
        } else {
          break;
        }
      } while (fontSize > 10);
      const opacity = item.lifetime / 200;
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.fillText(item.text, (canvasRef.current?.width ?? 400) / 2, (canvasRef.current?.height ?? 200) / 2);
      ctx.restore();
      item.lifetime -= factor;
    });
    activeTimedTextsRef.current = activeTimedTextsRef.current.filter(item => item.lifetime > 0);
  };

  // Landscape preview loop for when game hasn't started in landscape mode
  useEffect(() => {
    if (gameStarted || !isLandscape) return;
    let previewLandscapeAnimationFrameId: number;
    const previewLandscape = () => {
      if (gameStarted || !landscapePreviewCanvasRef.current) return;
      const ctx = landscapePreviewCanvasRef.current.getContext('2d');
      if (!ctx) return;
      const canvas = landscapePreviewCanvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // For preview, we just draw the player (fish) without background/particles.
      drawPlayer(ctx, gameStateRef.current.player, fishImageRef.current);
      updateAndDrawParticles(ctx, gameStateRef.current.particles, 1);
      createSwimParticles(gameStateRef.current.particles, gameStateRef.current.player);
      previewLandscapeAnimationFrameId = requestAnimationFrame(previewLandscape);
    };
    previewLandscape();
    return () => cancelAnimationFrame(previewLandscapeAnimationFrameId);
  }, [gameStarted, isLandscape]);

  // New useEffect to start portrait animation when in portrait mode and game hasn't started
  useEffect(() => {
    if (!gameStarted && !isLandscape) {
      portraitAnimationFrameRef.current = requestAnimationFrame(animatePortrait);
    }
    return () => {
      if (portraitAnimationFrameRef.current) {
        cancelAnimationFrame(portraitAnimationFrameRef.current);
        portraitAnimationFrameRef.current = null;
      }
    };
  }, [gameStarted, isLandscape]);

  const updateAndDrawBubbles = (ctx: CanvasRenderingContext2D, factor: number) => {
    const canvas = ctx.canvas;
    const amplitude = amplitudeRef.current;
    if (Math.random() < (amplitude / 255) * 0.5) {
      bubblesRef.current.push({
        x: Math.random() * canvas.width,
        y: canvas.height,
        radius: 2 + Math.random() * 3,
        speed: 1 + Math.random() * 2,
        opacity: 1,
      });
    }
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const bubble = bubblesRef.current[i];
      bubble.y -= bubble.speed * factor;
      bubble.opacity -= 0.005 * factor;
      if (bubble.opacity <= 0 || bubble.y + bubble.radius < 0) {
        bubblesRef.current.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(173,216,230,${bubble.opacity})`;
      ctx.fill();
    }
  };

  // ─── UPDATED: drawFlora ─────────────────────────────
  const drawFlora = useCallback((ctx: CanvasRenderingContext2D, amplitude: number, factor: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const time = Date.now() / 1000;
    floraItemsRef.current.forEach((flora) => {
      flora.x -= flora.scrollSpeed * speedMultiplier.current * factor;
      if (flora.x + flora.width < 0) {
        flora.x = canvas.width + (Math.random() * canvas.width);
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
  }, []);

  // ─── UPDATED: Cave boundary update function (with max height clamping for desktop) ─────────────────────────────
  const updateCaveBoundaries = useCallback((amplitude: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const time = Date.now() / 1000;
    caveRef.current.upper.points = [];
    caveRef.current.lower.points = [];
    const playerMinWidth = gameStateRef.current.player.width;
    const minCaveHeight = playerMinWidth * 3;
    const maxAmplitude = (canvas.height - minCaveHeight) / 2;
    const computedBeatAmplitude = amplitude * 4;
    const effectiveBeatAmplitude = inputRef.current.isDesktop
      ? Math.min(computedBeatAmplitude, 50)
      : Math.min(computedBeatAmplitude, maxAmplitude);
    const centerY = canvas.height / 2;
    for (let x = 0; x <= canvas.width; x += 10) {
      const waveOffset = Math.sin(x / 150 + time * 3) * effectiveBeatAmplitude +
        Math.sin(x / 75 + time * 2) * (effectiveBeatAmplitude * 0.5) +
        Math.sin(x / 37.5 + time * 4) * (effectiveBeatAmplitude * 0.25);
      const curveY = centerY + waveOffset;
      caveRef.current.upper.points.push({
        x,
        y: curveY - minCaveHeight - (effectiveBeatAmplitude * 0.5)
      });
      caveRef.current.lower.points.push({
        x,
        y: curveY + minCaveHeight + (effectiveBeatAmplitude * 0.5)
      });
    }
  }, []);

  // ─── UPDATED: In the obstacles loop, for fishhooks only collide with the bottom half ─
  const gameLoop = useCallback(() => {
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
    if (audioTime < 10) {
      levelTogglesRef.current = {
        showFlora: false,
        showBags: false,
        showBottles: false,
        showObstacles: false,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 10 && audioTime < 11) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: false,
        showBottles: false,
        showObstacles: false,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 11 && audioTime < 26) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: false,
        showObstacles: false,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 26 && audioTime < 62) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: false,
        showObstacles: true,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 62 && audioTime < 80) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: false,
        showBottles: true,
        showObstacles: true,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 80 && audioTime < 105) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: false,
        showBottles: true,
        showObstacles: true,
        showHooks: false,
        showVisualizer: true,
        showBubbles: false,
        showBackgroundPattern: true,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 105 && audioTime < 234) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showObstacles: true,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: true,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 234 && audioTime < 265) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showObstacles: false,
        showHooks: true,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: false,
        showToothbrushes: true,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 265 && audioTime < 300) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showObstacles: true,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: true,
        showRubberDuckies: false,
      };
    } else if (audioTime >= 300) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showObstacles: true,
        showHooks: true,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true,
      };
    }
    if (audioTime >= 330 && audioTime < 390) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showObstacles: false,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true,
      };
    } else if (audioTime >= 390 && audioTime < 410) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showObstacles: true,
        showHooks: true,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true,
      };
    } else if (audioTime >= 410) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: false,
        showObstacles: false,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
    colorEventsRef.current.forEach(event => {
      if (!event.triggered && audioTime >= event.timestamp) {
        event.triggered = true;
        activeColorTransitionRef.current = {
          backgroundColor: backgroundColorRef.current,
          waveColor: waveColorRef.current,
          progress: 0,
          targetBackgroundColor: event.backgroundColor,
          targetWaveColor: event.waveColor,
          transitionDuration: event.transitionDuration
        };
      }
    });
    const transition = activeColorTransitionRef.current;
    if (transition.progress < 1) {
      const deltaTime = 1 / 60;
      const transitionSpeed = deltaTime / transition.transitionDuration;
      transition.progress = Math.min(1, transition.progress + transitionSpeed);
      const newBg = interpolateColor(transition.backgroundColor, transition.targetBackgroundColor, transition.progress);
      const newWave = interpolateColor(transition.waveColor, transition.targetWaveColor, transition.progress);
      backgroundColorRef.current = newBg;
      waveColorRef.current = newWave;
      if (containerRef.current) containerRef.current.style.background = newBg;
    }
    const amplitude = getAverageAmplitude();
    amplitudeRef.current = amplitude;
    const pulse = 1 + amplitude / 100;
    const audioTimeMs = audioRef.current ? audioRef.current.currentTime * 1000 : 0;
    const effectiveTime = Math.max(0, audioTimeMs - levelStartDelay);
    speedMultiplier.current = 1 + ((effectiveTime / 1000) / 120) * 0.5;
    if (detectBeat(amplitude)) {
      if (levelTogglesRef.current.showBottles && waterBottleRef.current && canvasRef.current) {
        if (Math.random() < 0.075 + ((audioProgressRef.current / 200))) {
          gameStateRef.current.trashList.push({
            x: canvasRef.current.width,
            y: getSpawnY(50),
            width: 30,
            height: 50,
            type: 'trash',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: waterBottleRef.current
          });
          gameStateRef.current.trashStats.totalSpawned++;
        }
      }
      if (levelTogglesRef.current.showBags && plasticBagRef.current && canvasRef.current) {
        if (Math.random() < 0.075 + (audioProgressRef.current / 200)) {
          gameStateRef.current.trashList.push({
            x: canvasRef.current.width,
            y: getSpawnY(50),
            width: 30,
            height: 50,
            type: 'trash',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: plasticBagRef.current
          });
          gameStateRef.current.trashStats.totalSpawned++;
        }
      }
      if (levelTogglesRef.current.showObstacles && obstacleImageRef.current && canvasRef.current) {
        if (Math.random() < 0.075 + (audioProgressRef.current / 200)) {
          gameStateRef.current.obstacles.push({
            x: canvasRef.current.width,
            y: getSpawnY(50),
            width: 50,
            height: 50,
            type: 'obstacle',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: obstacleImageRef.current
          });
        }
      }
      if (levelTogglesRef.current.showHooks && fishHookRef.current && canvasRef.current) {
        if (Math.random() < 0.5) {
          const fishhookY = canvasRef.current.height * (0.1 + Math.random() * 0.4);
          gameStateRef.current.obstacles.push({
            x: canvasRef.current.width,
            y: fishhookY,
            width: 50,
            height: 150,
            type: 'fishhook',
            speed: 1 + Math.random() * 2,
            pickupImage: fishHookRef.current
          });
        }
      }
      // New trash item spawns with lower probability
      if (levelTogglesRef.current.showFlipFlops && flipflopRef.current && canvasRef.current) {
        if (Math.random() < 0.03) {
          gameStateRef.current.trashList.push({
            x: canvasRef.current.width,
            y: getSpawnY(50),
            width: 30,
            height: 50,
            type: 'flipflop',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: flipflopRef.current
          });
          gameStateRef.current.trashStats.totalSpawned++;
        }
      }
      if (levelTogglesRef.current.showToothbrushes && toothbrushRef.current && canvasRef.current) {
        if (Math.random() < 0.03) {
          gameStateRef.current.trashList.push({
            x: canvasRef.current.width,
            y: getSpawnY(50),
            width: 10,
            height: 40,
            type: 'toothbrush',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: toothbrushRef.current
          });
          gameStateRef.current.trashStats.totalSpawned++;
        }
      }
      if (levelTogglesRef.current.showHotdogs && hotdogRef.current && canvasRef.current) {
        if (Math.random() < 0.03) {
          gameStateRef.current.trashList.push({
            x: canvasRef.current.width,
            y: getSpawnY(50),
            width: 50,
            height: 25,
            type: 'hotdog',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: hotdogRef.current
          });
          gameStateRef.current.trashStats.totalSpawned++;
        }
      }
      if (levelTogglesRef.current.showRubberDuckies && rubberDuckyRef.current && canvasRef.current) {
        if (Math.random() < 0.03) {
          gameStateRef.current.trashList.push({
            x: canvasRef.current.width,
            y: getSpawnY(50),
            width: 50,
            height: 50,
            type: 'rubberducky',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: rubberDuckyRef.current
          });
          gameStateRef.current.trashStats.totalSpawned++;
        }
      }
    }
    drawBackground(ctx, amplitude / 100);
    if (levelTogglesRef.current.showVisualizer) {
      drawSpectrum(ctx);
    }
    if (levelTogglesRef.current.showFlora) {
      drawFlora(ctx, amplitude, factor);
    }
    timedTextEventsRef.current.forEach(event => {
      if (!event.triggered && audioTime >= event.timestamp) {
        event.triggered = true;
        activeTimedTextsRef.current.push({ text: event.text, lifetime: 200 });
      }
    });
    if (levelTogglesRef.current.showBubbles) {
      updateAndDrawBubbles(ctx, factor);
    }
    updateAndDrawTimedTexts(ctx, factor);
    if (inputRef.current.isDesktop || inputRef.current.isTouching) {
      const targetY = inputRef.current.touchY - (gameStateRef.current.player.height / 2);
      const currentY = gameStateRef.current.player.y;
      const dy = targetY - currentY;
      gameStateRef.current.player.vy = gameStateRef.current.player.vy * 0.9 + dy * 0.1 * factor;
      gameStateRef.current.player.y += gameStateRef.current.player.vy * 0.1 * factor;
      // Reduce rotation interpolation by 50%
      const targetRotation = Math.atan2(gameStateRef.current.player.vy * 0.1 * factor, 2) * 0.25;
      gameStateRef.current.player.rotation = targetRotation;
    } else {
      gameStateRef.current.player.vy *= 0.95;
      gameStateRef.current.player.rotation *= 0.95;
    }
    if (gameStateRef.current.player.spinRotation !== 0) {
      gameStateRef.current.player.spinRotation *= 0.97;
      if (Math.abs(gameStateRef.current.player.spinRotation) < 0.01) {
        gameStateRef.current.player.spinRotation = 0;
      }
    }
    for (let i = gameStateRef.current.trashList.length - 1; i >= 0; i--) {
      const item = gameStateRef.current.trashList[i];
      item.x -= item.speed * speedMultiplier.current * factor;
      if (item.x + item.width * pulse < 0) {
        gameStateRef.current.trashStats.missed++;
        gameStateRef.current.trashList.splice(i, 1);
        continue;
      }
      const effectiveWidth = item.width * pulse;
      const effectiveHeight = item.height * pulse;
      if (
        gameStateRef.current.player.x < item.x + effectiveWidth &&
        gameStateRef.current.player.x + gameStateRef.current.player.width > item.x &&
        gameStateRef.current.player.y < item.y + effectiveHeight &&
        gameStateRef.current.player.y + gameStateRef.current.player.height > item.y
      ) {
        const streak = gameStateRef.current.streak + 1;
        const multiplier = getMultiplierFromStreak(streak);
        const points = 10 * multiplier;
        gameStateRef.current.streak = streak;
        gameStateRef.current.multiplier = multiplier;
        gameStateRef.current.highestStreak = Math.max(gameStateRef.current.highestStreak, streak);
        gameStateRef.current.score += points;
        gameStateRef.current.trashStats.collected++;
        const popupX = item.x + effectiveWidth / 2;
        const popupY = item.y + effectiveHeight / 2;
        const scoreText = multiplier > 1 ? `+${points} (${multiplier}x)` : `+${points}`;
        gameStateRef.current.scorePopups.push({
          x: popupX,
          y: popupY,
          text: scoreText,
          opacity: 1,
          lifetime: 100
        });
        if (streak % 5 === 0) {
          gameStateRef.current.scorePopups.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            text: `${streak} STREAK! ${multiplier}x MULTIPLIER!`,
            opacity: 1,
            lifetime: 120
          });
        }
        if (item.pickupImage === waterBottleRef.current || item.pickupImage === plasticBagRef.current) {
          createParticles(gameStateRef.current.particles, item.x, item.y, '#FFC0CB', 20, 'heart');
          createParticles(gameStateRef.current.particles, item.x, item.y, '#1489CF', 20, 'heart');
        } else {
          createParticles(gameStateRef.current.particles, item.x, item.y, getParticleColorFromStreak(streak), 20);
        }
        gameStateRef.current.trashList.splice(i, 1);
        setHealth(prev => Math.min(100, prev + 1));
        streakDisplayRef.current.scale = 1.3;
      } else {
        drawItem(ctx, item, pulse);
      }
    }
    for (let i = gameStateRef.current.obstacles.length - 1; i >= 0; i--) {
      const item = gameStateRef.current.obstacles[i];
      item.x -= item.speed * speedMultiplier.current * factor;
      if (audioTime >= songDuration * 0.5 && item.baseY !== undefined) {
        const bobbingOffset = Math.sin(Date.now() / 200) * 10 * (amplitudeRef.current / 100);
        item.y = item.baseY + bobbingOffset;
      }
      if (item.x + item.width < 0) {
        gameStateRef.current.obstacles.splice(i, 1);
        continue;
      }
      if (item.type === 'fishhook') {
        const hookLeft = item.x;
        const hookRight = item.x + item.width;
        const hookTop = item.y + item.height / 2;
        const hookBottom = item.y + item.height;
        const player = gameStateRef.current.player;
        if (
          player.x < hookRight &&
          player.x + player.width > hookLeft &&
          player.y < hookBottom &&
          player.y + player.height > hookTop
        ) {
          gameStateRef.current.score = Math.max(0, gameStateRef.current.score - 20);
          gameStateRef.current.streak = 0;
          gameStateRef.current.multiplier = 1;
          const popupX = player.x + player.width / 2;
          const popupY = player.y + player.height / 2;
          gameStateRef.current.scorePopups.push({ x: popupX, y: popupY, text: "-20", opacity: 1, lifetime: 100 });
          createParticles(gameStateRef.current.particles, player.x, player.y, '#FF0000', 20);
          hitSoundRef.current?.play().catch(console.error);
          player.spinRotation = Math.PI * 4;
          player.hitTime = Date.now();
          player.hitType = item.type;
          setHealth(prev => {
            const newHealth = prev - 10;
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
          gameStateRef.current.obstacles.splice(i, 1);
          streakDisplayRef.current.scale = 0.8;
          continue;
        } else {
          drawItem(ctx, item, 1);
        }
      } else {
        if (
          gameStateRef.current.player.x < item.x + item.width &&
          gameStateRef.current.player.x + gameStateRef.current.player.width > item.x &&
          gameStateRef.current.player.y < item.y + item.height &&
          gameStateRef.current.player.y + gameStateRef.current.player.height > item.y
        ) {
          gameStateRef.current.score = Math.max(0, gameStateRef.current.score - 20);
          gameStateRef.current.streak = 0;
          gameStateRef.current.multiplier = 1;
          const popupX = item.x + item.width / 2;
          const popupY = item.y + item.height / 2;
          gameStateRef.current.scorePopups.push({ x: popupX, y: popupY, text: "-20", opacity: 1, lifetime: 100 });
          const particleColor = '#000000';
          createParticles(gameStateRef.current.particles, item.x, item.y, particleColor, 20);
          hitSoundRef.current?.play().catch(console.error);
          gameStateRef.current.player.spinRotation = -Math.PI * 4;
          gameStateRef.current.player.hitTime = Date.now();
          gameStateRef.current.player.hitType = item.type;
          setHealth(prev => {
            const newHealth = prev - 10;
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
          gameStateRef.current.obstacles.splice(i, 1);
          streakDisplayRef.current.scale = 0.8;
          continue;
        } else {
          drawItem(ctx, item, 1);
        }
      }
    }
    createSwimParticles(gameStateRef.current.particles, gameStateRef.current.player);
    updateAndDrawParticles(ctx, gameStateRef.current.particles, factor);
    updateAndDrawScorePopups(ctx, factor);
    if (Math.abs(gameStateRef.current.player.rotation) < 0.01) {
      gameStateRef.current.player.rotation = 0;
    }
    drawPlayer(ctx, gameStateRef.current.player, fishImageRef.current);
    const caveActive = currentLevelRef.current.isCaveMechanic || (currentLevelRef.current.id === 1 && audioTime >= 330 && audioTime < 390);
    if (caveActive) {
      const CAVE_WARNING_DURATION = 3;
      let isWarningPeriod = false;
      if (currentLevelRef.current.id === 1 && audioTime < 330 + CAVE_WARNING_DURATION) {
        isWarningPeriod = true;
      }
      updateCaveBoundaries(amplitude);
      const ctx2 = canvas.getContext('2d');
      if (!ctx2) return;
      ctx2.save();
      const caveFillOpacity = isWarningPeriod
        ? 0.5 + 0.5 * Math.abs(Math.sin(Date.now() / 100))
        : 0.75;
      ctx2.fillStyle = `rgba(26, 26, 26, ${caveFillOpacity})`;
      ctx2.beginPath();
      ctx2.moveTo(0, 0);
      caveRef.current.upper.points.forEach(point => {
        ctx2.lineTo(point.x, point.y);
      });
      ctx2.lineTo(canvas.width, 0);
      ctx2.fill();
      ctx2.beginPath();
      ctx2.moveTo(0, canvas.height);
      caveRef.current.lower.points.forEach(point => {
        ctx2.lineTo(point.x, point.y);
      });
      ctx2.lineTo(canvas.width, canvas.height);
      ctx2.fill();
      const player = gameStateRef.current.player;
      const playerCenterX = player.x + player.width / 2;
      const playerCenterY = player.y + player.height / 2;
      let nearestCenterY = 0;
      let nearestPoint = caveRef.current.upper.points[0];
      for (let i = 0; i < caveRef.current.upper.points.length; i++) {
        const point = caveRef.current.upper.points[i];
        const lowerPoint = caveRef.current.lower.points[i];
        const centerY = (point.y + lowerPoint.y) / 2;
        if (Math.abs(point.x - playerCenterX) < Math.abs(nearestPoint.x - playerCenterX)) {
          nearestPoint = point;
          nearestCenterY = centerY;
        }
      }
      const maxDistance = canvas.height / 6;
      const distance = Math.abs(playerCenterY - nearestCenterY);
      const proximity = 1 - Math.min(distance / maxDistance, 1);
      ctx2.beginPath();
      const hue = proximity * 120;
      const caveStrokeOpacity = isWarningPeriod
        ? 0.5 + 0.5 * Math.abs(Math.sin(Date.now() / 100))
        : 0.3 + (amplitude / 255) * 0.7;
      ctx2.strokeStyle = `hsla(${hue}, 100%, 50%, ${caveStrokeOpacity})`;
      ctx2.lineWidth = 4 + (amplitude / 255) * 6;
      ctx2.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx2.shadowBlur = amplitude / 10;
      caveRef.current.upper.points.forEach((point, i) => {
        const lowerPoint = caveRef.current.lower.points[i];
        const centerY = (point.y + lowerPoint.y) / 2;
        if (i === 0) {
          ctx2.moveTo(point.x, centerY);
        } else {
          ctx2.lineTo(point.x, centerY);
        }
      });
      ctx2.stroke();
      ctx2.restore();
      const now = Date.now();
      if (proximity > 0.5 && now - lastProximityScoreTimeRef.current > PROXIMITY_SCORE_COOLDOWN) {
        lastProximityScoreTimeRef.current = now;
        const proximityBonus = Math.floor(proximity * 50);
        if (proximityBonus > 0) {
          gameStateRef.current.score += proximityBonus;
          gameStateRef.current.scorePopups.push({
            x: player.x,
            y: player.y - 30,
            text: `+${proximityBonus}`,
            opacity: 1,
            lifetime: 60
          });
        }
      }
      const checkCollision = () => {
        if (isWarningPeriod) return false;
        const player = gameStateRef.current.player;
        const playerBox = {
          top: player.y,
          bottom: player.y + player.height,
          left: player.x,
          right: player.x + player.width
        };
        for (let i = 1; i < caveRef.current.upper.points.length; i++) {
          const upperP1 = caveRef.current.upper.points[i - 1];
          const upperP2 = caveRef.current.upper.points[i];
          const lowerP1 = caveRef.current.lower.points[i - 1];
          const lowerP2 = caveRef.current.lower.points[i];
          if (playerBox.right >= upperP1.x && playerBox.left <= upperP2.x) {
            const t = (playerBox.left - upperP1.x) / (upperP2.x - upperP1.x);
            const upperY = upperP1.y + t * (upperP2.y - upperP1.y);
            const lowerY = lowerP1.y + t * (lowerP2.y - lowerP1.y);
            if (playerBox.top <= upperY || playerBox.bottom >= lowerY) {
              const collisionX = playerBox.top <= upperY ? player.x : player.x;
              const collisionY = playerBox.top <= upperY ? upperY : lowerY;
              createParticles(gameStateRef.current.particles, collisionX, collisionY, '#000000', 30);
              createParticles(gameStateRef.current.particles, collisionX, collisionY, '#FFFFFF', 15);
              gameStateRef.current.score = Math.max(0, gameStateRef.current.score - 30);
              gameStateRef.current.streak = 0;
              gameStateRef.current.multiplier = 1;
              gameStateRef.current.scorePopups.push({
                x: collisionX,
                y: collisionY,
                text: "-30",
                opacity: 1,
                lifetime: 100
              });
              hitSoundRef.current?.play().catch(console.error);
              player.spinRotation = Math.PI * 2;
              player.hitTime = Date.now();
              player.hitType = 'obstacle';
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
        return false;
      };
      const isColliding = checkCollision();
      if (isColliding && now - lastCollisionTimeRef.current > PROXIMITY_SCORE_COOLDOWN) {
        lastCollisionTimeRef.current = now;
        createParticles(gameStateRef.current.particles, gameStateRef.current.player.x, gameStateRef.current.player.y, '#000000', 30);
        createParticles(gameStateRef.current.particles, gameStateRef.current.player.x, gameStateRef.current.player.y, '#FFFFFF', 15);
        gameStateRef.current.score = Math.max(0, gameStateRef.current.score - 20);
        gameStateRef.current.streak = 0;
        gameStateRef.current.multiplier = 1;
        gameStateRef.current.scorePopups.push({
          x: gameStateRef.current.player.x,
          y: gameStateRef.current.player.y,
          text: "-20",
          opacity: 1,
          lifetime: 100
        });
        hitSoundRef.current?.play().catch(console.error);
        gameStateRef.current.player.spinRotation = Math.PI * 2;
        gameStateRef.current.player.hitTime = Date.now();
        gameStateRef.current.player.hitType = 'obstacle';
        ctx2.save();
        ctx2.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx2.fillRect(0, 0, canvas.width, canvas.height);
        ctx2.restore();
      }
    }
    setScore(gameStateRef.current.score);
    const streakScale = Math.min(3, 0.5 + (gameStateRef.current.streak / 50) + (amplitudeRef.current / 255) * 0.5);
    streakDisplayRef.current.scale = streakScale;
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  }, [updateCaveBoundaries]);

  // Update high score continuously even if level isn't ended
  useEffect(() => {
    setLevels(prev => {
      const newLevels = prev.map(level => {
        if (level.id === currentLevel.id) {
          const newHighScore = Math.max(level.highScore || 0, score);
          const newHighestStreak = Math.max(level.highestStreak || 0, gameStateRef.current.highestStreak);
          return { ...level, highScore: newHighScore, highestStreak: newHighestStreak };
        }
        return level;
      });
      localStorage.setItem('gameLevels', JSON.stringify(newLevels));
      const updatedCurrent = newLevels.find(l => l.id === currentLevel.id);
      if (updatedCurrent) {
        setCurrentLevel(updatedCurrent);
      }
      return newLevels;
    });
  }, [score, currentLevel.id]);
  // Separate loop to update song progress  
  useEffect(() => {
    if (!gameStarted) return;
    const updateProgress = () => {
      if (audioRef.current) {
        const curTime = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        if (dur) {
          setAudioProgress((curTime / dur) * 100);
          setCurrentTime(curTime);
          setDuration(dur);
          if (dur - curTime < 0.1) {
            setLevelEnded(true);
            gameLoopRef.current = false;
            if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
              animationFrameIdRef.current = null;
            }
          }
        }
      }
    };
    const intervalId = setInterval(updateProgress, 100);
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
        audioRef.current?.pause();
        gameLoopRef.current = false;
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      } else {
        audioRef.current?.play().then(() => {
          if (!animationFrameIdRef.current) {
            gameLoopRef.current = true;
            gameLoop();
          }
        }).catch(console.error);
      }
      return newPaused;
    });
  }, [gameLoop]);

  // Pause game when tab is unfocused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isPaused && gameStarted) {
        togglePause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused, gameStarted, togglePause]);

  const startGame = useCallback(() => {
    if (gameStarted) return;
    setGameStarted(true);
    if (containerRef.current) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (!isIOS) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          (containerRef.current as any).webkitRequestFullscreen();
        }
      } else {
        containerRef.current.style.position = 'fixed';
        containerRef.current.style.top = '0';
        containerRef.current.style.left = '0';
        containerRef.current.style.width = '100vw';
        containerRef.current.style.height = '100vh';
        containerRef.current.style.zIndex = '9999';
      }
    }
    setHealth(100);
    onGameStart?.();
    backgroundColorRef.current = currentLevel.initialBackground;
    waveColorRef.current = currentLevel.initialWaveColor;
    if (containerRef.current) {
      containerRef.current.style.background = currentLevel.initialBackground;
    }
    colorEventsRef.current.forEach((event, index) => { event.triggered = index === 0; });
    activeColorTransitionRef.current = {
      backgroundColor: "#1a1a2e",
      waveColor: "rgba(0,102,255,0.4)",
      progress: 1,
      targetBackgroundColor: "#1a1a2e",
      targetWaveColor: "rgba(0,102,255,0.4)",
      transitionDuration: 3
    };
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        gameLoopRef.current = true;
        requestAnimationFrame(gameLoop);
      }).catch((err) => {
        if (audioRef.current && (audioRef.current as ExtendedHTMLAudioElement)._audioCtx) {
          (audioRef.current as ExtendedHTMLAudioElement)._audioCtx?.resume().then(() => {
            return audioRef.current?.play();
          }).then(() => {
            gameLoopRef.current = true;
            requestAnimationFrame(gameLoop);
          }).catch(console.error);
        } else {
          console.error(err);
        }
      });
    }
  }, [gameStarted, currentLevel, gameLoop, onGameStart]);

  const selectLevel = useCallback((level: Level) => {
    if (!level.unlocked) return;
    gameStateRef.current = {
      player: {
        x: 100,
        y: window.innerHeight / 2,
        width: 50,
        height: 30,
        speed: 5,
        rotation: 0,
        spinRotation: 0,
        vy: 0,
        hitTime: undefined,
        hitType: undefined
      },
      trashList: [],
      obstacles: [],
      particles: [],
      score: 0,
      scorePopups: [],
      trashStats: { totalSpawned: 0, collected: 0, missed: 0 },
      streak: 0,
      multiplier: 1,
      highestStreak: 0,
    };
    caveRef.current = {
      upper: { points: [], amplitude: 0 },
      lower: { points: [], amplitude: 0 }
    };
    timedTextEventsRef.current = timedTextEventsRef.current.map(event => ({
      ...event,
      triggered: false
    }));
    colorEventsRef.current = colorEventsRef.current.map(event => ({
      ...event,
      triggered: event.timestamp === 0
    }));
    setCurrentLevel(level);
    backgroundColorRef.current = level.initialBackground;
    waveColorRef.current = level.initialWaveColor;
    if (containerRef.current) {
      containerRef.current.style.background = level.initialBackground;
    }
    if (audioRef.current) {
      audioRef.current.src = level.songFile;
      audioRef.current.currentTime = 0;
    }
    setLevelEnded(false);
    setHealth(100);
  }, []);

  // ─── UPDATED: Save high score and highest streak continuously ─
  useEffect(() => {
    setLevels(prev => {
      const newLevels = prev.map(level => {
        if (level.id === currentLevel.id) {
          const newHighScore = Math.max(level.highScore || 0, score);
          const newHighestStreak = Math.max(level.highestStreak || 0, gameStateRef.current.highestStreak);
          return { ...level, highScore: newHighScore, highestStreak: newHighestStreak };
        }
        return level;
      });
      localStorage.setItem('gameLevels', JSON.stringify(newLevels));
      const updatedCurrent = newLevels.find(l => l.id === currentLevel.id);
      if (updatedCurrent) {
        setCurrentLevel(updatedCurrent);
      }
      return newLevels;
    });
  }, [score, currentLevel.id]);

  const healthColor = (function (health: number) {
    const ratio = Math.max(0, Math.min(health / 100, 1));
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(255 * ratio);
    return `rgb(${r}, ${g}, 0)`;
  })(health);

  // ─── Portrait Fish Animation Functions ─
  const drawFishPortrait = (ctx: CanvasRenderingContext2D) => {
    if (!fishImageRef.current || !portraitCanvasRef.current) return;
    const time = Date.now() / 1000;
    const canvas = portraitCanvasRef.current;
    portraitFishPositionRef.current.x = canvas.width * 0.5;
    portraitFishPositionRef.current.y = canvas.height * 0.25 + Math.sin(time * 2) * 20;
    portraitFishPositionRef.current.rotation = Math.sin(time * 2) * 0.1;
    ctx.save();
    ctx.translate(portraitFishPositionRef.current.x, portraitFishPositionRef.current.y);
    ctx.rotate(portraitFishPositionRef.current.rotation);
    const fishWidth = 100;
    const fishHeight = (fishWidth / fishImageRef.current.width) * fishImageRef.current.height;
    ctx.drawImage(fishImageRef.current, -fishWidth / 2, -fishHeight / 2, fishWidth, fishHeight);
    ctx.restore();
    createPortraitParticles(portraitFishPositionRef.current.x - fishWidth / 2, portraitFishPositionRef.current.y);
  };

  const createPortraitParticles = (x: number, y: number) => {
    for (let i = 0; i < 2; i++) {
      portraitParticlesRef.current.push({
        x,
        y: y + (Math.random() - 0.5) * 10,
        vx: -2 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1.0,
        color: '#FFD700',
        size: 4 + Math.random() * 3,
        opacity: 0.8,
      });
    }
  };

  const updateAndDrawPortraitParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = portraitParticlesRef.current.length - 1; i >= 0; i--) {
      const p = portraitParticlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.opacity *= 0.97;
      if (p.life <= 0) {
        portraitParticlesRef.current.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      const opacityHex = Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = `${p.color}${opacityHex}`;
      ctx.fill();
    }
  };

  const animatePortrait = () => {
    if (!portraitCanvasRef.current) return;
    const canvas = portraitCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFishPortrait(ctx);
    updateAndDrawPortraitParticles(ctx);
    portraitAnimationFrameRef.current = requestAnimationFrame(animatePortrait);
  };

  // Orientation state effect with player position update
  useEffect(() => {
    const handleOrientationChange = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      // When switching to landscape, update the player's Y position to center vertically.
      if (landscape) {
        gameStateRef.current.player.y = window.innerHeight / 2;
      }
    };
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  const [pausedByOrientation, setPausedByOrientation] = useState(false);
  useEffect(() => {
    if (!isLandscape && gameStarted && !isPaused) {
      togglePause();
      setPausedByOrientation(true);
    }
  }, [isLandscape, gameStarted, isPaused, togglePause]);
  useEffect(() => {
    const font = new FontFace('Orbitron', 'url(/fonts/Orbitron/Orbitron-VariableFont_wght.ttf)');
    font.load().then(() => {
      document.fonts.add(font);
    });
  }, []);
  useEffect(() => {
    if (isLandscape && pausedByOrientation && gameStarted && isPaused) {
      togglePause();
      setPausedByOrientation(false);
    }
  }, [isLandscape, pausedByOrientation, gameStarted, isPaused, togglePause]);

  // ─── UPDATED RETURN ─
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '100vh', background: backgroundColorRef.current, fontFamily: 'Orbitron, sans-serif' }}>
      <>
        <canvas ref={starsCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '200px', pointerEvents: 'none', zIndex: 5 }} />
        <div style={{ position: 'fixed', left: 0, right: 0, height: '50px', display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 10, color: '#fff', justifyContent: 'space-between', fontFamily: 'Orbitron, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            {gameStarted && (
              <button onClick={togglePause} style={{ background: '#0066FF', border: 'none', color: '#fff', padding: '5px 15px', cursor: 'pointer', borderRadius: '4px' }}>
                {isPaused ? 'Play' : 'Pause'}
              </button>
            )}
            <div style={{ whiteSpace: 'nowrap' }}>High Score: {currentLevel.highScore || 0}</div>
            <div style={{ whiteSpace: 'nowrap' }}>Score: {score}</div>
            {gameStarted && (
              <a href="https://open.spotify.com/album/3nDX07NcGIyEeFtZIep9NB" target="_blank" rel="noopener noreferrer" style={{ background: '#1DB954', padding: '5px 10px', borderRadius: '4px', color: '#fff', textDecoration: 'none' }}>
                Spotify
              </a>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, width: '100%', paddingLeft: '20px' }}>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${audioProgress}%`, height: '100%', background: '#0066FF', transition: 'width 0.1s linear' }} />
            </div>
            <div style={{ fontSize: '14px' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
        <div style={{ position: 'fixed', top: '60px', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', zIndex: 10, fontFamily: 'Orbitron, sans-serif' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '10px 20px', borderRadius: '8px', transform: `scale(${Math.min(3, 0.5 + (gameStateRef.current.streak / 50))})`, transition: 'transform 0.1s ease-out', fontFamily: 'Orbitron, sans-serif' }}>
            <div style={{ color: getParticleColorFromStreak(gameStateRef.current.streak), fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,255,255,0.3)', transition: 'color 0.3s', fontFamily: 'Orbitron, sans-serif' }}>
              {gameStateRef.current.streak} STREAK
            </div>
            <div style={{ color: '#fff', fontSize: '18px', opacity: 0.8, fontFamily: 'Orbitron, sans-serif' }}>
              {gameStateRef.current.multiplier}x MULTIPLIER
            </div>
          </div>
        </div>
        {/* Landscape & Portrait Pre-Game UI */}
        {!gameStarted && (
          <>
            {isLandscape ? (
              <>
                <canvas
                  ref={landscapePreviewCanvasRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 2, display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '50dvh',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2rem',
                    textAlign: 'center',
                    fontFamily: 'Orbitron, sans-serif',
                  }}
                >
                  <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 'bold', color: '#000' }}>CVCHE</h1>
                  <nav
                    style={{
                      display: 'flex',
                      gap: '2rem',
                      fontSize: '1.2rem',
                      color: '#000',
                    }}
                  >
                    <a href="https://vyd.co/WelcomeToCvche" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#000' }}>Music</a>
                    <a href="https://www.instagram.com/cvche" style={{ textDecoration: 'underline', color: '#000' }}>Socials</a>
                    <span onClick={() => setShowAboutModal(true)} style={{ textDecoration: 'underline', cursor: 'pointer', color: '#000' }}>About</span>
                  </nav>
                  {!floraLoaded ? (
                    <div style={{ padding: '20px 60px', fontSize: '24px', color: '#000' }}>
                      Loading...
                    </div>
                  ) : (
                    <button
                      onClick={startGame}
                      style={{
                        border: 'none',
                        color: '#fff',
                        padding: '20px 60px',
                        fontSize: '24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s',
                        background: '#0066FF',
                      }}
                    >
                      Play Music
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', background: 'black', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                <canvas
                  ref={portraitCanvasRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
                <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 'bold', color: '#FDEE03', zIndex: 101 }}>CVCHE</h1>
                <div style={{ fontSize: '1.2rem', color: '#ED1D24', zIndex: 101, padding: '20px', textAlign: 'center' }}>
                  Please rotate your device to <strong>landscape</strong> to play this game.
                </div>
                <nav style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '1.2rem', zIndex: 101 }}>
                  <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                    <a href="https://vyd.co/WelcomeToCvche" target="_blank" rel="noopener noreferrer" style={{ color: '#FDEE03' }}>Music</a>
                    <a href="https://www.instagram.com/cvche" style={{ color: '#FDEE03' }}>Socials</a>
                    <button onClick={() => setShowAboutModal(true)} style={{ background: 'none', border: 'none', color: '#FDEE03', fontSize: 'inherit', cursor: 'pointer', padding: '0' }}>About</button>
                  </div>
                </nav>
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <audio
          id="audioControl"
          ref={audioRef}
          crossOrigin="anonymous"
          src="https://storage.googleapis.com/assets.urnowhere.com/publicmedia/cvche/welcomeToCVCHE.mp3"
          style={{ display: 'none' }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              const curTime = audioRef.current.currentTime;
              const dur = audioRef.current.duration;
              if (dur) {
                setAudioProgress((curTime / dur) * 100);
                setCurrentTime(curTime);
                setDuration(dur);
                if (dur - curTime < 0.1) {
                  setLevelEnded(true);
                  gameLoopRef.current = false;
                  if (animationFrameIdRef.current) {
                    cancelAnimationFrame(animationFrameIdRef.current);
                    animationFrameIdRef.current = null;
                  }
                }
              }
            }
          }}
        />
        {/* PAUSE SCREEN OVERLAY */}
        {isPaused && !levelEnded && isLandscape && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 35,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            fontFamily: 'Orbitron, sans-serif',
            color: '#fff'
          }}>
            <div style={{ fontSize: '48px' }}>Paused</div>
            <div style={{ fontSize: '24px' }}>High Score: {currentLevel.highScore || 0}</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              {pendingLevel && pendingLevel.id !== currentLevel.id ? (
                <button
                  onClick={() => {
                    selectLevel(pendingLevel);
                    setPendingLevel(null);
                    togglePause();
                  }}
                  style={{
                    padding: '10px 20px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    backgroundColor: '#0066FF',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                >
                  Play
                </button>
              ) : (
                <button
                  onClick={() => togglePause()}
                  style={{
                    padding: '10px 20px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    backgroundColor: '#0066FF',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                >
                  Resume
                </button>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '1rem',
              overflowX: 'auto',
              padding: '0 10px',
              width: '100%',
              justifyContent: 'space-evenly',

            }}>
              {levels.map((level) => {
                const isSelected = pendingLevel ? pendingLevel.id === level.id : currentLevel.id === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => setPendingLevel(level)}
                    disabled={!level.unlocked}
                    style={{
                      margin: '10px',
                      padding: '10px 20px',
                      minWidth: '180px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #fff' : 'none',
                      cursor: level.unlocked ? 'pointer' : 'not-allowed',
                      backgroundColor: isSelected ? '#0066FF' : 'rgba(0, 0, 0, 0.5)',
                      color: '#fff',
                      opacity: level.unlocked ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s, opacity 0.2s',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>LVL {level.id}</span>
                      <span style={{ fontSize: '14px' }}>{level.title}</span>
                    </div>
                    {!level.unlocked && (
                      <span style={{ fontSize: '12px' }}>🔒</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {isPaused && !levelEnded && !isLandscape && (
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', background: 'black', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <canvas
              ref={portraitCanvasRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
            <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 'bold', color: '#FDEE03', zIndex: 101 }}>CVCHE</h1>
            <div style={{ fontSize: '1.2rem', color: '#ED1D24', zIndex: 101, padding: '20px', textAlign: 'center' }}>
              Please rotate your device to <strong>landscape</strong> to resume this game.
            </div>
            <nav style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '1.2rem', zIndex: 101 }}>
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                <a href="https://vyd.co/WelcomeToCvche" target="_blank" rel="noopener noreferrer" style={{ color: '#FDEE03' }}>Music</a>
                <a href="https://www.instagram.com/cvche" style={{ color: '#FDEE03' }}>Socials</a>
                <button onClick={() => setShowAboutModal(true)} style={{ background: 'none', border: 'none', color: '#FDEE03', fontSize: 'inherit', cursor: 'pointer', padding: '0' }}>About</button>
              </div>
            </nav>
          </div>
        )}
        {levelEnded && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30, fontFamily: 'Orbitron, sans-serif' }}>
            <h1 style={{ marginTop: 0, fontSize: '48px', marginBottom: '20px' }}>{health <= 0 ? 'Game Over!' : 'Level Complete!'}</h1>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>Final Score: {score}</div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>Highest Streak: {gameStateRef.current.highestStreak}</div>
            <div style={{ fontSize: '24px', marginBottom: '20px' }}>
              Trash Collected: {gameStateRef.current.trashStats.collected} / {gameStateRef.current.trashStats.totalSpawned} (
              {gameStateRef.current.trashStats.totalSpawned > 0
                ? Math.round((gameStateRef.current.trashStats.collected / gameStateRef.current.trashStats.totalSpawned) * 100)
                : 0}%
              )
            </div>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => window.open('https://urnowhere.notion.site/19f92b5e7a6e80389c83fbc8d454c548', '_blank')}
                style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#0066FF', border: 'none', borderRadius: '4px', color: '#fff' }}
              >
                Sign Up for Updates
              </button>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button onClick={() => window.location.reload()} style={{ padding: '15px 30px', fontSize: '20px', cursor: 'pointer', backgroundColor: '#444', border: 'none', borderRadius: '8px', color: '#fff' }}>
                Play Again
              </button>
              {levels.find(l => l.id === currentLevel.id + 1) && (
                <button onClick={() => {
                  const nextLevel = levels.find(l => l.id === currentLevel.id + 1);
                  if (nextLevel && nextLevel.unlocked) {
                    selectLevel(nextLevel);
                    setLevelEnded(false);
                    setGameStarted(true);
                    if (audioRef.current) {
                      audioRef.current.play().then(() => {
                        gameLoopRef.current = true;
                        requestAnimationFrame(gameLoop);
                      }).catch(console.error);
                    }
                  }
                }} style={{ padding: '15px 30px', fontSize: '20px', cursor: 'pointer', backgroundColor: '#0066FF', border: 'none', borderRadius: '8px', color: '#fff' }}>
                  Next Level
                </button>
              )}
            </div>
          </div>
        )}
        {showAboutModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            // Stop touch events from bubbling to underlying game elements
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '80%',
                maxWidth: '500px',
                height: '80vh', // explicit height for scrolling
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderRadius: '1rem',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                padding: '2rem',
                color: 'white',
                textAlign: 'center',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'auto'
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#FDF200' }}>
                CVCHE - MEET THE TRAILBLAZERS OF RURAL CANADIAN TECHNO
              </h1>
              <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                We are very excited to begin to share with you the vast catalog of our upcoming LP, 'Get Fluffy'.
              </p>
              <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Over the next few months we'll be releasing more and more songs to please your ears until the album comes out in full. So put on ur socks, find a waxed floor to dance on and enjoy! Rural Canadian Techno 4evur!
              </p>
              <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                We live in a Tiny Sovereign Nation, on an island between two forks of a river.
              </p>
              <div style={{ marginBottom: '2rem' }}>
                <button
                  onClick={() =>
                    window.open(
                      'https://urnowhere.notion.site/19f92b5e7a6e80389c83fbc8d454c548',
                      '_blank'
                    )
                  }
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    backgroundColor: '#FDF200',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: 'black',
                    fontFamily: 'Orbitron, sans-serif',
                    marginBottom: '1rem'
                  }}
                >
                  Sign Up for Updates
                </button>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '1rem',
                  backgroundColor: 'transparent',
                  border: '2px solid white',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: 'white',
                  fontFamily: 'Orbitron, sans-serif'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Health Bar with Label */}
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10
        }}>
          <div style={{
            width: '200px',
            height: '20px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${health}%`,
              height: '100%',
              backgroundColor: healthColor,
              transition: 'width 0.3s ease-out'
            }} />
          </div>
          <span style={{
            color: 'white',
            fontSize: '16px',
            fontFamily: 'Orbitron, sans-serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            Health
          </span>
        </div>
      </>
    </div>
  );
};

export default MusicReactiveOceanGame;

import { useState, useRef, useEffect, useCallback } from 'react';
import { GameState, Level, LevelToggles, ActiveTimedText, ActiveColor, CaveState, Bubble, Flora, StreakDisplay, TimedTextEvent, TimedColorEvent, Level2TimedEvents, Particle } from '../types';
import { getDefaultLevels, createDefaultTimedTextEvents, createLevel2TimedTextEvents, createColorEvents, createLevel2TimedEvents, getInitialLevelToggles } from '../utils/eventData';
import { AssetLoader } from '../utils/assetLoader';

export const useGameState = () => {
  // Game progress
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [levelEnded, setLevelEnded] = useState(false);
  const [health, setHealth] = useState(100);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<Level | null>(null);
  const [pausedByOrientation, setPausedByOrientation] = useState(false);

  // Audio progress ref for use in callback functions
  const audioProgressRef = useRef(0);

  // Game levels
  const [levels, setLevels] = useState<Level[]>(() => {
    const savedLevels = localStorage.getItem('gameLevels');
    const defaultLevels = getDefaultLevels();
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

  // Current level state
  const [currentLevel, setCurrentLevel] = useState<Level>(levels[0]);
  const currentLevelRef = useRef(currentLevel);

  // Game state
  const gameStateRef = useRef<GameState>({
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
    pickups: [],
    obstacles: [],
    particles: [],
    score: 0,
    scorePopups: [],
    trashStats: { totalSpawned: 0, collected: 0, missed: 0 },
    streak: 0,
    multiplier: 1,
    highestStreak: 0,
    time: 0,
    paused: false,
    gameOver: false,
    gameStarted: false,
    gameEnded: false,
    gameItems: [],
    levelToggles: getInitialLevelToggles(),
    highScore: 0,
    level: levels[0],
    timedTextEvents: [],
    activeTimedText: { text: "", lifetime: 0 } as ActiveTimedText,
    timedColorEvents: [],
    activeColor: {
      backgroundColor: "#1a1a2e",
      waveColor: "rgba(0,102,255,0.4)",
      progress: 1,
      targetBackgroundColor: "#1a1a2e",
      targetWaveColor: "rgba(0,102,255,0.4)",
      transitionDuration: 3,
    },
    bubbles: [],
    flora: [],
    streakDisplay: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1
    }
  });

  // Audio refs
  const pickupSoundRef = useRef<HTMLAudioElement | null>(null);
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);

  // Animation and game loop refs
  const gameLoopRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const lastBeatTimeRef = useRef<number>(0);
  const lastCollisionTimeRef = useRef<number>(0);
  const lastProximityScoreTimeRef = useRef<number>(0);

  // Audio analyzer refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const amplitudeRef = useRef<number>(0);

  // Color references
  const backgroundColorRef = useRef("#FDF200");
  const waveColorRef = useRef("rgba(253,242,0,0.4)");

  // Dynamic game elements
  const levelTogglesRef = useRef<LevelToggles>(getInitialLevelToggles());
  const activeTimedTextsRef = useRef<ActiveTimedText[]>([]);
  const speedMultiplier = useRef<number>(1);
  const bubblesRef = useRef<Bubble[]>([]);
  const floraItemsRef = useRef<Flora[]>([]);
  const bgPatternBubblesRef = useRef<Bubble[]>([]);
  const streakDisplayRef = useRef<StreakDisplay>({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1
  });

  // Cave mechanics
  const caveRef = useRef<CaveState>({
    upper: { points: [], amplitude: 0 },
    lower: { points: [], amplitude: 0 }
  });

  // Event references
  const timedTextEventsRef = useRef<TimedTextEvent[]>(createDefaultTimedTextEvents());
  const colorEventsRef = useRef<TimedColorEvent[]>(createColorEvents());
  const level2TimedEventsRef = useRef<Level2TimedEvents>(createLevel2TimedEvents());
  const activeColorTransitionRef = useRef<ActiveColor>({
    backgroundColor: "#1a1a2e",
    waveColor: "rgba(0,102,255,0.4)",
    progress: 1,
    targetBackgroundColor: "#1a1a2e",
    targetWaveColor: "rgba(0,102,255,0.4)",
    transitionDuration: 3
  });

  // Portrait mode animation refs
  const portraitParticlesRef = useRef<Particle[]>([]);
  const portraitAnimationFrameRef = useRef<number | null>(null);
  const portraitFishPositionRef = useRef({ x: 0, y: 0, rotation: 0 });

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    audioProgressRef.current = audioProgress;
  }, [audioProgress]);

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

  useEffect(() => {
    const handleOrientationChange = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      if (landscape) {
        gameStateRef.current.player.y = window.innerHeight / 2;
      }
    };
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  useEffect(() => {
    if (!isLandscape && gameStarted && !isPaused) {
      togglePause();
      setPausedByOrientation(true);
    }
  }, [isLandscape, gameStarted, isPaused]);

  useEffect(() => {
    if (isLandscape && pausedByOrientation && gameStarted && isPaused) {
      togglePause();
      setPausedByOrientation(false);
    }
  }, [isLandscape, pausedByOrientation, gameStarted, isPaused]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const levelParam = params.get("level");
    if (levelParam === "2") {
      const level2 = levels.find(l => l.id === 2);
      if (level2) {
        (async () => {
          await selectLevel(level2);
        })();
      }
    }
  }, [levels]);
  

  useEffect(() => {
    const font = new FontFace('Orbitron', 'url(/fonts/Orbitron/Orbitron-VariableFont_wght.ttf)');
    font.load().then(() => {
      document.fonts.add(font);
    });
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const level2ObstacleImagesRef = useRef<HTMLImageElement[]>([]);
  const level2PickupImagesRef = useRef<HTMLImageElement[]>([]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const newPaused = !prev;
      gameStateRef.current.player.x = 100;
      if (newPaused) {
        gameLoopRef.current = false;
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      } else {
        gameLoopRef.current = true;
      }
      return newPaused;
    });
  }, []);

  const selectLevel = useCallback(async (level: Level) => {
    if (!level.unlocked) return;
    gameLoopRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    gameStateRef.current = {
      player: {
        x: (window.innerWidth / 2) - 25,
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
      pickups: [],
      obstacles: [],
      particles: [],
      score: 0,
      scorePopups: [],
      trashStats: { totalSpawned: 0, collected: 0, missed: 0 },
      streak: 0,
      multiplier: 1,
      highestStreak: 0,
      time: 0,
      paused: false,
      gameOver: false,
      gameStarted: gameStateRef.current.gameStarted,
      gameEnded: false,
      gameItems: [],
      levelToggles: getInitialLevelToggles(),
      highScore: level.highScore || 0,
      level: level,
      timedTextEvents: [],
      activeTimedText: { text: "", lifetime: 0, color: 'black' },
      timedColorEvents: [],
      activeColor: {
        backgroundColor: level.initialBackground || "#1a1a2e",
        waveColor: level.initialWaveColor || "rgba(0,102,255,0.4)",
        progress: 1,
        targetBackgroundColor: level.initialBackground || "#1a1a2e",
        targetWaveColor: level.initialWaveColor || "rgba(0,102,255,0.4)",
        transitionDuration: 3
      },
      bubbles: [],
      flora: [],
      streakDisplay: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1
      }
    };
    caveRef.current = {
      upper: { points: [], amplitude: 0 },
      lower: { points: [], amplitude: 0 }
    };
    activeTimedTextsRef.current = [];
    timedTextEventsRef.current = timedTextEventsRef.current.map(event => ({
      ...event,
      triggered: false
    }));
    colorEventsRef.current = colorEventsRef.current.map(event => ({
      ...event,
      triggered: event.timestamp === 0
    }));
    setCurrentLevel(level);
  
    if (level.id === 2) {
      if (containerRef.current) {
        containerRef.current.style.background = "transparent";
      }
      timedTextEventsRef.current = createLevel2TimedTextEvents();
      const loadLevel2Assets = async () => {
        if (gameStateRef.current.gameStarted) {
          setIsPaused(true);
        }
        const assetLoader = new AssetLoader();
        await assetLoader.loadLevel2Assets();
        level2ObstacleImagesRef.current = assetLoader.level2ObstacleImages;
        level2PickupImagesRef.current = assetLoader.level2PickupImages;
        setLevelEnded(false);
        setHealth(100);
        if (gameStateRef.current.gameStarted) {
          setIsPaused(false);
        }
      };
      // Await the level‑2 assets to ensure they’re fully loaded before continuing
      await loadLevel2Assets();
    } else {
      backgroundColorRef.current = level.initialBackground;
      waveColorRef.current = level.initialWaveColor;
      if (containerRef.current) {
        containerRef.current.style.background = level.initialBackground;
      }
      timedTextEventsRef.current = createDefaultTimedTextEvents();
      setLevelEnded(false);
      setHealth(100);
    }
  }, [levels, setIsPaused, setLevelEnded, setHealth]);
  

  return {
    score,
    setScore,
    gameStarted,
    setGameStarted,
    isPaused,
    setIsPaused,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    audioProgress,
    setAudioProgress,
    levelEnded,
    setLevelEnded,
    health,
    setHealth,
    isLandscape,
    showAboutModal,
    setShowAboutModal,
    pendingLevel,
    setPendingLevel,
    pausedByOrientation,
    setPausedByOrientation,
    levels,
    setLevels,
    currentLevel,
    setCurrentLevel,
    containerRef,
    gameStateRef,
    currentLevelRef,
    gameLoopRef,
    animationFrameIdRef,
    audioProgressRef,
    lastFrameTimeRef,
    lastBeatTimeRef,
    lastCollisionTimeRef,
    lastProximityScoreTimeRef,
    analyserRef,
    dataArrayRef,
    amplitudeRef,
    backgroundColorRef,
    waveColorRef,
    levelTogglesRef,
    activeTimedTextsRef,
    speedMultiplier,
    bubblesRef,
    floraItemsRef,
    bgPatternBubblesRef,
    streakDisplayRef,
    caveRef,
    timedTextEventsRef,
    colorEventsRef,
    level2TimedEventsRef,
    activeColorTransitionRef,
    portraitParticlesRef,
    portraitAnimationFrameRef,
    portraitFishPositionRef,
    pickupSoundRef,
    hitSoundRef,
    level2ObstacleImagesRef,
    level2PickupImagesRef,
    togglePause,
    selectLevel
  };
};
import { useState, useRef, useEffect, useCallback } from 'react';
import { GameState, Level, LevelToggles, ActiveTimedText, ActiveColor, CaveState, Bubble, Flora, StreakDisplay, TimedTextEvent, TimedColorEvent, Level2TimedEvents, Level3TimedEvents, Particle } from '../types';
import { getDefaultLevels, createDefaultTimedTextEvents, createLevel2TimedTextEvents, createLevel3TimedTextEvents, createColorEventsByLevel, createLevel2TimedEvents, createLevel3TimedEvents, getInitialLevelToggles } from '../utils/eventData';
import { AssetLoader } from '../utils/assetLoader';
import { gameConfig } from '../config/gameConfig';

// Add a reference to the restartGameLoop function
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

  // Loading state
  const [isLoadingAssets, setIsLoadingAssets] = useState(false); // Default to false instead of true
  const [loadingProgress, setLoadingProgress] = useState(0); // Percentage 0-100

  // Store the restartGameLoop function reference
  const restartGameLoopRef = useRef<(() => void) | null>(null);

  // Audio progress ref for use in callback functions
  const audioProgressRef = useRef(0);

  // Game levels
  const [levels, setLevels] = useState<Level[]>(() => {
    const savedLevels = localStorage.getItem('gameLevels');
    const defaultLevels = getDefaultLevels();
    
    // Apply level availability from config
    const filteredLevels = defaultLevels.filter((level) => {
      if (level.id === 1) return gameConfig.levels.level1;
      if (level.id === 2) return gameConfig.levels.level2;
      if (level.id === 3) return gameConfig.levels.level3;
      return true; // Allow any other levels
    });
    
    if (savedLevels) {
      try {
        const parsedLevels = JSON.parse(savedLevels);
        return filteredLevels.map(defaultLevel => {
          const savedLevel = parsedLevels.find((level: Level) => level.id === defaultLevel.id);
          if (savedLevel) {
            return {
              ...defaultLevel,
              highScore: Math.max(savedLevel.highScore || 0, defaultLevel.highScore || 0),
              highestStreak: Math.max(savedLevel.highestStreak || 0, defaultLevel.highestStreak || 0)
            };
          }
          return defaultLevel;
        });
      } catch (e) {
        console.error("Error parsing saved levels:", e);
        return filteredLevels;
      }
    }
    return filteredLevels;
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
  const colorEventsRef = useRef<TimedColorEvent[]>(createColorEventsByLevel(1)); // Default to level 1
  const level2TimedEventsRef = useRef<Level2TimedEvents>(createLevel2TimedEvents());
  const level3TimedEventsRef = useRef<Level3TimedEvents>(createLevel3TimedEvents());
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

  const containerRef = useRef<HTMLDivElement | null>(null);

  const level2ObstacleImagesRef = useRef<HTMLImageElement[]>([]);
  const level2PickupImagesRef = useRef<HTMLImageElement[]>([]);
  const level3ObstacleImagesRef = useRef<HTMLImageElement[]>([]);
  const level3MushroomImagesRef = useRef<HTMLImageElement[]>([]);
  const level3TrippyImagesRef = useRef<HTMLImageElement[]>([]);

  // --- Moved Callbacks --- 
  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const newPaused = !prev;
      if (newPaused) {
        gameLoopRef.current = false;
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      } else {
        gameLoopRef.current = true;
        // Call the restartGameLoop function from the parent component
      //  restartGameLoopRef.current?.(); // Ensure game loop restarts

      }
      return newPaused;
    });
  }, []);

  // Callback for asset loading progress
  const handleLoadingProgress = useCallback((loaded: number, total: number) => {
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    setLoadingProgress(percentage);
    // console.log(`Loading progress: ${percentage}% (${loaded}/${total})`); // Optional logging
  }, []);

  const selectLevel = useCallback(async (level: Level) => {
    if (!level.unlocked) return;

    setIsLoadingAssets(true); // Start loading
    setLoadingProgress(0);    // Reset progress

    try {
      gameLoopRef.current = false; // Stop game loop if running
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      // Reset core game state for the new level
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
    // Update color events for the selected level
    colorEventsRef.current = createColorEventsByLevel(level.id).map(event => ({
      ...event,
      triggered: event.timestamp === 0
    }));
    setCurrentLevel(level); // Update the current level state

    // --- Load Assets Based on Level ---
    const assetLoader = new AssetLoader(); // Instantiate loader

    if (level.id === 2) {
      if (containerRef.current) {
        containerRef.current.style.background = "transparent"; // Specific background handling
      }
      timedTextEventsRef.current = createLevel2TimedTextEvents(); // Set level-specific events
      await assetLoader.loadLevel2Assets(handleLoadingProgress); // Load assets with progress
      level2ObstacleImagesRef.current = assetLoader.level2ObstacleImages; // Update refs
      level2PickupImagesRef.current = assetLoader.level2PickupImages;
    } else if (level.id === 3) {
      if (containerRef.current) {
        containerRef.current.style.background = "transparent"; // Specific background handling
      }
      timedTextEventsRef.current = createLevel3TimedTextEvents(); // Set level-specific events
      await assetLoader.loadLevel3Assets(handleLoadingProgress); // Load assets with progress
      level3ObstacleImagesRef.current = assetLoader.level3ObstacleImages; // Update refs
      level3MushroomImagesRef.current = assetLoader.level3MushroomImages;
      level3TrippyImagesRef.current = assetLoader.level3TrippyImages;
    } else {
      // Handle Level 1 or other default levels
      await assetLoader.loadBasicAssets(handleLoadingProgress); // Load basic assets with progress
      backgroundColorRef.current = level.initialBackground;
      waveColorRef.current = level.initialWaveColor;
      if (containerRef.current) {
        containerRef.current.style.background = level.initialBackground;
      }
      timedTextEventsRef.current = createDefaultTimedTextEvents();
      // Optionally load basic assets here if needed, potentially with progress
      // await assetLoader.loadBasicAssets(handleLoadingProgress); // Example
    }

    // Reset common level state after assets are loaded
    setLevelEnded(false);
    setHealth(100);

    // If the game was already started (e.g., changing levels mid-game), restart the loop
    if (gameStateRef.current.gameStarted) {
      gameLoopRef.current = true;
      restartGameLoopRef.current?.();
    }

    } catch (error) {
      console.error("Error during level selection or asset loading:", error);
      // Handle error appropriately, maybe show an error message to the user
    } finally {
      setIsLoadingAssets(false); // Stop loading, regardless of success or error
    }
  }, [setLevelEnded, setHealth, handleLoadingProgress, setCurrentLevel]);

  // --- Effects --- 
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
        gameStateRef.current.player.y = window.innerHeight / 2;      }
    };
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  useEffect(() => {
    if (!isLandscape && gameStarted && !isPaused) {
      console.log("Pausing game due to orientation change");
      togglePause();
      setPausedByOrientation(true);
    }
  }, [isLandscape, gameStarted, isPaused, togglePause]); // Added togglePause

  useEffect(() => {
    // When returning to landscape, reset the flag indicating pause was due to orientation.
    // We no longer automatically resume here; user must manually unpause.
    if (isLandscape && pausedByOrientation) {
       console.log("Resetting pausedByOrientation flag.");
      setPausedByOrientation(false);
      // Note: We removed togglePause() and restartGameLoopRef.current?.()
    }
    // Keep dependencies that might influence the condition, but the action is simpler.
  }, [isLandscape, pausedByOrientation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const levelParam = params.get("level");
    console.log("Level param:", levelParam);
    if (levelParam === "2") {
      const level2 = levels.find(l => l.id === 2);
      if (level2) {
        (async () => {
          await selectLevel(level2);
          restartGameLoopRef.current?.(); // Ensure game loop restarts
        })();
      }
    } else if (levelParam === "3") {
      const level3 = levels.find(l => l.id === 3);
      if (level3) {
        (async () => {
          await selectLevel(level3);
          restartGameLoopRef.current?.(); // Ensure game loop restarts

        })();
      }
    }
  }, [levels, selectLevel]); // Added levels and selectLevel
  

  useEffect(() => {
    const font = new FontFace('Orbitron', 'url(/fonts/Orbitron/Orbitron-VariableFont_wght.ttf)');
    font.load().then(() => {
      document.fonts.add(font);
    });
  }, []);

  // --- Removed Callbacks (moved earlier) ---
  // const togglePause = useCallback(...);
  // const handleLoadingProgress = useCallback(...);
  // const selectLevel = useCallback(...);
  
  // Function to set the restart game loop reference
  const setRestartGameLoopRef = useCallback((fn: () => void) => {
    restartGameLoopRef.current = fn;
  }, []);

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
    level3TimedEventsRef,
    activeColorTransitionRef,
    portraitParticlesRef,
    portraitAnimationFrameRef,
    portraitFishPositionRef,
    pickupSoundRef,
    hitSoundRef,
    level2ObstacleImagesRef,
    level2PickupImagesRef,
    level3ObstacleImagesRef,
    level3MushroomImagesRef,
    level3TrippyImagesRef,
    togglePause,
    selectLevel,
    // Game loop integration
    setRestartGameLoopRef,
    // Add new state for loading
    isLoadingAssets,
    loadingProgress,
    setIsLoadingAssets,
    setLoadingProgress
  };
};

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useAudio } from '../hooks/useAudio';
import { useInputHandlers } from '../hooks/useInputHandler';
import { AssetLoader } from '../utils/assetLoader';
import { initializeFlora } from './Game/Flora';
import { gameLoop } from './Game/GameLoop';
import { drawPlayerPortrait } from './Game/Player';
import { createPortraitParticles, updateAndDrawParticles } from './Game/ParticleEffects';

// UI Components
import AboutModal from './GameUI/AboutModal';
import GameControls from './GameUI/GameControls';
import HealthBar from './GameUI/HealthBar';
import LevelCompleteScreen from './GameUI/LevelCompleteScreen';
import PauseScreen from './GameUI/PauseScreen';
import PortraitScreen from './GameUI/PortraitScreen';
import StreakDisplay from './GameUI/StreakDisplay';
import WelcomeScreen from './GameUI/WelcomeScreen';

import { GameProps } from '../types';

const MusicReactiveOceanGame: React.FC<GameProps> = ({ onGameStart }): React.ReactElement => {
  // Load game state from custom hook
  const gameState = useGameState();

  // Asset loading states
  const [floraLoaded, setFloraLoaded] = useState(false);
  const [level2AssetsLoaded, setLevel2AssetsLoaded] = useState(false);
  const [level3AssetsLoaded, setLevel3AssetsLoaded] = useState(false);

  // Canvas refs - using non-null assertion for canvasRef to fix type issues
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const starsCanvasRef = useRef<HTMLCanvasElement>(null);
  const portraitCanvasRef = useRef<HTMLCanvasElement>(null);

  // Asset loader
  const assetLoader = useRef<AssetLoader>(new AssetLoader());
  gameState.pickupSoundRef = useRef<HTMLAudioElement>(null!);
  gameState.hitSoundRef = useRef<HTMLAudioElement>(null!);

  // Asset refs
  const fishImageRef = useRef<HTMLImageElement>(null!);
  const waterBottleRef = useRef<HTMLImageElement>(null!);
  const plasticBagRef = useRef<HTMLImageElement>(null!);
  const oilSplatImageRef = useRef<HTMLImageElement>(null!);
  const fishHookRef = useRef<HTMLImageElement>(null!);
  const flipflopRef = useRef<HTMLImageElement>(null!);
  const toothbrushRef = useRef<HTMLImageElement>(null!);
  const hotdogRef = useRef<HTMLImageElement>(null!);
  const rubberDuckyRef = useRef<HTMLImageElement>(null!);

  // Set up audio hooks with a proper type for the audio element
  const {
    audioRef,
    getAverageAmplitude,
    detectBeat
  } = useAudio(
    gameState.gameStarted,
    gameState.isPaused,
    gameState.setAudioProgress,
    gameState.setCurrentTime,
    gameState.setDuration,
    gameState.setLevelEnded,
    gameState.gameLoopRef,
    gameState.animationFrameIdRef,
    gameState.analyserRef,
    gameState.dataArrayRef,
    gameState.lastBeatTimeRef,
    gameState.currentLevel.id // <-- pass the current level id here

  );

  // Create non-null audio ref for the game loop
  const audioRefNonNull = useRef<HTMLAudioElement>(null!);

  // Keep audioRefNonNull.current in sync with audioRef.current
  useEffect(() => {
    if (audioRef.current) {
      audioRefNonNull.current = audioRef.current;
    }
  }, [audioRef.current]);

  useEffect(() => {
    if (!gameState.gameStarted) return;
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Set the new audio source based on the current level
    if (audioRef.current) {
      audioRef.current.src = gameState.currentLevel.songFile;
      audioRef.current.load(); // NEW: Ensure the new source is loaded
      // Reset audio-related state
      gameState.setAudioProgress(0);
      gameState.setCurrentTime(0);
      gameState.setDuration(0);
      // If not paused, start playing the new level's audio
      if (!gameState.isPaused) {
        console.log("Starting new audio, currentLevel:", gameState.currentLevel, audioRef.current.src);
        audioRef.current.play().catch(console.error);
      }
    }
  }, [gameState.currentLevel.id, gameState.gameStarted]);
  const { inputRef } = useInputHandlers(canvasRef);

  // Define the restartGameLoop function first so we can register it with useGameState
  const restartGameLoop = useCallback(() => {
    gameState.gameLoopRef.current = true;
    gameState.animationFrameIdRef.current = requestAnimationFrame(() =>
      gameLoop(
        canvasRef,
        gameState.gameStateRef,
        gameState.lastFrameTimeRef,
        gameState.gameLoopRef,
        gameState.animationFrameIdRef,
        audioRefNonNull,
        gameState.audioProgressRef,
        getAverageAmplitude,
        detectBeat,
        gameState.lastBeatTimeRef,
        inputRef,
        gameState.backgroundColorRef,
        gameState.waveColorRef,
        gameState.activeColorTransitionRef,
        gameState.bgPatternBubblesRef,
        gameState.levelTogglesRef,
        gameState.bubblesRef,
        gameState.amplitudeRef,
        gameState.activeTimedTextsRef,
        gameState.floraItemsRef,
        gameState.streakDisplayRef,
        fishImageRef,
        waterBottleRef,
        plasticBagRef,
        oilSplatImageRef,
        fishHookRef,
        flipflopRef,
        toothbrushRef,
        hotdogRef,
        rubberDuckyRef,
        gameState.level2ObstacleImagesRef,
        gameState.level2PickupImagesRef,
        gameState.level3ObstacleImagesRef,
        gameState.level3MushroomImagesRef,
        gameState.level3TrippyImagesRef,
        gameState.currentLevelRef,
        gameState.timedTextEventsRef,
        gameState.colorEventsRef,
        gameState.level2TimedEventsRef,
        gameState.level3TimedEventsRef,
        gameState.caveRef,
        gameState.speedMultiplier,
        gameState.setScore,
        gameState.setHealth,
        gameState.setLevelEnded,
        gameState.lastCollisionTimeRef,
        gameState.lastProximityScoreTimeRef,
        gameState.pickupSoundRef as React.RefObject<HTMLAudioElement>,
        gameState.hitSoundRef as React.RefObject<HTMLAudioElement>
      )
    );
  }, [
    canvasRef,
    gameState,
    audioRefNonNull,
    getAverageAmplitude,
    detectBeat,
    inputRef,
    gameState.setScore,
    gameState.setHealth,
    gameState.setLevelEnded
  ]);

  // Register the restartGameLoop function with useGameState
  useEffect(() => {
    if (gameState.setRestartGameLoopRef) {
      gameState.setRestartGameLoopRef(restartGameLoop);
    }
  }, [restartGameLoop, gameState.setRestartGameLoopRef]);

  // Load basic assets on component mount
  useEffect(() => {
    const loader = assetLoader.current;
    const loadAssets = async () => {
      await loader.loadBasicAssets();
      // Update refs with loaded assets
      if (loader.fishImage) {
        fishImageRef.current = loader.fishImage;
      }
      if (loader.waterBottleImage) {
        waterBottleRef.current = loader.waterBottleImage;
        window.waterBottleRef = waterBottleRef;
      }
      if (loader.plasticBagImage) {
        plasticBagRef.current = loader.plasticBagImage;
        window.plasticBagRef = plasticBagRef;
      }
      if (loader.oilSplatImage) {
        oilSplatImageRef.current = loader.oilSplatImage;
      }
      if (loader.fishHookImage) {
        fishHookRef.current = loader.fishHookImage;
      }
      if (loader.flipflopImage) {
        flipflopRef.current = loader.flipflopImage;
      }
      if (loader.toothbrushImage) {
        toothbrushRef.current = loader.toothbrushImage;
      }
      if (loader.hotdogImage) {
        hotdogRef.current = loader.hotdogImage;
      }
      if (loader.rubberDuckyImage) {
        rubberDuckyRef.current = loader.rubberDuckyImage;
      }
      gameState.pickupSoundRef.current = loader.pickupSound;
      gameState.hitSoundRef.current = loader.hitSound;
      // Load flora assets
      await loader.loadFloraAssets();
      // Initialize flora once loaded
      if (canvasRef.current) {
        gameState.floraItemsRef.current = initializeFlora(canvasRef.current, loader.floraImages);
      }
      setFloraLoaded(true);
    };
    loadAssets();
  }, []);

  // Load level 2 assets when needed
  useEffect(() => {
    if (gameState.currentLevel.id === 2 && !level2AssetsLoaded) {
      const loadLevel2 = async () => {
        await assetLoader.current.loadLevel2Assets();
        // Update level 2 asset refs
        gameState.level2ObstacleImagesRef.current = assetLoader.current.level2ObstacleImages;
        gameState.level2PickupImagesRef.current = assetLoader.current.level2PickupImages;
        setLevel2AssetsLoaded(true);
      };
      loadLevel2();
    }
  }, [gameState.currentLevel.id, level2AssetsLoaded]);

  // Load level 3 assets when needed
  useEffect(() => {
    if (gameState.currentLevel.id === 3 && !level3AssetsLoaded) {
      const loadLevel3 = async () => {
        await assetLoader.current.loadLevel3Assets();
        // Update level 3 asset refs
        gameState.level3ObstacleImagesRef.current = assetLoader.current.level3ObstacleImages;
        gameState.level3MushroomImagesRef.current = assetLoader.current.level3MushroomImages;
        gameState.level3TrippyImagesRef.current = assetLoader.current.level3TrippyImages;
        setLevel3AssetsLoaded(true);
        console.log('Level 3 assets loaded:', {
          obstacles: gameState.level3ObstacleImagesRef.current.length,
          mushrooms: gameState.level3MushroomImagesRef.current.length,
          trippyImages: gameState.level3TrippyImagesRef.current.length
        });
      };
      loadLevel3();
    }
  }, [gameState.currentLevel.id, level3AssetsLoaded]);

  // Reset canvas on resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Portrait animation function
  const animatePortrait = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //fill color black
    ctx.fillStyle = 'black';
    // Set background color
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw fish character
    const fishPosition = drawPlayerPortrait(ctx, fishImageRef.current, gameState.portraitFishPositionRef.current);
    if (fishPosition) {
      // Create particles
      createPortraitParticles(gameState.portraitParticlesRef.current, fishPosition.x, fishPosition.y);
    }
    // Update and draw particles
    updateAndDrawParticles(ctx, gameState.portraitParticlesRef.current, 1);
  }, [gameState.portraitFishPositionRef, gameState.portraitParticlesRef, gameState.currentLevel.initialBackground]);

  // startGame callback (unchanged)
  const startGame = useCallback(() => {
    if (gameState.gameStarted) return;
    // Center the player horizontally before starting
    gameState.gameStateRef.current.player.y = window.innerHeight / 2;
    gameState.gameStateRef.current.player.x = 100;
    gameState.setGameStarted(true);
    gameState.setHealth(100);
    onGameStart?.();
    // Set up container background based on level
    if (gameState.currentLevel.id === 2 && gameState.containerRef.current) {
      gameState.containerRef.current.style.background = "transparent";
      // Make sure level 2 assets are loaded before starting
      if (gameState.level2ObstacleImagesRef.current.length === 0 ||
        gameState.level2PickupImagesRef.current.length === 0) {
        const loadLevel2 = async () => {
          await assetLoader.current.loadLevel2Assets();
          // Update level 2 asset refs
          gameState.level2ObstacleImagesRef.current = assetLoader.current.level2ObstacleImages;
          gameState.level2PickupImagesRef.current = assetLoader.current.level2PickupImages;
          startAudioAndGameLoop();
        };
        loadLevel2();
      } else {
        startAudioAndGameLoop();
      }
    } else if (gameState.currentLevel.id === 3 && gameState.containerRef.current) {
      // Make sure level 3 assets are loaded before starting
      if (gameState.level3ObstacleImagesRef.current.length === 0 ||
        gameState.level3MushroomImagesRef.current.length === 0 ||
        gameState.level3TrippyImagesRef.current.length === 0) {
        const loadLevel3 = async () => {
          await assetLoader.current.loadLevel3Assets();
          // Update level 3 asset refs
          gameState.level3ObstacleImagesRef.current = assetLoader.current.level3ObstacleImages;
          gameState.level3MushroomImagesRef.current = assetLoader.current.level3MushroomImages;
          gameState.level3TrippyImagesRef.current = assetLoader.current.level3TrippyImages;
          console.log('Level 3 assets loaded in startGame:', {
            obstacles: gameState.level3ObstacleImagesRef.current.length,
            mushrooms: gameState.level3MushroomImagesRef.current.length,
            trippyImages: gameState.level3TrippyImagesRef.current.length
          });
          startAudioAndGameLoop();
        };
        loadLevel3();
      } else {
        startAudioAndGameLoop();
      }
    } else {
      gameState.backgroundColorRef.current = gameState.currentLevel.initialBackground;
      gameState.waveColorRef.current = gameState.currentLevel.initialWaveColor;
      if (gameState.containerRef.current) {
        gameState.containerRef.current.style.background = gameState.currentLevel.initialBackground;
      }
      startAudioAndGameLoop();
    }
    
    function startAudioAndGameLoop() {
      // Reset color events
      gameState.colorEventsRef.current.forEach((event, index) => {
        event.triggered = index === 0;
      });
      // Reset color transition
      gameState.activeColorTransitionRef.current = {
        backgroundColor: "#1a1a2e",
        waveColor: "rgba(0,102,255,0.4)",
        progress: 1,
        targetBackgroundColor: "#1a1a2e",
        targetWaveColor: "rgba(0,102,255,0.4)",
        transitionDuration: 3
      };
      // Start audio and game loop with proper error handling
      if (audioRef.current) {
        // Reset any previous state
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        // Check if the browser can play the audio type
        const canPlayType = audioRef.current.canPlayType(
          gameState.currentLevel.songFile.endsWith('.mp3') ? 'audio/mpeg' :
            gameState.currentLevel.songFile.endsWith('.wav') ? 'audio/wav' :
              gameState.currentLevel.songFile.endsWith('.ogg') ? 'audio/ogg' : ''
        );
        if (canPlayType === '') {
          console.warn(`Browser might not support the audio format: ${gameState.currentLevel.songFile}`);
        }
        // Ensure audio is properly loaded before playing
        audioRef.current.load();
        // Create a flag to prevent multiple initializations
        let initialized = false;
        // Handle canplaythrough event
        const handleCanPlay = () => {
          if (initialized || !audioRef.current) return;
          initialized = true;
          audioRef.current.currentTime = 0;
          // Start the game loop even if audio fails
          startGameLoop();
          // Try to play audio, but don't block the game if it fails
          audioRef.current.play().catch(error => {
            console.log("Audio play error:", error.message);
          });
        };
        
        // Set up the event listener
        audioRef.current.addEventListener('canplaythrough', handleCanPlay, { once: true });
        // Start game loop function to avoid code duplication
        const startGameLoop = () => {
          gameState.gameLoopRef.current = true;
          gameState.animationFrameIdRef.current = requestAnimationFrame(() =>
            gameLoop(
              canvasRef,
              gameState.gameStateRef,
              gameState.lastFrameTimeRef,
              gameState.gameLoopRef,
              gameState.animationFrameIdRef,
              audioRefNonNull,
              gameState.audioProgressRef,
              getAverageAmplitude,
              detectBeat,
              gameState.lastBeatTimeRef,
              inputRef,
              gameState.backgroundColorRef,
              gameState.waveColorRef,
              gameState.activeColorTransitionRef,
              gameState.bgPatternBubblesRef,
              gameState.levelTogglesRef,
              gameState.bubblesRef,
              gameState.amplitudeRef,
              gameState.activeTimedTextsRef,
              gameState.floraItemsRef,
              gameState.streakDisplayRef,
              fishImageRef,
              waterBottleRef,
              plasticBagRef,
              oilSplatImageRef,
              fishHookRef,
              flipflopRef,
              toothbrushRef,
              hotdogRef,
              rubberDuckyRef,
              gameState.level2ObstacleImagesRef,
              gameState.level2PickupImagesRef,
              gameState.level3ObstacleImagesRef,
              gameState.level3MushroomImagesRef,
              gameState.level3TrippyImagesRef,
              gameState.currentLevelRef,
              gameState.timedTextEventsRef,
              gameState.colorEventsRef,
              gameState.level2TimedEventsRef,
              gameState.level3TimedEventsRef,
              gameState.caveRef,
              gameState.speedMultiplier,
              gameState.setScore,
              gameState.setHealth,
              gameState.setLevelEnded,
              gameState.lastCollisionTimeRef,
              gameState.lastProximityScoreTimeRef,
              gameState.pickupSoundRef as React.RefObject<HTMLAudioElement>,
              gameState.hitSoundRef as React.RefObject<HTMLAudioElement>
            )
          );
        };
        // Fallback in case oncanplaythrough doesn't fire
        const timeoutId = setTimeout(() => {
          if (!initialized && audioRef.current) {
            console.log("Starting game loop via timeout fallback");
            audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
            handleCanPlay();
          }
        }, 3000);
        // Cleanup function to prevent memory leaks
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
          }
          clearTimeout(timeoutId);
        };
      }
    }
  }, [
    gameState,
    onGameStart,
    getAverageAmplitude,
    detectBeat,
    inputRef,
    audioRef
  ]);

  return (
    <div
      ref={gameState.containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: gameState.backgroundColorRef.current,
        fontFamily: 'Orbitron, sans-serif'
      }}
    >
      {gameState.currentLevel.id === 2 && (
        <video autoPlay loop muted style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1
        }}>
          <source src="/videos/level2background-compressed.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      <canvas
        ref={starsCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '200px',
          pointerEvents: 'none',
          zIndex: 5
        }}
      />

      <GameControls
        gameStarted={gameState.gameStarted}
        isPaused={gameState.isPaused}
        togglePause={gameState.togglePause}
        currentLevel={gameState.currentLevel}
        score={gameState.score}
        audioProgress={gameState.audioProgress}
        currentTime={gameState.currentTime}
        duration={gameState.duration}
      />

      {gameState.gameStarted && <HealthBar health={gameState.health} />}

      {gameState.gameStarted && (
        <StreakDisplay
          streak={gameState.gameStateRef.current.streak}
          multiplier={gameState.gameStateRef.current.multiplier}
          scale={gameState.streakDisplayRef.current.scale}
        />
      )}

      <WelcomeScreen
        gameStarted={gameState.gameStarted}
        isLandscape={gameState.isLandscape}
        floraLoaded={floraLoaded}
        startGame={startGame}
        setShowAboutModal={gameState.setShowAboutModal}
      />

      <PortraitScreen
        isPortrait={!gameState.isLandscape}
        gameStarted={gameState.gameStarted}
        isPaused={gameState.isPaused}
        setShowAboutModal={gameState.setShowAboutModal}
        animatePortrait={animatePortrait}
      />

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      <audio
        id="audioControl"
        ref={audioRef}
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      >
        <source src={gameState.currentLevel.songFile} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <PauseScreen
        isPaused={gameState.isPaused}
        levelEnded={gameState.levelEnded}
        isLandscape={gameState.isLandscape}
        currentLevel={gameState.currentLevel}
        pendingLevel={gameState.pendingLevel}
        levels={gameState.levels}
        togglePause={gameState.togglePause}
        setPendingLevel={gameState.setPendingLevel}
        selectLevel={gameState.selectLevel}
        restartGameLoop={restartGameLoop}
      />

      <LevelCompleteScreen
        levelEnded={gameState.levelEnded}
        health={gameState.health}
        score={gameState.score}
        gameState={gameState.gameStateRef.current}
        levels={gameState.levels}
        currentLevel={gameState.currentLevel}
        selectLevel={gameState.selectLevel}
        setLevelEnded={gameState.setLevelEnded}
        setGameStarted={gameState.setGameStarted}
        restartGameLoop={restartGameLoop}
      />

      <AboutModal
        showAboutModal={gameState.showAboutModal}
        setShowAboutModal={gameState.setShowAboutModal}
      />
    </div>
  );
};

export default MusicReactiveOceanGame;

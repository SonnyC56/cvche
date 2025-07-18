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

import { GameProps, ExtendedHTMLAudioElement } from '../types';

// Remove local loading states
const MusicReactiveOceanGame: React.FC<GameProps> = ({ onGameStart }): React.ReactElement => {
  // Load game state from custom hook
  const gameState = useGameState();

  // Remove local loading states: floraLoaded, level2AssetsLoaded, level2VideoLoaded, level3AssetsLoaded, isLoading
  const [floraLoaded, setFloraLoaded] = useState(false); // Keep floraLoaded for WelcomeScreen for now

  // Canvas refs - using non-null assertion for canvasRef to fix type issues
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const starsCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // Reference to the level 2 video element

  // Asset loader
  const assetLoader = useRef<AssetLoader>(new AssetLoader());
  const hasInitiatedInitialAssetLoad = useRef(false); // Prevents double loading in StrictMode
  // Make assetLoader available globally for animated GIFs
  window.assetLoaderRef = assetLoader;
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
    detectBeat,
    isMainSongBuffered,
    isAudioContextReady,
    needsUserInteraction,
    fallbackAudioRef,
    usingFallbackAudio
  } = useAudio(
    gameState.gameStarted,
    gameState.isPaused,
    gameState.isLoadingAssets,
    gameState.setAudioProgress,
    gameState.setCurrentTime,
    gameState.setDuration,
    gameState.setLevelEnded,
    gameState.gameLoopRef,
    gameState.animationFrameIdRef,
    gameState.analyserRef,
    gameState.dataArrayRef,
    gameState.lastBeatTimeRef,
    gameState.currentLevel.id, // <-- pass the current level id here
  );

  // Create non-null audio ref for the game loop
  const audioRefNonNull = useRef<HTMLAudioElement>(null!);

  // Keep audioRefNonNull.current in sync with audioRef.current
  useEffect(() => {
    if (audioRef.current) {
      audioRefNonNull.current = audioRef.current;
    }
  }, [audioRef]); // Use audioRef directly

  // Effect to handle audio source changes when level or game starts
  useEffect(() => {
    // This effect should only run when the game starts or the level changes,
    // not when the pause state changes. The useAudio hook handles pause/resume.
    if (!gameState.gameStarted) return;

    console.log('Setting up audio for level:', gameState.currentLevel.id);

    if (audioRef.current) {
      // Pause and reset audio only when the level changes, not on pause/play toggle
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // Set the new audio source based on the current level
      audioRef.current.src = gameState.currentLevel.songFile;
      audioRef.current.load(); // Ensure the new source is loaded
      
      // Also set up fallback audio for iOS mute switch workaround
      if (fallbackAudioRef && fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current.currentTime = 0;
        fallbackAudioRef.current.src = gameState.currentLevel.songFile;
        fallbackAudioRef.current.load();
      }

      // Reset audio-related state
      gameState.setAudioProgress(0);
      gameState.setCurrentTime(0);
      gameState.setDuration(0);

      // The useAudio hook will handle playing the audio when isPaused is false
      // and isLoadingAssets is false.
    }
  }, [gameState.currentLevel.id, gameState.gameStarted, gameState.setAudioProgress, gameState.setCurrentTime, gameState.setDuration, audioRef, gameState.currentLevel.songFile]);

  const { inputRef } = useInputHandlers(canvasRef);

  // Define the restartGameLoop function first so we can register it with useGameState
  const restartGameLoop = useCallback(() => {
    gameState.gameLoopRef.current = true;
    gameState.gameStateRef.current.player.x = 100;

    // Cancel any existing animation frame
    if (gameState.animationFrameIdRef.current) {
      cancelAnimationFrame(gameState.animationFrameIdRef.current);
    }

    // Restart the game loop
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
  ]);

  // Register the restartGameLoop function with useGameState
  useEffect(() => {
    if (gameState.setRestartGameLoopRef) {
      gameState.setRestartGameLoopRef(restartGameLoop);
    }
  }, [restartGameLoop, gameState.setRestartGameLoopRef, gameState]); // Added gameState

  // Load basic assets on component mount
  useEffect(() => {
    // Prevent re-running asset loading logic due to React StrictMode's double invocation in development
    if (hasInitiatedInitialAssetLoad.current) {
      return;
    }
    hasInitiatedInitialAssetLoad.current = true;

    const loader = assetLoader.current;
    const loadAssets = async () => {
      try {
        console.log('Starting to load initial assets...');
        // Start the loading process for basic assets
        gameState.setIsLoadingAssets(true);
        gameState.setLoadingProgress(0);
        
        console.log('Loading basic assets...');
        // Load basic game assets with progress tracking
        await loader.loadBasicAssets((loaded, total) => {
          const basicProgress = Math.round((loaded / total) * 50); // Basic assets are 50% of initial loading
          console.log(`Basic assets progress: ${basicProgress}% (${loaded}/${total})`);
          gameState.setLoadingProgress(basicProgress);
        });
        
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
        
        console.log('Loading flora assets...');
        // Load flora assets with progress tracking
        await loader.loadFloraAssets((loaded, total) => {
          // Flora assets are another 50% of initial loading (50-100%)
          const floraProgress = 50 + Math.round((loaded / total) * 50);
          console.log(`Flora progress: ${floraProgress}% (${loaded}/${total})`);
          gameState.setLoadingProgress(floraProgress);
        });
        
        // Initialize flora once loaded
        if (canvasRef.current) {
          gameState.floraItemsRef.current = initializeFlora(canvasRef.current, loader.floraImages);
        }
        
        // Complete loading
        console.log('All initial assets loaded successfully!');
        gameState.setLoadingProgress(100);
        setTimeout(() => {
          setFloraLoaded(true);
          gameState.setIsLoadingAssets(false); // will be handled by a new useEffect based on all loading conditions
          // For now, asset loading part is done.
          console.log('Initial asset loading part complete. Waiting for audio buffering if game starts.');
        }, 500); // Small delay to ensure UI updates properly
      } catch (error) {
        console.error('Error loading initial assets:', error);
        // Force loading to complete even on error
        setFloraLoaded(true);
        gameState.setIsLoadingAssets(false);
      }
    };
    
    // Call the asset loading function. The guard at the top of useEffect ensures it's only called once.
    loadAssets();
  }, []); // Run only once on mount, regardless of state changes

  // Remove useEffect hooks for loading level 2 and level 3 assets
  // Remove useEffect hook for detecting level 2 video load
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: number | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      func(...args);
    }, delay);
  };
};

  // Effect to handle canvas resizing
  useEffect(() => {
    const handleResize = () => {
      // Ensure canvasRef.current exists before accessing properties
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        // Optionally, re-initialize flora or other size-dependent elements here if needed
        // Example: gameState.floraItemsRef.current = initializeFlora(canvasRef.current, assetLoader.current.floraImages);
      }
    };

    // Debounce the resize handler
    const debouncedHandleResize = debounce(handleResize, 200); // 200ms delay

    // Set initial size
    handleResize(); // Still call immediately on mount

    // Add resize event listener
    window.addEventListener('resize', debouncedHandleResize);

    // Cleanup function to remove event listener
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, []); // Empty dependency array ensures this runs only once on mount

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
  }, [gameState.portraitFishPositionRef, gameState.portraitParticlesRef]); // Removed gameState.currentLevel.initialBackground dependency

  // startGame callback - Simplified: Asset loading is handled by selectLevel
  const startGame = useCallback(() => {
    if (gameState.gameStarted) return;
    
    // Don't start game if assets are still loading OR main song isn't buffered OR audio context isn't ready
    // Note: isMainSongBuffered and isAudioContextReady are relevant once gameStarted is true and audioRef has a src.
    // At the initial startGame call from WelcomeScreen, these audio states might not yet be relevant
    // if the audio source hasn't been set or processed by useAudio yet.
    // The critical check is before audioRef.current.play()
    if (gameState.isLoadingAssets) {
      console.log("[Game] Cannot start game (assets still loading)");
      return;
    }
    // Defer audio-specific checks to startAudioAndGameLoop, as audioRef might not be set up yet.

    console.log("[Game] startGame called. Initializing game state.");
    // Center the player horizontally before starting
    gameState.gameStateRef.current.player.y = window.innerHeight / 2;
    gameState.gameStateRef.current.player.x = 100;
    gameState.setGameStarted(true);
    gameState.setHealth(100);
    onGameStart?.();

    // Set up container background based on level (already handled in selectLevel, but good to ensure)
    if (gameState.currentLevel.id === 2 && gameState.containerRef.current) {
      gameState.containerRef.current.style.background = "transparent";
    } else if (gameState.currentLevel.id === 3 && gameState.containerRef.current) {
      gameState.containerRef.current.style.background = "transparent"; // Assuming level 3 also has a video or special bg
    } else if (gameState.containerRef.current) {
      gameState.containerRef.current.style.background = gameState.currentLevel.initialBackground;
    }

    // Start audio and game loop
    startAudioAndGameLoop();
    
    async function startAudioAndGameLoop() {
      // Reset color events
      gameState.colorEventsRef.current.forEach((event, index) => {
        event.triggered = index === 0;
      });
      // Reset color transition
      gameState.activeColorTransitionRef.current = {
        backgroundColor: gameState.currentLevel.initialBackground || "#1a1a2e",
        waveColor: gameState.currentLevel.initialWaveColor || "rgba(0,102,255,0.4)",
        progress: 1,
        targetBackgroundColor: gameState.currentLevel.initialBackground || "#1a1a2e",
        targetWaveColor: gameState.currentLevel.initialWaveColor || "rgba(0,102,255,0.4)",
        transitionDuration: 3
      };
      // Start audio and game loop with proper error handling
      if (audioRef.current) {
        const audioEl = audioRef.current as ExtendedHTMLAudioElement;
        
        // Attempt to resume AudioContext on user interaction (important for iOS)
        // This is also handled in useAudio, but can be an early attempt here.
        if (audioEl._audioCtx && audioEl._audioCtx.state !== 'running') {
          try {
            await audioEl._audioCtx.resume();
            console.log("[Game] AudioContext resumed successfully on startGame.");
          } catch (error) {
            console.error("[Game] Error resuming AudioContext on startGame:", error);
          }
        }

        // Reset any previous state (src will be set by the useEffect hook for level changes)
        // audioRef.current.pause(); // useAudio handles pause based on its state
        // audioRef.current.currentTime = 0; // Reset by src change or level change logic

        // Check if the browser can play the audio type
        const canPlayType = audioRef.current.canPlayType(
          gameState.currentLevel.songFile.endsWith('.mp3') ? 'audio/mpeg' :
            gameState.currentLevel.songFile.endsWith('.wav') ? 'audio/wav' :
              gameState.currentLevel.songFile.endsWith('.ogg') ? 'audio/ogg' : ''
        );
        if (canPlayType === '') {
          console.warn(`[Game] Browser might not support the audio format: ${gameState.currentLevel.songFile}`);
        }
        
        // audioRef.current.load() is called in the useEffect that sets the src.
        // The useAudio hook now waits for isMainSongBuffered and isAudioContextReady before playing.
        
        console.log("[Game] Starting game loop. Audio playback will be handled by useAudio hook based on its readiness states.");
        
        // Start the game loop
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
        
        // No cleanup function needed since we're not adding event listeners
      }
    }
  }, [
    gameState,
    onGameStart,
    getAverageAmplitude,
    detectBeat,
    inputRef,
    audioRef,
    canvasRef, // Added canvasRef
    audioRefNonNull // Added audioRefNonNull
  ]);

  // Derived state for overall loading status
  const isActuallyLoading = gameState.gameStarted ?
    (gameState.isLoadingAssets || !isMainSongBuffered || !isAudioContextReady) :
    gameState.isLoadingAssets;

  // Effect to manage the global isLoadingAssets based on all conditions
  useEffect(() => {
    if (gameState.gameStarted) {
      // If game has started, all conditions must be met to stop loading
      if (!gameState.isLoadingAssets && isMainSongBuffered && isAudioContextReady) {
        // This condition means assets are loaded AND audio is ready
        // However, setIsLoadingAssets(false) should be driven by asset loading itself.
        // The UI display of loading will use `isActuallyLoading`.
      } else if (gameState.isLoadingAssets || !isMainSongBuffered || !isAudioContextReady) {
        // If any of these are true, we are effectively still loading from user's perspective.
        // No need to set setIsLoadingAssets(true) here as it's for assets.
      }
    } else {
      // If game hasn't started, only asset loading matters for setIsLoadingAssets
      // This is handled by the initial asset loading useEffect and selectLevel.
    }
  }, [gameState.gameStarted, gameState.isLoadingAssets, isMainSongBuffered, isAudioContextReady, gameState.setIsLoadingAssets]);


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
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          // Remove onLoadedData - loading handled by AssetLoader
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1
          }}
          preload="auto"
        >
          <source src="/videos/level2background-compressed.mp4" type="video/mp4" />
        </video>
      )}

      {/* iOS Fallback Audio Indicator */}
      {gameState.gameStarted && usingFallbackAudio && !needsUserInteraction && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 165, 0, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'Orbitron, sans-serif',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>🔇</span>
          <span>Audio playing in compatibility mode</span>
        </div>
      )}

      {/* iOS Audio Interaction Prompt */}
      {gameState.gameStarted && needsUserInteraction && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          padding: '40px',
          borderRadius: '12px',
          zIndex: 1001,
          textAlign: 'center',
          fontFamily: 'Orbitron, sans-serif',
          maxWidth: '90%',
          width: '400px',
          border: '2px solid #4CAF50'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '24px', color: '#4CAF50' }}>🎵 Enable Audio</h3>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            Tap anywhere to start the music and play!
          </p>
          <div style={{
            fontSize: '48px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>👆</div>
          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* Unified Loading indicator */}
      {isActuallyLoading && !needsUserInteraction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 1000,
          color: 'white',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '24px',
          textAlign: 'center'
        }}>
          <p>
            {gameState.isLoadingAssets && "Loading Assets..."}
            {gameState.gameStarted && !gameState.isLoadingAssets && !isAudioContextReady && "Initializing Audio..."}
            {gameState.gameStarted && !gameState.isLoadingAssets && isAudioContextReady && !isMainSongBuffered && "Buffering Music..."}
            {!gameState.isLoadingAssets && gameState.gameStarted && isAudioContextReady && isMainSongBuffered && "Ready!"}
          </p>
          <div style={{
            width: '80%',
            maxWidth: '400px',
            height: '20px',
            backgroundColor: '#555',
            borderRadius: '10px',
            overflow: 'hidden',
            marginTop: '10px'
          }}>
            <div style={{
              width: `${gameState.loadingProgress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.3s ease-in-out'
            }} />
          </div>
          <p>{gameState.loadingProgress}%</p>
        </div>
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
        isLoading={isActuallyLoading} // Pass comprehensive loading state
        loadingProgress={gameState.loadingProgress} // Asset loading progress
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

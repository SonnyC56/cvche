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
  const obstacleImageRef = useRef<HTMLImageElement>(null!);
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
    gameState.dataArrayRef
  );
  
  // Create non-null audio ref for the game loop
  const audioRefNonNull = useRef<HTMLAudioElement>(null!);
  
  // Keep audioRefNonNull.current in sync with audioRef.current
  useEffect(() => {
    if (audioRef.current) {
      audioRefNonNull.current = audioRef.current;
    }
  }, [audioRef.current]);
  
  // Set up input handlers
  const { inputRef, setupVisibilityHandler } = useInputHandlers(canvasRef);
  
  // Set up visibility change handler for pausing
  setupVisibilityHandler(gameState.isPaused, gameState.gameStarted, gameState.togglePause);
  
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
      }
      if (loader.plasticBagImage) {
        plasticBagRef.current = loader.plasticBagImage;
      }
      if (loader.obstacleImage) {
        obstacleImageRef.current = loader.obstacleImage;
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
    if (!portraitCanvasRef.current) return;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw fish character
    const fishPosition = drawPlayerPortrait(ctx, fishImageRef.current, gameState.portraitFishPositionRef.current);
    
    if (fishPosition) {
      // Create particles
      createPortraitParticles(gameState.portraitParticlesRef.current, fishPosition.x, fishPosition.y);
    }
    
    // Update and draw particles
    updateAndDrawParticles(ctx, gameState.portraitParticlesRef.current, 1);
  }, [gameState.portraitFishPositionRef, gameState.portraitParticlesRef]);
  
  // Start game function
  const startGame = useCallback(() => {
    if (gameState.gameStarted) return;
    
    gameState.setGameStarted(true);
    gameState.setHealth(100);
    onGameStart?.();
    
    // Set up container background based on level
    if (gameState.currentLevel.id === 2 && gameState.containerRef.current) {
      gameState.containerRef.current.style.background = "transparent";
    } else {
      gameState.backgroundColorRef.current = gameState.currentLevel.initialBackground;
      gameState.waveColorRef.current = gameState.currentLevel.initialWaveColor;
      
      if (gameState.containerRef.current) {
        gameState.containerRef.current.style.background = gameState.currentLevel.initialBackground;
      }
    }
    
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
    
    // Start audio and game loop
    if (audioRef.current) {
      audioRefNonNull.current = audioRef.current;
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
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
            obstacleImageRef,
            fishHookRef,
            flipflopRef,
            toothbrushRef,
            hotdogRef,
            rubberDuckyRef,
            gameState.level2ObstacleImagesRef,
            gameState.level2PickupImagesRef,
            gameState.currentLevelRef,
            gameState.timedTextEventsRef,
            gameState.colorEventsRef,
            gameState.level2TimedEventsRef,
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
      }).catch(console.error);
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
      {/* Background video for Level 2 */}
      {gameState.currentLevel.id === 2 && (
        <video 
          src="/videos/level2background.mp4" 
          autoPlay 
          loop 
          muted 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            zIndex: -1 
          }} 
        />
      )}
      
      {/* Stars canvas for top decoration */}
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
      
      {/* Game controls bar */}
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
      
      {/* Health bar */}
      {gameState.gameStarted && <HealthBar health={gameState.health} />}
      
      {/* Streak display */}
      {gameState.gameStarted && (
        <StreakDisplay 
          streak={gameState.gameStateRef.current.streak}
          multiplier={gameState.gameStateRef.current.multiplier}
          scale={gameState.streakDisplayRef.current.scale}
        />
      )}
      
      {/* Welcome screen */}
      <WelcomeScreen 
        gameStarted={gameState.gameStarted}
        isLandscape={gameState.isLandscape}
        floraLoaded={floraLoaded}
        startGame={startGame}
        setShowAboutModal={gameState.setShowAboutModal}
      />
      
      {/* Portrait mode screen */}
      <PortraitScreen 
        isPortrait={!gameState.isLandscape}
        gameStarted={gameState.gameStarted}
        isPaused={gameState.isPaused}
        setShowAboutModal={gameState.setShowAboutModal}
        animatePortrait={animatePortrait}
      />
      
      {/* Main game canvas */}
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />
      
      {/* Audio element */}
      <audio
        id="audioControl"
        ref={audioRef}
        crossOrigin="anonymous"
        src="https://storage.googleapis.com/assets.urnowhere.com/publicmedia/cvche/welcomeToCVCHE.mp3"
        style={{ display: 'none' }}
      />
      
      {/* Pause screen */}
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
      />
      
      {/* Level complete screen */}
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
      />
      
      {/* About modal */}
      <AboutModal 
        showAboutModal={gameState.showAboutModal}
        setShowAboutModal={gameState.setShowAboutModal}
      />
    </div>
  );
};

export default MusicReactiveOceanGame;
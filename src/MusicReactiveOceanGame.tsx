import React, { useRef, useEffect, useState, useCallback } from 'react';

// Global declaration for Safari
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

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

interface GameItem {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'trash' | 'obstacle';
  speed: number;
  rotation?: number;
  pickupImage?: HTMLImageElement;
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

const MusicReactiveOceanGame = () => {
  // UI state
  const [audioProgress, setAudioProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // DOM refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Control game loop
  const gameLoopRef = useRef<boolean>(false);
  const lastBeatTimeRef = useRef<number>(0);
  const beatThreshold = 30; // Lower threshold for more frequent beat detection
  const levelStartDelay = 0; // delay (in ms) before the level starts moving

  // Store the requestAnimationFrame ID so we can cancel it on pause
  const animationFrameIdRef = useRef<number | null>(null);

  // Audio analyser refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Preload images
  const fishImageRef = useRef<HTMLImageElement | null>(null);
  const waterBottleRef = useRef<HTMLImageElement | null>(null);
  const plasticBagRef = useRef<HTMLImageElement | null>(null);
  const obstacleImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Fish image (player)
    const fishImg = new Image();
    fishImg.onload = () => {
      fishImageRef.current = fishImg;
    };
    fishImg.src = '/sprites/cvcheFish.png';

    // Pickup images (water bottle and plastic bag)
    const bottleImg = new Image();
    bottleImg.onload = () => {
      waterBottleRef.current = bottleImg;
    };
    bottleImg.src = '/sprites/waterBottle.png';

    const bagImg = new Image();
    bagImg.onload = () => {
      plasticBagRef.current = bagImg;
    };
    bagImg.src = '/sprites/plasticBag.png';

    // Obstacle image (oil barrel)
    const barrelImg = new Image();
    barrelImg.onload = () => {
      obstacleImageRef.current = barrelImg;
    };
    barrelImg.src = '/sprites/oilBarrel.png';
  }, []);

  // Persistent game state
  const gameStateRef = useRef({
    player: { x: 100, y: window.innerHeight / 2, width: 50, height: 30, speed: 5 },
    trashList: [] as GameItem[],
    obstacles: [] as GameItem[],
    particles: [] as Particle[],
    score: 0,
    scorePopups: [] as ScorePopup[],
  });

  // Timed text events
  const timedTextEventsRef = useRef<TimedTextEvent[]>([
    { timestamp: 9.5, text: "Welcome to CVCHE!", triggered: false },
    { timestamp: 30, text: "Keep going!", triggered: false },
    { timestamp: 60, text: "You are awesome!", triggered: false },
  ]);
  const activeTimedTextsRef = useRef<ActiveTimedText[]>([]);

  // Input state
  const inputRef = useRef({
    isTouching: false,
    touchY: window.innerHeight / 2,
  });

  // Setup AudioContext and analyser when the game starts
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
    // Resume on mobile
    const resumeAudioCtx = () => {
      if (audioCtx.state !== 'running') {
        audioCtx.resume();
      }
    };
    document.body.addEventListener('touchstart', resumeAudioCtx, { once: true });
    return () => {
      document.body.removeEventListener('touchstart', resumeAudioCtx);
    };
  }, [gameStarted]);

  // Setup input event listeners once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouseDown = (e: MouseEvent) => {
      inputRef.current.isTouching = true;
      inputRef.current.touchY = e.clientY;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (inputRef.current.isTouching) {
        inputRef.current.touchY = e.clientY;
      }
    };
    const handleMouseUp = () => {
      inputRef.current.isTouching = false;
    };
    const handleTouchStart = (e: TouchEvent) => {
      inputRef.current.isTouching = true;
      inputRef.current.touchY = e.touches[0].clientY;
      e.preventDefault();
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (inputRef.current.isTouching) {
        inputRef.current.touchY = e.touches[0].clientY;
      }
      e.preventDefault();
    };
    const handleTouchEnd = (e: TouchEvent) => {
      inputRef.current.isTouching = false;
      e.preventDefault();
    };
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Utility: Get average amplitude from analyser data
  const getAverageAmplitude = () => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return 0;
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  };

  // Beat detection helper (ensures at least 500ms between beats)
  const detectBeat = (amplitude: number) => {
    const now = Date.now();
    if (amplitude > beatThreshold && now - lastBeatTimeRef.current > 500) {
      lastBeatTimeRef.current = now;
      return true;
    }
    return false;
  };

  // Draw a dynamic blue wave pattern that reacts to the music
  const drawBackgroundPattern = (ctx: CanvasRenderingContext2D, amplitudeFactor: number) => {
    if (!canvasRef.current) return;
    ctx.save();
    ctx.strokeStyle = "rgba(0,102,255,0.3)";
    ctx.lineWidth = 2;
    const width = canvasRef.current!.width;
    const height = canvasRef.current!.height;
    // Draw several sine waves
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const offset = i * 50;
      for (let x = 0; x < width; x += 10) {
        const y = height / 2 + Math.sin((x / width * 4 * Math.PI) + (Date.now() / 1000) + offset) * amplitudeFactor * 50;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // Draw the background: solid yellow with a dynamic blue wave pattern overlay
  const drawBackground = (ctx: CanvasRenderingContext2D, amplitudeFactor: number) => {
    if (!canvasRef.current) return;
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    drawBackgroundPattern(ctx, amplitudeFactor);
  };

  // Draw frequency spectrum (blue gradients)
  const drawSpectrum = (ctx: CanvasRenderingContext2D) => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray || !canvasRef.current) return;
    const barWidth = (canvasRef.current!.width / dataArray.length) * 2.5;
    let posX = 0;
    analyser.getByteFrequencyData(dataArray);
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = dataArray[i] / 2;
      const gradient = ctx.createLinearGradient(
        0,
        canvasRef.current!.height,
        0,
        canvasRef.current!.height - barHeight
      );
      gradient.addColorStop(0, `rgba(0, ${barHeight + 100}, ${barHeight + 100},1)`);
      gradient.addColorStop(1, `rgba(0, ${barHeight + 100}, ${barHeight + 100},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(posX, canvasRef.current!.height - barHeight, barWidth, barHeight);
      posX += barWidth + 1;
    }
  };

  // Draw the player using the preloaded fish image
  const drawPlayer = (
    ctx: CanvasRenderingContext2D,
    player: typeof gameStateRef.current.player,
    fishImg: HTMLImageElement | null
  ) => {
    if (!fishImg || !fishImg.complete) return;
    const aspect = fishImg.naturalWidth / fishImg.naturalHeight;
    const drawWidth = player.width * 1.25;
    const drawHeight = drawWidth / aspect;
    ctx.drawImage(
      fishImg,
      player.x - drawWidth / 2 + 20,
      player.y - drawHeight / 2,
      drawWidth,
      drawHeight
    );
  };

  // Draw an item.
  // For trash items (pickups): draw the image (2× larger) rotated from its center 4× slower.
  // For obstacles: draw the oil barrel image centered without rotation.
  const drawItem = (
    ctx: CanvasRenderingContext2D,
    item: GameItem,
    pulse: number
  ) => {
    ctx.save();
    if (item.type === 'trash' && item.pickupImage) {
      // Rotate 4× slower (increment by 0.0125 instead of 0.05)
      item.rotation = (item.rotation || 0) + 0.0125;
      const effectiveWidth = item.width * pulse;
      const effectiveHeight = item.height * pulse;
      const centerX = item.x + effectiveWidth / 2;
      const centerY = item.y + effectiveHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(item.rotation!);
      ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
    } else if (item.type === 'obstacle' && item.pickupImage) {
      // Draw oil barrel (obstacle) image centered without rotation
      const effectiveWidth = item.width;
      const effectiveHeight = item.height;
      const centerX = item.x + effectiveWidth / 2;
      const centerY = item.y + effectiveHeight / 2;
      ctx.drawImage(item.pickupImage, centerX - effectiveWidth / 2, centerY - effectiveHeight / 2, effectiveWidth, effectiveHeight);
    } else {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, item.width, item.height);
    }
    ctx.restore();
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.opacity *= 0.97;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      const opacityHex = Math.floor(p.opacity * 255)
        .toString(16)
        .padStart(2, '0');
      ctx.fillStyle = `${p.color}${opacityHex}`;
      ctx.fill();
    }
  };

  const createParticles = (
    particles: Particle[],
    x: number,
    y: number,
    color: string,
    count: number
  ) => {
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
      });
    }
  };

  // Create swim particles behind the fish.
  // The trail is moved 10px upward relative to the fish center.
  const createSwimParticles = (
    particles: Particle[],
    player: typeof gameStateRef.current.player
  ) => {
    const fishCenterX = player.x + (player.width * 1.25) / 2;
    const fishCenterY = player.y + player.height / 2 - 10; // move up 10px
    const tailX = fishCenterX - player.width;
    particles.push({
      x: tailX,
      y: fishCenterY,
      vx: -2 - Math.random() * 2,
      vy: (Math.random() - 0.5) * 0.5,
      life: 1.0,
      color: '#FFD700',
      size: 4 + Math.random() * 3,
      opacity: 0.8,
    });
  };

  const updateAndDrawScorePopups = (ctx: CanvasRenderingContext2D) => {
    const popups = gameStateRef.current.scorePopups;
    for (let i = popups.length - 1; i >= 0; i--) {
      const popup = popups[i];
      ctx.save();
      ctx.font = "20px Arial";
      ctx.fillStyle = "black";
      ctx.globalAlpha = popup.opacity;
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.restore();
      popup.y -= 0.5;
      popup.lifetime -= 1;
      popup.opacity = popup.lifetime / 100;
      if (popup.lifetime <= 0) {
        popups.splice(i, 1);
      }
    }
  };

  const updateAndDrawTimedTexts = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef.current) return;
    activeTimedTextsRef.current.forEach((item) => {
      const opacity = item.lifetime / 200;
      ctx.save();
      ctx.font = "80px Arial";
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.text, canvasRef.current!.width / 2, canvasRef.current!.height / 2);
      ctx.restore();
      item.lifetime -= 1;
    });
    activeTimedTextsRef.current = activeTimedTextsRef.current.filter(item => item.lifetime > 0);
  };

  // The main game loop
  const gameLoop = useCallback(() => {
    if (!gameLoopRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const canvas = canvasRef.current!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const { player, trashList, obstacles, particles } = gameStateRef.current;
    const amplitude = getAverageAmplitude();
    const pulse = 1 + amplitude / 100;

    // Spawn items on beat
    if (detectBeat(amplitude)) {
      const isTrash = Math.random() > 0.5;
      if (isTrash) {
        // Spawn trash (pickups) with water bottle or plastic bag, 2× larger
        const pickupImage = (Math.random() > 0.5 ? waterBottleRef.current : plasticBagRef.current) || undefined;
        const newItem: GameItem = {
          x: canvas.width,
          y: Math.random() * (canvas.height - 50),
          width: 60, // 2× original 30
          height: 60,
          type: 'trash',
          speed: 3 + Math.random() * 2,
          rotation: 0,
          pickupImage,
        };
        trashList.push(newItem);
      } else {
        // Spawn obstacle using oil barrel image (do not rotate)
        const newItem: GameItem = {
          x: canvas.width,
          y: Math.random() * (canvas.height - 50),
          width: 60,
          height: 60,
          type: 'obstacle',
          speed: 3 + Math.random() * 2,
          pickupImage: obstacleImageRef.current || undefined,
        };
        obstacles.push(newItem);
      }
    }

    // Draw background and spectrum
    drawBackground(ctx, amplitude / 100);
    drawSpectrum(ctx);

    // Timed text events
    const audioTime = audioRef.current?.currentTime || 0;
    timedTextEventsRef.current.forEach(event => {
      if (!event.triggered && audioTime >= event.timestamp) {
        event.triggered = true;
        activeTimedTextsRef.current.push({ text: event.text, lifetime: 200 });
      }
    });
    updateAndDrawTimedTexts(ctx);

    // Update player position (smooth follow)
    if (inputRef.current.isTouching) {
      player.y += (inputRef.current.touchY - (player.y + player.height / 2)) * 0.1;
    }

    // Update and draw trash items (pickups)
    for (let i = trashList.length - 1; i >= 0; i--) {
      const item = trashList[i];
      item.x -= item.speed;
      if (item.x + item.width * pulse < 0) {
        trashList.splice(i, 1);
        continue;
      }
      const effectiveWidth = item.width * pulse;
      const effectiveHeight = item.height * pulse;
      if (
        player.x < item.x + effectiveWidth &&
        player.x + player.width > item.x &&
        player.y < item.y + effectiveHeight &&
        player.y + player.height > item.y
      ) {
        gameStateRef.current.score += 10;
        const popupX = item.x + effectiveWidth / 2;
        const popupY = item.y + effectiveHeight / 2;
        gameStateRef.current.scorePopups.push({ x: popupX, y: popupY, text: "+10", opacity: 1, lifetime: 100 });
        createParticles(particles, item.x, item.y, '#00FF00', 20);
        trashList.splice(i, 1);
      } else {
        drawItem(ctx, item, pulse);
      }
    }

    // Update and draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const item = obstacles[i];
      item.x -= item.speed;
      if (item.x + item.width < 0) {
        obstacles.splice(i, 1);
        continue;
      }
      if (
        player.x < item.x + item.width &&
        player.x + player.width > item.x &&
        player.y < item.y + item.height &&
        player.y + player.height > item.y
      ) {
        gameStateRef.current.score = Math.max(0, gameStateRef.current.score - 20);
        const popupX = item.x + item.width / 2;
        const popupY = item.y + item.height / 2;
        gameStateRef.current.scorePopups.push({ x: popupX, y: popupY, text: "-20", opacity: 1, lifetime: 100 });
        createParticles(particles, item.x, item.y, '#FF0000', 20);
        obstacles.splice(i, 1);
      } else {
        drawItem(ctx, item, 1);
      }
    }

    // Create swim particles, update particles and score popups, and draw player
    createSwimParticles(particles, player);
    updateAndDrawParticles(ctx, particles);
    updateAndDrawScorePopups(ctx);
    drawPlayer(ctx, player, fishImageRef.current);

    setScore(gameStateRef.current.score);
    requestAnimationFrame(() => {
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    });
  }, []);

  // Use a separate animation loop to update the song progress and times
  useEffect(() => {
    let progressAnimationFrameId: number;
    const updateProgress = () => {
      if (audioRef.current && audioRef.current.duration) {
        setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration);
      }
      progressAnimationFrameId = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    return () => cancelAnimationFrame(progressAnimationFrameId);
  }, []);

  // Helper to format time in mm:ss
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle pause/resume so that the simulation does not speed up
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
        audioRef.current
          ?.play()
          .then(() => {
            if (!animationFrameIdRef.current) {
              gameLoopRef.current = true;
              gameLoop();
            }
          })
          .catch((err) => console.error(err));
      }
      return newPaused;
    });
  }, [gameLoop]);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#FFFF00' }}>
      {/* Top Menu Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '50px',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 10,
          color: '#fff',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          <button
            onClick={togglePause}
            style={{
              background: '#0066FF',
              border: 'none',
              color: '#fff',
              padding: '5px 15px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
          <div>Level 1 - Welcome to CVCHE</div>
          <div>Score: {score}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '500px' }}>
          <div
            style={{
              flex: 1,
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${audioProgress}%`,
                height: '100%',
                background: '#0066FF',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
          <div style={{ fontSize: '14px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Start Button */}
      {!gameStarted && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
          }}
        >
          <button
            onClick={() => {
              setGameStarted(true);
              audioRef.current?.play();
              setTimeout(() => {
                gameLoopRef.current = true;
                gameLoop();
              }, levelStartDelay);
            }}
            style={{
              background: '#0066FF',
              border: 'none',
              color: '#fff',
              padding: '20px 40px',
              fontSize: '24px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s',
            }}
          >
            Click to Start
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {/* Hidden audio element with welcome song */}
      <audio
        id="audioControl"
        ref={audioRef}
        crossOrigin="anonymous"
        src="/sounds/welcomeToCVCHE.mp3"
        loop
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default MusicReactiveOceanGame;

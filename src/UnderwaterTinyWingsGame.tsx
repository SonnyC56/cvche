// UnderwaterTinyWingsSoundWaveGame.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface TrashItem {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  collected: boolean;
}

interface FishState {
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
  launchTimer: number; // counts down frames after launch to allow a graceful arc
}

interface SlopeFeedback {
  text: string;
  lifetime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

interface Props {
  onGameStart?: () => void;
}

const UnderwaterTinyWingsSoundWaveGame: React.FC<Props> = ({ onGameStart }) => {
  // Canvas, audio, and asset refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fishImageRef = useRef<HTMLImageElement | null>(null);

  // Audio analyser
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeDomainDataRef = useRef<Uint8Array | null>(null);

  // Particle system
  const particlesRef = useRef<Particle[]>([]);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const distanceRef = useRef(0);

  // Terrain parameters – now with 3× vertical variance
  const terrainBufferRef = useRef<number[]>([]);
  const scrollOffsetRef = useRef(0);
  const TERRAIN_SPACING = 160; // wide spacing for smooth, wide hills
  const amplitudeScale = 6000; // 3x more vertical variance than before (was 2000)
  let baseline = 0; // set to 70% of canvas height in the game loop

  // Trash and fish state
  const trashItemsRef = useRef<TrashItem[]>([]);
  const fishRef = useRef<FishState>({
    x: 100,
    y: 0,
    vy: 0,
    onGround: true,
    launchTimer: 0,
  });
  // Slope boost streak and feedback
  const slopeStreakRef = useRef<number>(0);
  const slopeFeedbackRef = useRef<SlopeFeedback | null>(null);

  // Accumulated speed (only accumulated on downward slopes)
  const accumulatedSpeedRef = useRef<number>(0);
  
  // Fever Mode (kept as before)
  const feverModeRef = useRef<boolean>(false);
  const feverTimerRef = useRef<number>(0);
  const scoreMultiplierRef = useRef<number>(1);

  // Input flag – when pressed down.
  const isPressingDownRef = useRef<boolean>(false);

  // Movement and physics constants
  const baseSpeed = 2; // base horizontal speed (pixels/frame)
  const GRAVITY = 0.5;
  const EXTRA_GRAVITY = 0.5; // extra gravity when holding down
  // JUMP_FORCE is used for automatic launches.
  const JUMP_FORCE = 10;
  // Threshold for a "good" downward slope launch (in radians)
  const GOOD_SLOPE_THRESHOLD = 0.1;
  // Fever Mode parameters (unchanged)
  const FEVER_SPEED_THRESHOLD = 4;
  const FEVER_ACTIVATION_TIME = 180; // frames (~3 sec)

  // Launch arc: when launched, the fish's launchTimer is set to a value (e.g. 30 frames)
  const LAUNCH_TIMER_INITIAL = 30; 

  // Animation frame ref
  const animationFrameIdRef = useRef<number | null>(null);

  // Load fish asset
  useEffect(() => {
    const fishImg = new Image();
    fishImg.onload = () => { fishImageRef.current = fishImg; };
    fishImg.src = '/sprites/cvcheFish.webp';
  }, []);

  // Set up audio analyser when game starts
  useEffect(() => {
    if (!gameStarted) return;
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.error("Web Audio API not supported.");
      return;
    }
    const audioCtx = new AudioContextClass();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    timeDomainDataRef.current = new Uint8Array(analyser.fftSize);
    const source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    const resumeAudioCtx = () => {
      if (audioCtx.state !== 'running') audioCtx.resume();
    };
    document.body.addEventListener('touchstart', resumeAudioCtx, { once: true });
    return () => {
      document.body.removeEventListener('touchstart', resumeAudioCtx);
    };
  }, [gameStarted]);

  // Initialize terrain buffer with neutral samples (128)
  const initializeTerrainBuffer = useCallback((canvasWidth: number) => {
    const numPoints = Math.ceil(canvasWidth / TERRAIN_SPACING) + 2;
    terrainBufferRef.current = Array(numPoints).fill(128);
    scrollOffsetRef.current = 0;
  }, []);

  // Given an x coordinate, interpolate terrain y
  const getTerrainYAt = useCallback((x: number, canvasWidth: number): number => {
    const buffer = terrainBufferRef.current;
    const indexFloat = (x + scrollOffsetRef.current) / TERRAIN_SPACING;
    const index = Math.floor(indexFloat);
    const t = indexFloat - index;
    if (index >= buffer.length - 1) {
      return baseline + ((buffer[buffer.length - 1] - 128) / 128) * amplitudeScale;
    }
    const sample1 = buffer[index];
    const sample2 = buffer[index + 1];
    const sampleInterp = sample1 + (sample2 - sample1) * t;
    return baseline + ((sampleInterp - 128) / 128) * amplitudeScale;
  }, [amplitudeScale, baseline]);

  // Update terrain buffer by scrolling and appending a new audio sample.
  const updateTerrainBuffer = useCallback((effectiveSpeed: number) => {
    scrollOffsetRef.current += effectiveSpeed;
    if (scrollOffsetRef.current >= TERRAIN_SPACING) {
      scrollOffsetRef.current -= TERRAIN_SPACING;
      terrainBufferRef.current.shift();
    }
    if (analyserRef.current && timeDomainDataRef.current) {
      analyserRef.current.getByteTimeDomainData(timeDomainDataRef.current);
      let sum = 0;
      const data = timeDomainDataRef.current;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      const avg = sum / data.length;
      terrainBufferRef.current.push(avg);
    } else {
      terrainBufferRef.current.push(128);
    }
  }, []);

  // Spawn trash items occasionally.
  const maybeSpawnTrash = useCallback((canvasWidth: number, effectiveSpeed: number) => {
    if (Math.random() < 0.005) {
      const trashImg = new Image();
      trashImg.src = Math.random() > 0.5 ? '/sprites/waterBottle.webp' : '/sprites/plasticBag.webp';
      const width = 40, height = 40;
      const x = canvasWidth + 10;
      const y = getTerrainYAt(x, canvasWidth) - height;
      trashItemsRef.current.push({ x, y, width, height, image: trashImg, collected: false });
    }
  }, [getTerrainYAt]);

  // Update trash items: scroll and check for collisions.
  const updateTrash = useCallback((canvasWidth: number, effectiveSpeed: number) => {
    const fish = fishRef.current;
    const items = trashItemsRef.current;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.x -= effectiveSpeed;
      item.y = getTerrainYAt(item.x, canvasWidth) - item.height;
      if (item.x + item.width < 0) {
        items.splice(i, 1);
        continue;
      }
      const dx = (fish.x + 25) - (item.x + item.width / 2);
      const dy = (fish.y + 15) - (item.y + item.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (!item.collected && dist < 30) {
        item.collected = true;
        setScore(prev => prev + 50);
        items.splice(i, 1);
      }
    }
  }, [getTerrainYAt]);

  // Particle effect update and draw.
  const updateAndDrawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    // Update existing particles.
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.life / 30})`;
      ctx.fill();
    });
  }, []);

  // Generate particles behind the fish when sliding on a good downward slope.
  const generateTrailParticles = useCallback((fishX: number, fishY: number) => {
    for (let i = 0; i < 3; i++) {
      particlesRef.current.push({
        x: fishX - 20,
        y: fishY + (Math.random() - 0.5) * 10,
        vx: - (Math.random() * 1 + 0.5),
        vy: (Math.random() - 0.5) * 1,
        life: 30,
        size: Math.random() * 2 + 1,
      });
    }
  }, []);

  // Draw the terrain using quadratic curves.
  const drawTerrain = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const buffer = terrainBufferRef.current;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < buffer.length; i++) {
      const x = i * TERRAIN_SPACING - scrollOffsetRef.current;
      const y = baseline + ((buffer[i] - 128) / 128) * amplitudeScale;
      points.push({ x, y });
    }
    ctx.beginPath();
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const cx = points[i].x;
        const cy = points[i].y;
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(cx, cy, midX, midY);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.lineTo(points[points.length - 1].x, canvasHeight);
    ctx.lineTo(points[0].x, canvasHeight);
    ctx.closePath();
    const avgAmp = buffer.reduce((sum, v) => sum + v, 0) / buffer.length;
    const gradient = ctx.createLinearGradient(0, baseline, 0, canvasHeight);
    const hillColor = `rgba(0, ${Math.floor(102 + ((avgAmp - 128) / 128) * 100)}, 255, 0.8)`;
    gradient.addColorStop(0, hillColor);
    gradient.addColorStop(1, '#003366');
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [amplitudeScale, baseline]);

  // Main game loop.
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    baseline = canvas.height * 0.7;

    const fish = fishRef.current;

    // Compute terrain slope at fish's position.
    const deltaX = TERRAIN_SPACING;
    const y0 = getTerrainYAt(fish.x, canvas.width);
    const y1 = getTerrainYAt(fish.x + deltaX, canvas.width);
    const slopeAngle = Math.atan2(y1 - y0, deltaX);

    // Calculate effective horizontal speed.
    let effectiveSpeed = slopeAngle >= 0 
      ? baseSpeed * Math.cos(slopeAngle)
      : baseSpeed / Math.cos(slopeAngle);
    // If the player holds down on flat/upward terrain, come to a stop.
    if (isPressingDownRef.current && slopeAngle >= 0) {
      effectiveSpeed = 0;
    }
    effectiveSpeed = Math.max(0.5, Math.min(effectiveSpeed, 5));
    if (audioRef.current) {
      audioRef.current.playbackRate = effectiveSpeed / baseSpeed;
    }

    // Update terrain and trash.
    updateTerrainBuffer(effectiveSpeed);
    maybeSpawnTrash(canvas.width, effectiveSpeed);
    updateTrash(canvas.width, effectiveSpeed);

    // --- Core Mechanics: Accumulated Speed & Launch from Downward Slopes ---
    // Only accumulate speed when on the ground and on a downward slope.
    if (isPressingDownRef.current && fish.onGround && slopeAngle < 0) {
      accumulatedSpeedRef.current += 0.1;
      // Also generate trail particles when sliding well.
      generateTrailParticles(fish.x, fish.y);
    }
    // On release while on the ground: launch only if on a good downward slope.
    if (!isPressingDownRef.current && fish.onGround) {
      if (accumulatedSpeedRef.current > 0 && slopeAngle < -GOOD_SLOPE_THRESHOLD) {
        fish.onGround = false;
        // Use a lower launch multiplier so the fish isn't launched too high.
        fish.vy = - (JUMP_FORCE + accumulatedSpeedRef.current * 2);
        fish.launchTimer = LAUNCH_TIMER_INITIAL;
      }
      // Reset accumulated speed.
      accumulatedSpeedRef.current = 0;
    }

    // --- Fever Mode (as before) ---
    if (effectiveSpeed >= FEVER_SPEED_THRESHOLD) {
      feverTimerRef.current++;
    } else {
      feverTimerRef.current = Math.max(0, feverTimerRef.current - 1);
      if (feverTimerRef.current === 0) {
        feverModeRef.current = false;
        scoreMultiplierRef.current = 1;
      }
    }
    if (feverTimerRef.current > FEVER_ACTIVATION_TIME) {
      feverModeRef.current = true;
      scoreMultiplierRef.current = 2;
    }
    if (feverModeRef.current && fish.y < 50) {
      setScore(prev => prev + 20 * scoreMultiplierRef.current);
      feverModeRef.current = false;
      feverTimerRef.current = 0;
      scoreMultiplierRef.current = 1;
    }

    // --- Fish Physics ---
    const groundY = getTerrainYAt(fish.x, canvas.width);
    if (!fish.onGround) {
      // If the fish was just launched, use reduced gravity for a graceful arc.
      const currentGravity = fish.launchTimer > 0 ? GRAVITY * 0.5 : GRAVITY + (isPressingDownRef.current ? EXTRA_GRAVITY : 0);
      fish.vy += currentGravity;
      fish.y += fish.vy;
      if (fish.launchTimer > 0) {
        fish.launchTimer--;
      }
      if (fish.y >= groundY - 15) {
        fish.y = groundY - 15;
        // On landing, if on a steep downward slope, auto-launch.
        if (slopeAngle < -GOOD_SLOPE_THRESHOLD) {
          fish.onGround = false;
          fish.vy = -JUMP_FORCE * (1 + slopeStreakRef.current * 0.1);
          slopeStreakRef.current++;
          slopeFeedbackRef.current = { text: `Good Slope! x${slopeStreakRef.current}`, lifetime: 60 };
        } else {
          fish.onGround = true;
          fish.vy = 0;
          slopeStreakRef.current = 0;
        }
      }
    } else {
      fish.y = groundY - 15;
      distanceRef.current += effectiveSpeed;
    }

    // --- Rendering ---
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTerrain(ctx, canvas.width, canvas.height);
    trashItemsRef.current.forEach(item => {
      if (item.image.complete) {
        ctx.drawImage(item.image, item.x, item.y, item.width, item.height);
      }
    });
    if (fishImageRef.current && fishImageRef.current.complete) {
      ctx.save();
      const angle = fish.onGround ? 0 : Math.atan2(fish.vy, effectiveSpeed);
      ctx.translate(fish.x, fish.y);
      ctx.rotate(angle);
      ctx.drawImage(fishImageRef.current, -30, -15, 60, 30);
      ctx.restore();
    }
    updateAndDrawParticles(ctx);
    const distanceScore = Math.floor(distanceRef.current / 10);
    setScore(distanceScore);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Orbitron, sans-serif';
    ctx.fillText(`Score: ${distanceScore}`, 20, 40);
    if (slopeFeedbackRef.current) {
      ctx.fillStyle = 'yellow';
      ctx.font = '30px Orbitron';
      ctx.fillText(slopeFeedbackRef.current.text, fish.x, fish.y - 50);
      slopeFeedbackRef.current.lifetime--;
      if (slopeFeedbackRef.current.lifetime <= 0) {
        slopeFeedbackRef.current = null;
      }
    }
    if (feverModeRef.current) {
      ctx.fillStyle = 'red';
      ctx.font = '40px Orbitron';
      ctx.fillText(`FEVER MODE!`, canvas.width / 2 - 100, 50);
    }
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  }, [drawTerrain, getTerrainYAt, maybeSpawnTrash, updateTerrainBuffer, updateTrash, generateTrailParticles, updateAndDrawParticles]);

  // Input handlers: pressing down sets the flag.
  const handleMouseDown = useCallback(() => {
    isPressingDownRef.current = true;
  }, []);
  const handleMouseUp = useCallback(() => {
    isPressingDownRef.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleMouseDown);
    canvas.addEventListener('touchend', handleMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleMouseDown);
      canvas.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseUp]);

  const startGame = useCallback(() => {
    distanceRef.current = 0;
    setScore(0);
    onGameStart?.();
    trashItemsRef.current = [];
    fishRef.current = {
      x: 100,
      y: 0,
      vy: 0,
      onGround: true,
      launchTimer: 0,
    };
    accumulatedSpeedRef.current = 0;
    slopeStreakRef.current = 0;
    slopeFeedbackRef.current = null;
    feverTimerRef.current = 0;
    feverModeRef.current = false;
    scoreMultiplierRef.current = 1;
    const canvas = canvasRef.current;
    if (canvas) initializeTerrainBuffer(canvas.width);
    setGameStarted(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  }, [initializeTerrainBuffer, gameLoop]);

  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#1a1a2e' }}>
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        src="/sounds/welcomeToCVCHE.mp3"
        style={{ display: 'none' }}
        onEnded={() => {
          setGameStarted(false);
          if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        }}
      />
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {!gameStarted && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', textAlign: 'center',
          color: '#fff', fontFamily: 'Orbitron, sans-serif'
        }}>
          <h1>Underwater Tiny Wings SoundWave</h1>
          <button
            onClick={startGame}
            style={{
              padding: '15px 30px', fontSize: '20px',
              border: 'none', borderRadius: '8px',
              backgroundColor: '#0066FF', color: '#fff', cursor: 'pointer'
            }}>
            Play
          </button>
        </div>
      )}
    </div>
  );
};

export default UnderwaterTinyWingsSoundWaveGame;

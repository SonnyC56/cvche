// @ts-expect-error React is used for JSX
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

// Type for a star in the sparkling stars effect
interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

const MusicReactiveOceanGame = () => {
  // UI state
  const [audioProgress, setAudioProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Instead of state for colors, use refs so updates are immediate.
  const backgroundColorRef = useRef("#FDEE03");
  const waveColorRef = useRef("rgba(0,102,255,0.4)");

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
  const beatThreshold = 30; // Lower threshold for more frequent beat detection
  const levelStartDelay = 0; // Delay (in ms) before the level starts moving

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
  // Speed multiplier ref
  const speedMultiplier = useRef<number>(1);

  // New ref to hold current amplitude (for potential reactivity)
  const amplitudeRef = useRef<number>(0);

   // Helper: Compute complementary color (works for hex or rgba)
/*    const getComplementaryColor = (color: string): string => {
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
      const r = 255 - parseInt(hex.substring(0, 2), 16);
      const g = 255 - parseInt(hex.substring(2, 4), 16);
      const b = 255 - parseInt(hex.substring(4, 6), 16);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } else if (color.startsWith('rgba')) {
      const components = color.match(/[\d.]+/g);
      if (components && components.length >= 3) {
        const r = 255 - Number(components[0]);
        const g = 255 - Number(components[1]);
        const b = 255 - Number(components[2]);
        const a = components[3] ? Number(components[3]) : 1;
        return `rgba(${r},${g},${b},${a})`;
      }
    }
    return color;
  };
 */
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

  useEffect(() => {
    // Preload images for player and pickups/obstacles
    const fishImg = new Image();
    fishImg.onload = () => { fishImageRef.current = fishImg; };
    fishImg.src = '/sprites/cvcheFish.png';

    const bottleImg = new Image();
    bottleImg.onload = () => { waterBottleRef.current = bottleImg; };
    bottleImg.src = '/sprites/waterBottle.png';

    const bagImg = new Image();
    bagImg.onload = () => { plasticBagRef.current = bagImg; };
    bagImg.src = '/sprites/plasticBag.png';

    const barrelImg = new Image();
    barrelImg.onload = () => { obstacleImageRef.current = barrelImg; };
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
    { timestamp: 9.5, text: "WELCOME TO CVCHE!", triggered: false },
    { timestamp: 60, text: "Keep going!", triggered: false },
    { timestamp: 120, text: "You are awesome!", triggered: false },
    { timestamp: 180, text: "Keep it up!", triggered: false },
    { timestamp: 240, text: "You're doing great!", triggered: false },
    { timestamp: 300, text: "Almost there!", triggered: false },
    { timestamp: 360, text: "Fantastic effort!", triggered: false },
    { timestamp: 429, text: "You made it!", triggered: false },
  ]);
  const activeTimedTextsRef = useRef<ActiveTimedText[]>([]);

  // Color events configuration (timed color changes)
  const colorEventsRef = useRef<TimedColorEvent[]>([
    { timestamp: 0, backgroundColor: "#FDEE03", waveColor: "rgba(0,102,255,0.4)", triggered: true, transitionDuration: 3 },
    { timestamp: 60, backgroundColor: "#4a1259", waveColor: "rgba(255,0,255,0.4)", triggered: false, transitionDuration: 3 },
    { timestamp: 120, backgroundColor: "#591212", waveColor: "rgba(255,100,100,0.4)", triggered: false, transitionDuration: 3 },
    { timestamp: 180, backgroundColor: "#123459", waveColor: "rgba(100,200,255,0.4)", triggered: false, transitionDuration: 3 },
    { timestamp: 240, backgroundColor: "#125934", waveColor: "rgba(100,255,150,0.4)", triggered: false, transitionDuration: 3 },
    { timestamp: 300, backgroundColor: "#593412", waveColor: "rgba(255,150,100,0.4)", triggered: false, transitionDuration: 3 },
    { timestamp: 360, backgroundColor: "#1a1a2e", waveColor: "rgba(0,102,255,0.4)", triggered: false, transitionDuration: 3 },
    { timestamp: 420, backgroundColor: "#FDEE03", waveColor: "rgba(0,102,255,0.4)", triggered: false, transitionDuration: 3 },
  ]);

  // Initial active color transition state
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
    return () => {
      document.body.removeEventListener('touchstart', resumeAudioCtx);
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

  // Utility: Get average amplitude from analyser data
  const getAverageAmplitude = () => {
    const analyser = analyserRef.current, dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return 0;
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
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

  // Draw background and spectrum (same as before)
  const drawBackgroundPattern = (ctx: CanvasRenderingContext2D, amplitudeFactor: number) => {
    if (!canvasRef.current) return;
    ctx.save();
    ctx.strokeStyle = waveColorRef.current;
    ctx.lineWidth = 2 + amplitudeFactor * 2;
    const width = canvasRef.current.width, height = canvasRef.current.height;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const offset = i * 50, timeOffset = Date.now() / (1000 + i * 500);
      for (let x = 0; x < width; x += 5) {
        const frequency = (4 + Math.sin(timeOffset) * 2) * (1 + amplitudeFactor * 0.5);
        const y = height / 2 + Math.sin((x / width * frequency * Math.PI) + timeOffset + offset) * (50 + amplitudeFactor * 70);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
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
    drawBackgroundPattern(ctx, amplitudeFactor);
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

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: typeof gameStateRef.current.player, fishImg: HTMLImageElement | null) => {
    if (!fishImg || !fishImg.complete) return;
    const aspect = fishImg.naturalWidth / fishImg.naturalHeight;
    const drawWidth = player.width * 1.25;
    const drawHeight = drawWidth / aspect;
    ctx.drawImage(fishImg, player.x - drawWidth / 2 + 20, player.y - drawHeight / 2, drawWidth, drawHeight);
  };

  const drawItem = (ctx: CanvasRenderingContext2D, item: GameItem, pulse: number) => {
    ctx.save();
    if (item.type === 'trash' && item.pickupImage) {
      item.rotation = (item.rotation || 0) + 0.0125;
      const effectiveWidth = item.width * pulse;
      const effectiveHeight = item.height * pulse;
      const centerX = item.x + effectiveWidth / 2;
      const centerY = item.y + effectiveHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(item.rotation!);
      ctx.drawImage(item.pickupImage, -effectiveWidth / 2, -effectiveHeight / 2, effectiveWidth, effectiveHeight);
    } else if (item.type === 'obstacle' && item.pickupImage) {
      const effectiveWidth = item.width, effectiveHeight = item.height;
      const centerX = item.x + effectiveWidth / 2, centerY = item.y + effectiveHeight / 2;
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
      p.x += p.vx * speedMultiplier.current;
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

  const createSwimParticles = (particles: Particle[], player: typeof gameStateRef.current.player) => {
    const fishCenterX = player.x + (player.width * 1.25) / 2;
    const fishCenterY = player.y + player.height / 2 - 10;
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
      if (popup.lifetime <= 0) popups.splice(i, 1);
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

  // Main game loop
  const gameLoop = useCallback(() => {
    if (!gameLoopRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const audioTime = audioRef.current?.currentTime || 0;
    // Handle color transitions
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

    // Update amplitude and shared ref for reactivity
    const amplitude = getAverageAmplitude();
    amplitudeRef.current = amplitude;
    const pulse = 1 + amplitude / 100;

    // Slower speed multiplier (max speed is half)
    const audioTimeMs = audioRef.current ? audioRef.current.currentTime * 1000 : 0;
    const effectiveTime = Math.max(0, audioTimeMs - levelStartDelay);
    speedMultiplier.current = 1 + (effectiveTime / 1000) / 120;

    // On beat, spawn trash or obstacle (no extra music particles)
    if (detectBeat(amplitude)) {
      const isTrash = Math.random() > 0.5;
      if (isTrash) {
        const pickupImage = (Math.random() > 0.5 ? waterBottleRef.current : plasticBagRef.current) || undefined;
        const newItem: GameItem = {
          x: canvas.width,
          y: Math.random() * (canvas.height - 50),
          width: 60,
          height: 60,
          type: 'trash',
          speed: 3 + Math.random() * 2,
          rotation: 0,
          pickupImage,
        };
        gameStateRef.current.trashList.push(newItem);
      } else {
        const newItem: GameItem = {
          x: canvas.width,
          y: Math.random() * (canvas.height - 50),
          width: 80,
          height: 80,
          type: 'obstacle',
          speed: 3 + Math.random() * 2,
          pickupImage: obstacleImageRef.current || undefined,
        };
        gameStateRef.current.obstacles.push(newItem);
      }
    }

    drawBackground(ctx, amplitude / 100);
    drawSpectrum(ctx);

    timedTextEventsRef.current.forEach(event => {
      if (!event.triggered && audioTime >= event.timestamp) {
        event.triggered = true;
        activeTimedTextsRef.current.push({ text: event.text, lifetime: 200 });
      }
    });
    updateAndDrawTimedTexts(ctx);

    if (inputRef.current.isDesktop || inputRef.current.isTouching) {
      gameStateRef.current.player.y += (inputRef.current.touchY - (gameStateRef.current.player.y + gameStateRef.current.player.height / 2)) * 0.1;
    }

    for (let i = gameStateRef.current.trashList.length - 1; i >= 0; i--) {
      const item = gameStateRef.current.trashList[i];
      item.x -= item.speed * speedMultiplier.current;
      if (item.x + item.width * pulse < 0) { gameStateRef.current.trashList.splice(i, 1); continue; }
      const effectiveWidth = item.width * pulse;
      const effectiveHeight = item.height * pulse;
      if (
        gameStateRef.current.player.x < item.x + effectiveWidth &&
        gameStateRef.current.player.x + gameStateRef.current.player.width > item.x &&
        gameStateRef.current.player.y < item.y + effectiveHeight &&
        gameStateRef.current.player.y + gameStateRef.current.player.height > item.y
      ) {
        gameStateRef.current.score += 10;
        const popupX = item.x + effectiveWidth / 2;
        const popupY = item.y + effectiveHeight / 2;
        gameStateRef.current.scorePopups.push({ x: popupX, y: popupY, text: "+10", opacity: 1, lifetime: 100 });
        createParticles(gameStateRef.current.particles, item.x, item.y, '#00FF00', 20);
        gameStateRef.current.trashList.splice(i, 1);
      } else {
        drawItem(ctx, item, pulse);
      }
    }

    for (let i = gameStateRef.current.obstacles.length - 1; i >= 0; i--) {
      const item = gameStateRef.current.obstacles[i];
      item.x -= item.speed * speedMultiplier.current;
      if (item.x + item.width < 0) { gameStateRef.current.obstacles.splice(i, 1); continue; }
      if (
        gameStateRef.current.player.x < item.x + item.width &&
        gameStateRef.current.player.x + gameStateRef.current.player.width > item.x &&
        gameStateRef.current.player.y < item.y + item.height &&
        gameStateRef.current.player.y + gameStateRef.current.player.height > item.y
      ) {
        gameStateRef.current.score = Math.max(0, gameStateRef.current.score - 20);
        const popupX = item.x + item.width / 2;
        const popupY = item.y + item.height / 2;
        gameStateRef.current.scorePopups.push({ x: popupX, y: popupY, text: "-20", opacity: 1, lifetime: 100 });
        createParticles(gameStateRef.current.particles, item.x, item.y, '#FF0000', 20);
        gameStateRef.current.obstacles.splice(i, 1);
      } else {
        drawItem(ctx, item, 1);
      }
    }

    createSwimParticles(gameStateRef.current.particles, gameStateRef.current.player);
    updateAndDrawParticles(ctx, gameStateRef.current.particles);
    updateAndDrawScorePopups(ctx);
    drawPlayer(ctx, gameStateRef.current.player, fishImageRef.current);

    setScore(gameStateRef.current.score);
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  }, []);

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

  const startGame = useCallback(() => {
    setGameStarted(true);
    backgroundColorRef.current = "#FDEE03";
    waveColorRef.current = "rgba(0,102,255,0.4)";
    if (containerRef.current) containerRef.current.style.background = "#FDEE03";
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
      }).catch(console.error);
    }
  }, [gameLoop]);

  // Sparkling Stars Effect at the Top
  // This replaces the fractal effect.
  // We create a set of stars that twinkle over time.
  const stars = useRef<Star[]>([]);
  useEffect(() => {
    const starsCanvas = starsCanvasRef.current;
    if (!starsCanvas) return;
    const ctx = starsCanvas.getContext("2d");
    if (!ctx) return;
    // Initialize stars (e.g., 100 stars)
    const numStars = 100;
    stars.current = [];
    for (let i = 0; i < numStars; i++) {
      stars.current.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * 200, // Top 200 pixels
        size: 1 + Math.random() * 2, // Size between 1 and 3
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random(), // Speed between 0.5 and 1.5
      });
    }
    const drawStars = () => {
      starsCanvas.width = window.innerWidth;
      starsCanvas.height = 200;
      ctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      const time = Date.now() / 1000;
      for (const star of stars.current) {
        const brightness = 0.5 + 0.5 * Math.sin(time * star.speed + star.phase);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${brightness})`;
        ctx.fill();
      }
      requestAnimationFrame(drawStars);
    };
    drawStars();
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '100vh', background: backgroundColorRef.current }}>
      {/* Sparkling Stars Canvas at the Top */}
      <canvas
        ref={starsCanvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '200px', pointerEvents: 'none', zIndex: 5 }}
      />
      {/* Top Menu Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 10,
        color: '#fff',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          {gameStarted && (
            <button
              onClick={togglePause}
              style={{
                background: '#0066FF',
                border: 'none',
                color: '#fff',
                padding: '5px 15px',
                cursor: 'pointer',
                borderRadius: '4px',
              }}>
              {isPaused ? 'Play' : 'Pause'}
            </button>
          )}
          <div>Level 1 - WELCOME TO CVCHE</div>
          <div>Score: {score}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '500px' }}>
          <div style={{
            flex: 1,
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${audioProgress}%`,
              height: '100%',
              background: '#0066FF',
              transition: 'width 0.1s linear',
            }} />
          </div>
          <div style={{ fontSize: '14px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
      {/* Start Button */}
      {!gameStarted && (
        <div style={{
          position: 'absolute',
          top: '50dvh',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <h1 style={{
              fontSize: '4rem',
              margin: 0,
              color: 'black',
              textShadow: '0 0 10px rgba(0,0,0,0.3)',
              lineHeight: '1.2'
              
            }}>
              Welcome to CVCHE
            </h1>

          </div>
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
              transition: 'transform 0.2s'
            }}>
            Play
          </button>
        </div>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {/* Hidden audio element */}
      <audio
        id="audioControl"
        ref={audioRef}
        crossOrigin="anonymous"
        src="/sounds/welcomeToCVCHE.mp3"
        loop
        style={{ display: 'none' }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const curTime = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            if (dur) {
              setAudioProgress((curTime / dur) * 100);
              setCurrentTime(curTime);
              setDuration(dur);
            }
          }
        }}
      />
    </div>
  );
};

export default MusicReactiveOceanGame;

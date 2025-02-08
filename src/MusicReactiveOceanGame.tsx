import React, { useRef, useEffect, useState } from 'react';

// Add this global declaration at the top of the file or in a separate declaration file
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const MusicReactiveOceanGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    const audioElement = audioRef.current;
    if (!canvas || !audioElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fill window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- Game Variables ---
    let localScore = 0;
    interface GameItem {
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'trash' | 'obstacle';
      speed: number;
    }

    const player = {
      x: 100,
      y: canvas.height / 2,
      width: 50,
      height: 30,
      speed: 5
    };
    const trashList: GameItem[] = [];
    const obstacles: GameItem[] = [];
    const spawnInterval = 1500; // milliseconds
    let lastSpawn = Date.now();
    let animationFrameId: number;

    interface ExtendedHTMLAudioElement extends HTMLAudioElement {
      _mediaElementSource?: MediaElementAudioSourceNode;
      _audioCtx?: AudioContext;
    }

    // --- Audio Setup ---
    const extendedAudioElement = audioElement as ExtendedHTMLAudioElement;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported in this browser.");
    }
    const audioCtx = extendedAudioElement._audioCtx || new AudioContextClass();
    extendedAudioElement._audioCtx = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let source: MediaElementAudioSourceNode;
    if (!extendedAudioElement._mediaElementSource) {
      source = audioCtx.createMediaElementSource(audioElement);
      extendedAudioElement._mediaElementSource = source;
    } else {
      source = extendedAudioElement._mediaElementSource;
    }
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Ensure AudioContext is resumed on mobile user interaction
    const resumeAudioCtx = () => {
      if (audioCtx.state !== 'running') {
        audioCtx.resume();
      }
    };
    document.body.addEventListener('touchstart', resumeAudioCtx, { once: true });

    const getAverageAmplitude = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      return sum / bufferLength;
    };

    // --- Draw Spectrum ---
    const drawSpectrum = () => {
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let posX = 0;
      analyser.getByteFrequencyData(dataArray);
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
        ctx.fillRect(posX, canvas.height - barHeight, barWidth, barHeight);
        posX += barWidth + 1;
      }
    };

    // --- Input Handling ---
    let isTouching = false;
    let touchY = player.y;
    const handleMouseDown = (e: MouseEvent) => { isTouching = true; touchY = e.clientY; };
    const handleMouseMove = (e: MouseEvent) => { if (isTouching) touchY = e.clientY; };
    const handleMouseUp = () => { isTouching = false; };

    const handleTouchStart = (e: TouchEvent) => {
      isTouching = true;
      touchY = e.touches[0].clientY;
      e.preventDefault();
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isTouching) touchY = e.touches[0].clientY;
      e.preventDefault();
    };
    const handleTouchEnd = (e: TouchEvent) => {
      isTouching = false;
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    // --- Collision Detection ---
    const collides = (
      a: { x: number; y: number; width: number; height: number },
      b: { x: number; y: number; width: number; height: number }
    ) => {
      return !(
        a.x > b.x + b.width ||
        a.x + a.width < b.x ||
        a.y > b.y + b.height ||
        a.y + a.height < b.y
      );
    };

    // Load the fish sprite from public/sprites folder
    const fishImg = new Image();
    fishImg.src = '/sprites/cvcheFish.png';

    // --- Drawing Functions ---
    const drawPlayer = () => {
      if (!fishImg.complete) return; // wait until image is loaded
      const aspect = fishImg.naturalWidth / fishImg.naturalHeight;
      // Use player's width and compute height based on fish aspect ratio
      const drawWidth = player.width;
      const drawHeight = drawWidth / aspect;
      ctx.drawImage(
        fishImg,
        player.x - drawWidth / 2,
        player.y - drawHeight / 2,
        drawWidth,
        drawHeight
      );
    };

    interface DrawableItem {
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'trash' | 'obstacle';
    }

    const drawItem = (item: DrawableItem): void => {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (item.type === 'trash') {
        ctx.fillStyle = '#00FF00';
        const pulse: number = 1 + getAverageAmplitude() / 100;
        ctx.fillRect(0, 0, item.width * pulse, item.height * pulse);
      } else {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, item.width, item.height);
      }
      ctx.restore();
    };

    // --- Game Loop ---
    const updateGame = () => {
      // Player movement: smoothly follow touch/mouse Y position
      if (isTouching) {
        player.y += (touchY - (player.y + player.height / 2)) * 0.1;
      }

      // Spawn trash/obstacles
      const now = Date.now();
      if (now - lastSpawn > spawnInterval) {
        lastSpawn = now;
        const isTrash = Math.random() > 0.3;
        const item: GameItem = {
          x: canvas.width,
          y: Math.random() * (canvas.height - 50),
          width: isTrash ? 30 : 40,
          height: isTrash ? 30 : 40,
          type: isTrash ? 'trash' : 'obstacle',
          speed: 3 + Math.random() * 2
        };
        if (isTrash) trashList.push(item);
        else obstacles.push(item);
      }

      // Update trash items
      trashList.forEach((item, index) => {
        item.x -= item.speed;
        if (item.x + item.width < 0) trashList.splice(index, 1);
        if (collides(player, item)) {
          localScore += 10;
          trashList.splice(index, 1);
        }
      });
      // Update obstacles
      obstacles.forEach((item, index) => {
        item.x -= item.speed;
        if (item.x + item.width < 0) obstacles.splice(index, 1);
        if (collides(player, item)) {
          localScore = Math.max(0, localScore - 20);
          obstacles.splice(index, 1);
        }
      });

      // Use music reactivity: adjust background color based on amplitude
      const amplitude = getAverageAmplitude();
      const brightness = Math.min(255, amplitude * 2);
      const bgColor = `rgb(${10 + brightness / 5}, ${46 + brightness / 10}, ${68 + brightness / 10})`;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawPlayer();
      trashList.forEach(drawItem);
      obstacles.forEach(drawItem);
      drawSpectrum();

      setScore(localScore);
      animationFrameId = requestAnimationFrame(updateGame);
    };

    // Start the game loop when the audio starts playing.
    const startGame = () => {
      if (audioElement.paused) {
        audioElement.play();
      }
      updateGame();
    };
    audioElement.addEventListener('play', startGame);

    // Cleanup on component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      audioElement.removeEventListener('play', startGame);
    };
  }, [gameStarted]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      background: '#FFFF00'  // base bright yellow background
    }}>
      {!gameStarted && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontSize: '24px',
            fontFamily: 'sans-serif',
            zIndex: 20,
            padding: '20px',
            textAlign: 'center'
          }}
          onClick={() => setGameStarted(true)}
        >
          Click to Start
        </div>
      )}
      <div
        id="score"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontFamily: 'sans-serif',
          fontSize: '24px',
          color: '#fff',
          zIndex: 10
        }}
      >
        Score: {score}
      </div>
      <audio
        id="audioControl"
        ref={audioRef}
        crossOrigin="anonymous"  // Added to enable CORS requests
        src="https://cdn.pixabay.com/download/audio/2024/11/29/audio_45bbd49c34.mp3?filename=lost-in-dreams-abstract-chill-downtempo-cinematic-future-beats-270241.mp3"
        controls
        loop
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10
        }}
      />
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default MusicReactiveOceanGame;

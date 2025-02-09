// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Ensure you have some basic styles if needed.
import MusicReactiveOceanGame from './MusicReactiveOceanGame';
import UnderwaterTinyWingsGame from './UnderwaterTinyWingsGame';
import UnderwaterDoodleJump from './UnderwaterDoodleJumpGame';

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

const App: React.FC = () => {
  const [isLandscape, setIsLandscape] = useState(true);
  const [selectedGame, setSelectedGame] = useState('ocean');
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fishImageRef = useRef<HTMLImageElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const fishPositionRef = useRef({ x: 0, y: 0, rotation: 0 });

  // Check device orientation: landscape if window.innerWidth > window.innerHeight
  useEffect(() => {
    // Prevent pull-to-refresh and other touch gestures
    document.body.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', checkOrientation);
    checkOrientation(); // Initial check

    return () => {
      window.removeEventListener('resize', checkOrientation);
      document.body.removeEventListener('touchmove', (e) => {
        e.preventDefault();
      });
    };
  }, []);

  // Load fish image
  useEffect(() => {
    const fishImg = new Image();
    fishImg.onload = () => { fishImageRef.current = fishImg; };
    fishImg.src = '/sprites/cvcheFish.webp';
  }, []);

  // Animation functions
  const createParticles = (x: number, y: number) => {
    for (let i = 0; i < 2; i++) {
      particlesRef.current.push({
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

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.opacity *= 0.97;
      
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      const opacityHex = Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = `${p.color}${opacityHex}`;
      ctx.fill();
    }
  };

  const drawFish = (ctx: CanvasRenderingContext2D) => {
    if (!fishImageRef.current || !canvasRef.current) return;
    
    const time = Date.now() / 1000;
    const canvas = canvasRef.current;
    
    // Update fish position
    fishPositionRef.current.x = canvas.width * 0.5;
    fishPositionRef.current.y = canvas.height * 0.25 + Math.sin(time * 2) * 20;
    fishPositionRef.current.rotation = Math.sin(time * 2) * 0.1;

    // Draw fish
    ctx.save();
    ctx.translate(fishPositionRef.current.x, fishPositionRef.current.y);
    ctx.rotate(fishPositionRef.current.rotation);
    
    const fishWidth = 100;
    const fishHeight = (fishWidth / fishImageRef.current.width) * fishImageRef.current.height;
    ctx.drawImage(
      fishImageRef.current,
      -fishWidth / 2,
      -fishHeight / 2,
      fishWidth,
      fishHeight
    );
    ctx.restore();

    // Create particles behind the fish
    createParticles(
      fishPositionRef.current.x - fishWidth / 2,
      fishPositionRef.current.y
    );
  };

  // Animation loop
  useEffect(() => {
    if (!isLandscape && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const animate = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFish(ctx);
        updateAndDrawParticles(ctx);
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isLandscape]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      fontFamily: 'Orbitron, sans-serif'
    }}>
      {!isLandscape && selectedGame !== 'doodle' ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            background: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            fontSize: '1.5rem',
            flexDirection: 'column',
            gap: '2rem',
          }}
        >
          <canvas 
            ref={canvasRef} 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%' 
            }} 
          />
          <h1 style={{ 
            fontSize: '3rem', 
            margin: 0,
            fontWeight: 'bold',
            color: '#FDEE03'
          }}>
            CVCHE
          </h1>
          <div style={{ fontSize: '1.2rem' }}>
            Please rotate your device to <strong>landscape</strong> to play this game.
          </div>
          <nav style={{ 
            marginTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            fontSize: '1.2rem'
          }}>
            <button 
              onClick={() => setSelectedGame('doodle')} 
              style={{ 
                color: '#FDEE03',
                background: 'none',
                border: '2px solid #FDEE03',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              Play Fluffy Jump
            </button>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
              <a href="#music" style={{ color: '#FDEE03' }}>Music</a>
              <a href="#socials" style={{ color: '#FDEE03' }}>Socials</a>
              <a href="#merch" style={{ color: '#FDEE03' }}>Merch</a>
            </div>
          </nav>
        </div>
      ) : isLandscape ? (
        <>
          {selectedGame === 'ocean' && <MusicReactiveOceanGame onGameStart={() => setIsPlaying(true)} />}
          {selectedGame === 'wings' && <UnderwaterTinyWingsGame onGameStart={() => setIsPlaying(true)} />}
          {selectedGame === 'doodle' && <UnderwaterDoodleJump onGameStart={() => setIsPlaying(true)} />}
          {!isPlaying && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              zIndex: 100,
              display: 'flex',
              gap: '1rem'
            }}>
              <button onClick={() => setSelectedGame('ocean')}>Ocean Game</button>
              <button onClick={() => setSelectedGame('doodle')}>Fluffy Jump</button>
              <button onClick={() => setSelectedGame('wings')}>Fluffy Flys</button>

            </div>
          )}
        </>
      ) : (
        <UnderwaterDoodleJump onGameStart={() => setIsPlaying(true)} />
      )}
    </div>
  );
};

export default App;

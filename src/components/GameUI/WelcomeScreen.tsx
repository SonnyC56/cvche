import React, { useRef, useEffect } from 'react';

interface WelcomeScreenProps {
  gameStarted: boolean;
  isLandscape: boolean;
  floraLoaded: boolean;
  isLoading?: boolean; // Add new prop for loading state
  loadingProgress?: number; // Add new prop for loading progress
  startGame: () => void;
  setShowAboutModal: (show: boolean) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  gameStarted,
  isLandscape,
  floraLoaded,
  isLoading = false, // Default to false
  loadingProgress = 0, // Default to 0
  startGame,
  setShowAboutModal
}) => {
  const landscapePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
// In src/components/GameUI/WelcomeScreen.tsx, update the animation function
// to match the in-game fish position and particles exactly

useEffect(() => {
  if (gameStarted || !isLandscape || !landscapePreviewCanvasRef.current) return;
  
  const canvas = landscapePreviewCanvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const updateCanvasSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  
  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);
  
  // Import the same fish image used in the game
  const fishImage = new Image();
  fishImage.src = '/sprites/cvcheFish.png';
  
  // Recreate the same particles as in-game
  const particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    opacity: number;
  }[] = [];
  
  // Create particles that match the game trail
  const createSwimParticles = (x: number, y: number) => {
    // Match the game's createSwimParticles function
    const fishCenterX = x + 50; // x position + player.width
    const fishCenterY = y + 15; // y position + player.height / 2
    const tailX = fishCenterX - 50; // fishCenterX - player.width
    
    for (let i = 0; i < 1; i++) {
      particles.push({
        x: tailX + (Math.random() - 0.5) * 10,
        y: fishCenterY + (Math.random() - 0.5) * 10,
        vx: -2 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1.0,
        color: '#FFD700', // Starting color, matching the initial streak color
        size: 4 + Math.random() * 3,
        opacity: 0.8
      });
    }
  };
  
  // Update and draw particles just like in the game
  const updateAndDrawParticles = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Update life and opacity
      p.life -= 0.02;
      p.opacity *= 0.97;
      
      // Remove dead particles
      if (p.life <= 0) { 
        particles.splice(i, 1); 
        continue; 
      }
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      const opacityHex = Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = `${p.color}${opacityHex}`;
      ctx.fill();
    }
  };
  
  let animFrameId: number;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Use actual level 1 yellow background
    ctx.fillStyle = "#FDF200";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle wave patterns
    ctx.save();
    ctx.strokeStyle = 'rgba(253,242,0,0.4)';
    ctx.lineWidth = 2;
    const time = Date.now() / 1000;
    
    // Draw wave pattern similar to in-game
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const offset = i * 50;
      const timeOffset = time + (i * 0.5);
      
      for (let x = 0; x < canvas.width; x += 5) {
        const frequency = 4 + Math.sin(timeOffset) * 2;
        const y = canvas.height - 100 + Math.sin((x / canvas.width * frequency * Math.PI) + timeOffset + offset) * 30;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    
    // Draw fish animation using the same style as in-game
    if (fishImage.complete) {
      // Position fish on the left side just like in-game (default x position is 100)
      const x = 100;
      const y = canvas.height / 2 + Math.sin(time * 2) * 20;
      
      // Create swim particles at a rate matching the game
      if (Math.random() < 0.3) {
        createSwimParticles(x, y);
      }
      
      // Update and draw particles
      updateAndDrawParticles();
      
      // Use the same fish drawing approach as in-game
      ctx.save();
      
      // Calculate dimensions preserving aspect ratio like in the game
      const fishWidth = 50 * 1.25; // Same as in drawPlayer function
      const aspect = fishImage.naturalWidth / fishImage.naturalHeight;
      const fishHeight = fishWidth / aspect;
      
      // Position at center of fish for rotation
      const centerX = x + 25; // x + width/2
      const centerY = y + 15; // y + height/2
      ctx.translate(centerX, centerY);
      
      // Apply gentle swimming rotation
      const rotation = Math.sin(time * 2) * 0.1;
      ctx.rotate(rotation);
      
      // Draw fish image with same offset as in the game
      ctx.drawImage(fishImage, -fishWidth / 2 + 20, -fishHeight / 2, fishWidth, fishHeight);
      
      ctx.restore();
    }
    
    animFrameId = requestAnimationFrame(animate);
  };
  
  animate();
  
  return () => {
    cancelAnimationFrame(animFrameId);
    window.removeEventListener('resize', updateCanvasSize);
  };
}, [gameStarted, isLandscape]);
  
  if (gameStarted || !isLandscape) return null;
  
  return (
    <>
      <canvas
        ref={landscapePreviewCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 2,
          display: 'block'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50dvh',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          textAlign: 'center',
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 'bold', color: '#000' }}>CVCHE</h1>
        <nav
          style={{
            display: 'flex',
            gap: '2rem',
            fontSize: '1.2rem',
            color: '#000',
          }}
        >
          <a 
            href="https://vyd.co/WelcomeToCvche" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ textDecoration: 'underline', color: '#000' }}
          >
            Music
          </a>
          <a 
            href="https://www.instagram.com/cvche" 
            style={{ textDecoration: 'underline', color: '#000' }}
          >
            Socials
          </a>
          <span 
            onClick={() => setShowAboutModal(true)} 
            style={{ textDecoration: 'underline', cursor: 'pointer', color: '#000' }}
          >
            About
          </span>
        </nav>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '20px', 
            color: '#000' 
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>
              Loading...{Math.round(loadingProgress)}%
            </div>
            <div style={{
              width: '240px',
              height: '10px',
              backgroundColor: '#ddd',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                backgroundColor: '#0066FF',
                transition: 'width 0.3s ease-in-out'
              }}></div>
            </div>
          </div>
        ) : !floraLoaded ? (
          <div style={{ padding: '20px 60px', fontSize: '24px', color: '#000' }}>
            Loading...
          </div>
        ) : (
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
              transition: 'transform 0.2s',
              background: '#0066FF',
            }}
          >
            Play Music
          </button>
        )}
      </div>
    </>
  );
};

export default WelcomeScreen;
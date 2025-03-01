import React, { useRef, useEffect } from 'react';

interface WelcomeScreenProps {
  gameStarted: boolean;
  isLandscape: boolean;
  floraLoaded: boolean;
  startGame: () => void;
  setShowAboutModal: (show: boolean) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  gameStarted,
  isLandscape,
  floraLoaded,
  startGame,
  setShowAboutModal
}) => {
  const landscapePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Set up landscape preview animation
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
    
    // Simplified preview animation - would need access to the actual fish animation code
    let animFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Simple moving gradient background
      const time = Date.now() / 3000;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `hsl(${(time * 100) % 360}, 70%, 60%)`);
      gradient.addColorStop(1, `hsl(${(time * 100 + 180) % 360}, 70%, 60%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Simple bouncing "fish" placeholder
      ctx.fillStyle = 'white';
      const x = canvas.width * 0.3;
      const y = canvas.height * 0.5 + Math.sin(Date.now() / 500) * 50;
      ctx.beginPath();
      ctx.ellipse(x, y, 40, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Bubbles
      for (let i = 0; i < 5; i++) {
        const bubbleX = x - 40 + Math.sin(Date.now() / 300 + i) * 20;
        const bubbleY = y + Math.cos(Date.now() / 400 + i) * 20;
        const size = 3 + Math.sin(Date.now() / 200 + i * 2) * 2;
        
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
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
        {!floraLoaded ? (
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
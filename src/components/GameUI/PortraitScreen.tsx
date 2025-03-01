import React, { useRef, useEffect } from 'react';

interface PortraitScreenProps {
  isPortrait: boolean;
  gameStarted: boolean;
  isPaused: boolean;
  setShowAboutModal: (show: boolean) => void;
  animatePortrait: (ctx: CanvasRenderingContext2D) => void;
}

const PortraitScreen: React.FC<PortraitScreenProps> = ({ 
  isPortrait, 
  gameStarted, 
  isPaused, 
  setShowAboutModal,
  animatePortrait 
}) => {
  const portraitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Start portrait animation when in portrait mode
  useEffect(() => {
    if (portraitCanvasRef.current && isPortrait) {
      const ctx = portraitCanvasRef.current.getContext('2d');
      if (ctx) {
        portraitCanvasRef.current.width = window.innerWidth;
        portraitCanvasRef.current.height = window.innerHeight;
        
        let animationFrameId: number;
        const animate = () => {
          animatePortrait(ctx);
          animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
          cancelAnimationFrame(animationFrameId);
        };
      }
    }
  }, [isPortrait, animatePortrait]);
  
  if (!isPortrait) return null;
  
  const showWhenPaused = isPaused && gameStarted;
  
  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        height: '100%', 
        width: '100%', 
        background: 'black', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 100 
      }}
    >
      <canvas
        ref={portraitCanvasRef}
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
        color: '#FDEE03', 
        zIndex: 101 
      }}>
        CVCHE
      </h1>
      
      <div style={{ 
        fontSize: '1.2rem', 
        color: '#ED1D24', 
        zIndex: 101, 
        padding: '20px', 
        textAlign: 'center' 
      }}>
        Please rotate your device to <strong>landscape</strong> to {showWhenPaused ? 'resume' : 'play'} this game.
      </div>
      
      <nav style={{ 
        marginTop: '2rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem', 
        fontSize: '1.2rem', 
        zIndex: 101 
      }}>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <a 
            href="https://vyd.co/WelcomeToCvche" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#FDEE03' }}
          >
            Music
          </a>
          <a 
            href="https://www.instagram.com/cvche" 
            style={{ color: '#FDEE03' }}
          >
            Socials
          </a>
          <button 
            onClick={() => setShowAboutModal(true)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#FDEE03', 
              fontSize: 'inherit', 
              cursor: 'pointer', 
              padding: '0' 
            }}
          >
            About
          </button>
        </div>
      </nav>
    </div>
  );
};

export default PortraitScreen;
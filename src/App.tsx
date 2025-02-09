// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css'; // Ensure you have some basic styles if needed.
import MusicReactiveOceanGame from './MusicReactiveOceanGame';

const App: React.FC = () => {
  const [isLandscape, setIsLandscape] = useState(true);

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

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      fontFamily: 'Orbitron, sans-serif'
    }}>
      {!isLandscape && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            fontSize: '1.5rem',
            flexDirection: 'column',
            gap: '2rem',
            padding: '2rem',
          }}
        >
          <img 
            src="/sprites/cvcheFish.webp" 
            alt="CVCHE Fish" 
            style={{ 
              width: '150px',
              height: 'auto',
              marginBottom: '1rem'
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
            Please rotate your device to <strong>landscape</strong> to play the game.
          </div>
          <nav style={{ 
            marginTop: '2rem',
            display: 'flex',
            gap: '2rem',
            fontSize: '1.2rem'
          }}>
            <a href="#music" style={{ color: '#FDEE03' }}>Music</a>
            <a href="#socials" style={{ color: '#FDEE03' }}>Socials</a>
            <a href="#merch" style={{ color: '#FDEE03' }}>Merch</a>
          </nav>
        </div>
      )}
      {isLandscape && <MusicReactiveOceanGame />}
    </div>
  );
};

export default App;

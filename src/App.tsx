// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css'; // Ensure you have some basic styles if needed.
import MusicReactiveOceanGame from './MusicReactiveOceanGame';

const App: React.FC = () => {
  const [isLandscape, setIsLandscape] = useState(true);

  // Check device orientation: landscape if window.innerWidth > window.innerHeight
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', checkOrientation);
    checkOrientation(); // Initial check

    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {!isLandscape && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#fff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            fontSize: '1.5rem',
          }}
        >
          Please rotate your device to <strong>landscape</strong> to play the game.
        </div>
      )}
      {isLandscape && <MusicReactiveOceanGame />}
    </div>
  );
};

export default App;

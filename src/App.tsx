// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import MusicReactiveOceanGame from './MusicReactiveOceanGame';
import UnderwaterTinyWingsGame from './UnderwaterTinyWingsGame';
import UnderwaterDoodleJump from './UnderwaterDoodleJumpGame';

const App: React.FC = () => {
  const [selectedGame] = useState('ocean');
  const [isPlaying, setIsPlaying] = useState(false);

  // Prevent pull-to-refresh and other touch gestures
  useEffect(() => {
    console.log('App mounted, isPlaying:', isPlaying);
    document.body.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    return () => {
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
      {selectedGame === 'ocean' && <MusicReactiveOceanGame onGameStart={() => setIsPlaying(true)} />}
      {selectedGame === 'wings' && <UnderwaterTinyWingsGame onGameStart={() => setIsPlaying(true)} />}
      {selectedGame === 'doodle' && <UnderwaterDoodleJump onGameStart={() => setIsPlaying(true)} />}
    </div>
  );
};

export default App;

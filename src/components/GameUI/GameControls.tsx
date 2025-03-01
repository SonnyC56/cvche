import React from 'react';
import ProgressBar from './ProgressBar';

interface GameControlsProps {
  gameStarted: boolean;
  isPaused: boolean;
  togglePause: () => void;
  currentLevel: { highScore?: number };
  score: number;
  audioProgress: number;
  currentTime: number;
  duration: number;
}

const GameControls: React.FC<GameControlsProps> = ({
  gameStarted,
  isPaused,
  togglePause,
  currentLevel,
  score,
  audioProgress,
  currentTime,
  duration
}) => {
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      right: 0,
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      zIndex: 10,
      color: '#fff',
      justifyContent: 'space-between',
      fontFamily: 'Orbitron, sans-serif'
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
              borderRadius: '4px' 
            }}
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
        )}
        <div style={{ whiteSpace: 'nowrap' }}>High Score: {currentLevel.highScore || 0}</div>
        <div style={{ whiteSpace: 'nowrap' }}>Score: {score}</div>
        {gameStarted && (
          <a 
            href="https://open.spotify.com/album/3nDX07NcGIyEeFtZIep9NB" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              background: '#1DB954', 
              padding: '5px 10px', 
              borderRadius: '4px', 
              color: '#fff', 
              textDecoration: 'none' 
            }}
          >
            Spotify
          </a>
        )}
      </div>
      
      {gameStarted && (
        <ProgressBar 
          audioProgress={audioProgress} 
          currentTime={currentTime} 
          duration={duration} 
        />
      )}
    </div>
  );
};

export default GameControls;
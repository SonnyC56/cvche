import React from 'react';
import { Level } from '../../types';

interface PauseScreenProps {
  isPaused: boolean;
  levelEnded: boolean;
  isLandscape: boolean;
  currentLevel: Level;
  pendingLevel: Level | null;
  levels: Level[];
  togglePause: () => void;
  setPendingLevel: (level: Level | null) => void;
  selectLevel: (level: Level) => void;
  restartGameLoop: () => void; // <-- Added prop
}

const PauseScreen: React.FC<PauseScreenProps> = ({
  isPaused,
  levelEnded,
  isLandscape,
  currentLevel,
  pendingLevel,
  levels,
  togglePause,
  setPendingLevel,
  selectLevel,
  restartGameLoop // <-- Destructure new prop
}) => {
  if (!isPaused || levelEnded || !isLandscape) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 35,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      fontFamily: 'Orbitron, sans-serif',
      color: '#fff'
    }}>
      <div style={{ fontSize: '48px' }}>Paused</div>
      <div style={{ fontSize: '24px' }}>High Score: {currentLevel.highScore || 0}</div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {pendingLevel && pendingLevel.id !== currentLevel.id ? (
          <button
            onClick={() => {
              selectLevel(pendingLevel);
              setPendingLevel(null);
              togglePause();
              restartGameLoop(); // <-- Restart game loop after level switch
            }}
            style={{
              padding: '10px 20px',
              fontSize: '20px',
              cursor: 'pointer',
              backgroundColor: '#0066FF',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          >
            Play
          </button>
        ) : (
          <button
            onClick={togglePause}
            style={{
              padding: '10px 20px',
              fontSize: '20px',
              cursor: 'pointer',
              backgroundColor: '#0066FF',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          >
            Resume
          </button>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        overflowX: 'auto',
        padding: '0 10px',
        width: '100%',
        justifyContent: 'space-evenly',
      }}>
        {levels.map((level) => {
          const isSelected = pendingLevel ? pendingLevel.id === level.id : currentLevel.id === level.id;
          return (
            <button
              key={level.id}
              onClick={() => setPendingLevel(level)}
              disabled={!level.unlocked}
              style={{
                margin: '10px',
                padding: '10px 20px',
                minWidth: '180px',
                fontSize: '16px',
                borderRadius: '8px',
                border: isSelected ? '2px solid #fff' : 'none',
                cursor: level.unlocked ? 'pointer' : 'not-allowed',
                backgroundColor: isSelected ? '#0066FF' : 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
                opacity: level.unlocked ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, opacity 0.2s',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>LVL {level.id}</span>
                <span style={{ fontSize: '14px' }}>{level.title}</span>
              </div>
              {!level.unlocked && (
                <span style={{ fontSize: '12px' }}>🔒</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PauseScreen;

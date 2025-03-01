import React from 'react';
import { Level } from '../../types';

interface LevelSelectorProps {
  levels: Level[];
  currentLevel: Level;
  selectLevel: (level: Level) => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ levels, currentLevel, selectLevel }) => {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      justifyContent: 'center',
      padding: '1rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {levels.map(level => (
        <button
          key={level.id}
          onClick={() => level.unlocked && selectLevel(level)}
          disabled={!level.unlocked}
          style={{
            padding: '1rem',
            minWidth: '12rem',
            background: level.id === currentLevel.id ? '#0066FF' : 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            border: level.id === currentLevel.id ? '2px solid white' : '2px solid transparent',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontFamily: 'Orbitron, sans-serif',
            cursor: level.unlocked ? 'pointer' : 'not-allowed',
            opacity: level.unlocked ? 1 : 0.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'transform 0.2s, opacity 0.2s',
            transform: level.id === currentLevel.id ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <div style={{ fontWeight: 'bold' }}>Level {level.id}</div>
          <div>{level.title}</div>
          {level.highScore !== undefined && level.highScore > 0 && (
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              High Score: {level.highScore}
            </div>
          )}
          {!level.unlocked && <div>🔒</div>}
        </button>
      ))}
    </div>
  );
};

export default LevelSelector;
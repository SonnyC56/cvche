import React from 'react';
import { Level, GameState } from '../../types';

interface LevelCompleteScreenProps {
  levelEnded: boolean;
  health: number;
  score: number;
  gameState: GameState;
  levels: Level[];
  currentLevel: Level;
  selectLevel: (level: Level) => void;
  setLevelEnded: (ended: boolean) => void;
  setGameStarted: (started: boolean) => void;
  restartGameLoop: () => void; // Add new prop for restarting the game loop
}

const LevelCompleteScreen: React.FC<LevelCompleteScreenProps> = ({
  levelEnded,
  health,
  score,
  gameState,
  levels,
  currentLevel,
  selectLevel,
  setLevelEnded,
  setGameStarted,
  restartGameLoop // Destructure the new prop
}) => {
  if (!levelEnded) return null;
  
  const isGameOver = health <= 0;
  const nextLevel = levels.find(l => l.id === currentLevel.id + 1);
  
  const restartGame = () => {
    window.location.reload();
  };
  
  const startNextLevel = () => {
    if (nextLevel && nextLevel.unlocked) {
      selectLevel(nextLevel);
      setLevelEnded(false);
      setGameStarted(true);
      // Restart the game loop to ensure rendering continues
      restartGameLoop();
    }
  };
  
  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        color: '#fff', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 30, 
        fontFamily: 'Orbitron, sans-serif' 
      }}
    >
      <h1 style={{ marginTop: 0, fontSize: '48px', marginBottom: '20px' }}>
        {isGameOver ? 'Game Over!' : 'Level Complete!'}
      </h1>
      
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>
        Final Score: {score}
      </div>
      
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>
        Highest Streak: {gameState.highestStreak}
      </div>
      
      <div style={{ fontSize: '24px', marginBottom: '20px' }}>
        Trash Collected: {gameState.trashStats.collected} / {gameState.trashStats.totalSpawned} (
        {gameState.trashStats.totalSpawned > 0
          ? Math.round((gameState.trashStats.collected / gameState.trashStats.totalSpawned) * 100)
          : 0}%
        )
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => window.open('https://urnowhere.notion.site/19f92b5e7a6e80389c83fbc8d454c548', '_blank')}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            backgroundColor: '#0066FF', 
            border: 'none', 
            borderRadius: '4px', 
            color: '#fff' 
          }}
        >
          Sign Up for Updates
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <button 
          onClick={restartGame} 
          style={{ 
            padding: '15px 30px', 
            fontSize: '20px', 
            cursor: 'pointer', 
            backgroundColor: '#444', 
            border: 'none', 
            borderRadius: '8px', 
            color: '#fff' 
          }}
        >
          Play Again
        </button>
        
        {nextLevel && nextLevel.unlocked && (
          <button 
            onClick={startNextLevel} 
            style={{ 
              padding: '15px 30px', 
              fontSize: '20px', 
              cursor: 'pointer', 
              backgroundColor: '#0066FF', 
              border: 'none', 
              borderRadius: '8px', 
              color: '#fff' 
            }}
          >
            Next Level
          </button>
        )}
      </div>
    </div>
  );
};

export default LevelCompleteScreen;
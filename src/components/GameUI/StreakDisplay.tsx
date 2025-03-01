import React from 'react';
import { getParticleColorFromStreak } from '../../utils/colorUtils';

interface StreakDisplayProps {
  streak: number;
  multiplier: number;
  scale: number;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak, multiplier, scale }) => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '60px', 
      right: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'flex-end', 
      gap: '5px', 
      zIndex: 10, 
      fontFamily: 'Orbitron, sans-serif'
    }}>
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.5)', 
        padding: '10px 20px', 
        borderRadius: '8px', 
        transform: `scale(${scale})`, 
        transition: 'transform 0.1s ease-out', 
        fontFamily: 'Orbitron, sans-serif' 
      }}>
        <div style={{ 
          color: getParticleColorFromStreak(streak), 
          fontSize: '24px', 
          fontWeight: 'bold', 
          textShadow: '0 0 10px rgba(255,255,255,0.3)', 
          transition: 'color 0.3s', 
          fontFamily: 'Orbitron, sans-serif' 
        }}>
          {streak} STREAK
        </div>
        <div style={{ 
          color: '#fff', 
          fontSize: '18px', 
          opacity: 0.8, 
          fontFamily: 'Orbitron, sans-serif' 
        }}>
          {multiplier}x MULTIPLIER
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;
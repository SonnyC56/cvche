import React from 'react';
import { getHealthBarColor } from '../../utils/colorUtils';

interface HealthBarProps {
  health: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ health }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      left: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 10
    }}>
      <div style={{
        width: '200px',
        height: '20px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${health}%`,
          height: '100%',
          backgroundColor: getHealthBarColor(health),
          transition: 'width 0.3s ease-out'
        }} />
      </div>
      <span style={{
        color: 'white',
        fontSize: '16px',
        fontFamily: 'Orbitron, sans-serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        Health
      </span>
    </div>
  );
};

export default HealthBar;
import React from 'react';
import { formatTime } from '../../utils/colorUtils';

interface ProgressBarProps {
  audioProgress: number;
  currentTime: number;
  duration: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ audioProgress, currentTime, duration }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      flex: 1, 
      width: '100%', 
      paddingLeft: '20px' 
    }}>
      <div style={{ 
        flex: 1, 
        height: '4px', 
        background: 'rgba(255, 255, 255, 0.2)', 
        borderRadius: '2px', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          width: `${audioProgress}%`, 
          height: '100%', 
          background: '#0066FF', 
          transition: 'width 0.1s linear' 
        }} />
      </div>
      <div style={{ fontSize: '14px' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

export default ProgressBar;
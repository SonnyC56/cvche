// filepath: /Users/sonnycirasuolo/cvche/src/components/GameUI/LoadingScreen.tsx
import React from 'react';

interface LoadingScreenProps {
  progress: number; // Percentage 0-100
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <div style={{
      position: 'fixed', // Use fixed to cover the whole viewport
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column', // Stack text and bar vertically
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.85)', // Dark semi-transparent background
      zIndex: 1000, // Ensure it's on top
      color: 'white',
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '24px',
      textAlign: 'center'
    }}>
      <p>Loading Assets...</p>
      <div style={{
        width: '80%',
        maxWidth: '400px',
        height: '20px',
        backgroundColor: '#555',
        borderRadius: '10px',
        overflow: 'hidden',
        marginTop: '10px'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#4CAF50', // Green progress bar
          transition: 'width 0.3s ease-in-out' // Smooth transition
        }} />
      </div>
      <p>{progress}%</p>
    </div>
  );
};

export default LoadingScreen;

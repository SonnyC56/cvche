import React from 'react';

interface AboutModalProps {
  showAboutModal: boolean;
  setShowAboutModal: (show: boolean) => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ showAboutModal, setShowAboutModal }) => {
  if (!showAboutModal) return null;
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      // Stop touch events from bubbling to underlying game elements
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: '80%',
          maxWidth: '500px',
          height: '80vh', // explicit height for scrolling
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '1rem',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          padding: '2rem',
          color: 'white',
          textAlign: 'center',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'auto'
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#FDF200' }}>
          CVCHE - MEET THE TRAILBLAZERS OF RURAL CANADIAN TECHNO
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          We are very excited to begin to share with you the vast catalog of our upcoming LP, 'Get Fluffy'.
        </p>
        <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Over the next few months we'll be releasing more and more songs to please your ears until the album comes out in full. So put on ur socks, find a waxed floor to dance on and enjoy! Rural Canadian Techno 4evur!
        </p>
        <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          We live in a Tiny Sovereign Nation, on an island between two forks of a river.
        </p>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() =>
              window.open(
                'https://urnowhere.notion.site/19f92b5e7a6e80389c83fbc8d454c548',
                '_blank'
              )
            }
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              backgroundColor: '#FDF200',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: 'black',
              fontFamily: 'Orbitron, sans-serif',
              marginBottom: '1rem'
            }}
          >
            Sign Up for Updates
          </button>
        </div>
        <button
          onClick={() => setShowAboutModal(false)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: 'transparent',
            border: '2px solid white',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            color: 'white',
            fontFamily: 'Orbitron, sans-serif'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AboutModal;
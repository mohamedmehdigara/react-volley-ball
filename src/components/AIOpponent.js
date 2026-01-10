import React from 'react';

/**
 * AIOpponent Component
 * * Common Pitfall: If 'position' or 'stats' are undefined during the 
 * first frame, calling position.y.toFixed() will crash the app.
 */
const AIOpponent = ({ position, difficulty = 'Medium' }) => {
  // 1. Defensive check: If props aren't ready, render a placeholder or null
  if (!position) {
    return null; 
  }

  // 2. Use optional chaining or defaults for numerical operations
  const displayY = typeof position.y === 'number' ? position.y.toFixed(0) : '0';

  return (
    <div 
      style={{
        position: 'absolute',
        left: '95%',
        top: `${position.y}%`,
        transform: 'translateY(-50%)',
        width: '15px',
        height: '80px',
        backgroundColor: '#ff4d4d',
        borderRadius: '4px',
        transition: 'top 0.1s linear',
        boxShadow: '0 0 15px rgba(255, 77, 77, 0.5)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-25px',
        width: '100px',
        fontSize: '10px',
        color: 'white',
        textAlign: 'center',
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        AI ({difficulty}): {displayY}
      </div>
    </div>
  );
};

export default AIOpponent;
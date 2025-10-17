import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const jumpAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-50px); } /* Player jumps 50px */
  100% { transform: translateY(0); }
`;

const PlayerBody = styled.div`
  width: 30px;
  height: ${(props) => props.paddleHeight}px;
  background-color: ${(props) => (props.isFlashing ? '#f0f0f0' : '#d81b60')};
  border-radius: 5px;
  position: absolute;
  /* Use props for X position */
  left: ${(props) => props.positionX}px; 
  /* Fixed Y position at the bottom of the court */
  top: ${(props) => props.positionY}px;
  
  transition: background-color 0.05s ease-in-out, transform 0.2s ease-out;
  
  /* Apply jump animation */
  ${(props) => props.isJumping && `animation: ${jumpAnimation} 0.4s ease-out;`}
`;

const Player = ({ courtWidth, courtHeight, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, isFlashing, onServe }) => {
  const lateralSpeed = 10;
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Lateral Movement (Left/Right)
      if (event.key === 'ArrowLeft') {
        onPlayerMoveX((prevX) => Math.max(0, prevX - lateralSpeed));
      } else if (event.key === 'ArrowRight') {
        // Restrict Player 1 to the left side of the court
        onPlayerMoveX((prevX) => Math.min(courtWidth - 30, prevX + lateralSpeed));
      }

      // 2. Jump/Hit (Up/Space)
      if ((event.key === 'ArrowUp' || event.key === ' ') && !isJumping) {
        setIsJumping(true);
        onServe(); // Attempt to serve on first press
        setTimeout(() => setIsJumping(false), 400); // Reset jump after animation time
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayerMoveX, isJumping, onServe, lateralSpeed, courtWidth]);

  return (
    <PlayerBody 
      positionX={positionX} 
      positionY={positionY} 
      paddleHeight={paddleHeight} 
      isFlashing={isFlashing} 
      isJumping={isJumping}
    />
  );
};

export default Player;
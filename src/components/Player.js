// src/components/Player.js

import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

const jumpAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-50px); } 
  100% { transform: translateY(0); }
`;

const PlayerBody = styled.div`
  width: 30px;
  height: ${(props) => props.paddleHeight}px;
  background-color: ${(props) => (props.isFlashing ? '#f0f0f0' : '#d81b60')};
  border-radius: 5px;
  position: absolute;
  left: ${(props) => props.positionX}px; 
  top: ${(props) => props.positionY}px;
  
  transition: background-color 0.05s ease-in-out, transform 0.2s ease-out;
  
  ${(props) => props.isJumping && css`
    animation: ${jumpAnimation} 0.4s ease-out;
  `}
`;

const Player = ({ courtWidth, onPlayerMoveX, paddleHeight, positionX, positionY, isFlashing, onServe }) => {
  const lateralSpeed = 10;
  const paddleWidth = 30;
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Lateral Movement (Left/Right)
      if (event.key === 'ArrowLeft') {
        onPlayerMoveX((prevX) => Math.max(0, prevX - lateralSpeed));
      } else if (event.key === 'ArrowRight') {
        onPlayerMoveX((prevX) => Math.min(courtWidth / 2 - paddleWidth, prevX + lateralSpeed));
      }

      // 2. Jump/Hit (Up/Space)
      if ((event.key === 'ArrowUp' || event.key === ' ') && !isJumping) {
        setIsJumping(true);
        
        // Call onServe: If the ball is stopped, it launches. 
        // If the ball is moving, it just triggers the jump animation.
        onServe(); 
        
        // The actual 'hit' physics is handled by Ball.js when the paddle's position (now jumping) 
        // collides with the moving ball.
        
        setTimeout(() => setIsJumping(false), 400); // Reset jump after animation time
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayerMoveX, isJumping, onServe, lateralSpeed, courtWidth, paddleWidth]);

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
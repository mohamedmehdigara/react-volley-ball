import React, { useEffect } from 'react';
import styled from 'styled-components';

const PADDLE_WIDTH = 30; // Define constant outside component

const OpponentBody = styled.div`
  width: ${PADDLE_WIDTH}px;
  height: ${(props) => props.paddleHeight}px;
  background-color: ${(props) => (props.isFlashing ? '#f0f0f0' : '#4a148c')};
  border-radius: 5px;
  position: absolute;
  left: ${(props) => props.positionX}px; 
  top: ${(props) => props.positionY}px;
  transition: background-color 0.05s ease-in-out;
`;

const AIOpponent = ({ courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty, isFlashing }) => {
  
  useEffect(() => {
    // Determine AI speed and delay based on difficulty
    const { speed: aiSpeed, delay: aiDelay } = (() => {
      switch (difficulty) {
        case 'easy': return { speed: 3, delay: 100 };
        case 'hard': return { speed: 7, delay: 20 };
        default: return { speed: 5, delay: 50 };
      }
    })();

    const followBall = () => {
      // Only track ball if it has been served and is on the AI's side (right half)
      if (!ballState.isServed || ballState.position.left < courtWidth / 2) return;

      const targetX = ballState.position.left - PADDLE_WIDTH / 2;
      const currentX = positionX;
      const courtHalf = courtWidth / 2;

      // 1. Lateral Movement (Horizontal)
      if (targetX < currentX - 10) { // Tolerance of 10px
        onPlayerMoveX((prevX) => Math.max(courtHalf, prevX - aiSpeed));
      } else if (targetX > currentX + 10) {
        onPlayerMoveX((prevX) => Math.min(courtWidth - PADDLE_WIDTH, prevX + aiSpeed));
      }
      
      // 2. Vertical Jump/Block Logic (simplified)
      const baseLineY = courtHeight - paddleHeight;
      if (ballState.position.top > baseLineY - 50 && ballState.direction.x < 0) {
        // Jump only if the ball is within hitting range and moving towards the AI
        onPlayerMoveY(baseLineY - 50);
        setTimeout(() => onPlayerMoveY(baseLineY), 200); // Reset jump
      }
    };

    const timeoutId = setTimeout(followBall, aiDelay);
    return () => clearTimeout(timeoutId);
  }, [ballState, positionX, positionY, courtWidth, paddleHeight, difficulty, onPlayerMoveX, onPlayerMoveY]);

  return (
    <OpponentBody 
      positionX={positionX} 
      positionY={positionY} 
      paddleHeight={paddleHeight} 
      isFlashing={isFlashing}
    />
  );
};

export default AIOpponent;
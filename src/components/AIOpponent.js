// src/components/AIOpponent.js

import React, { useEffect } from 'react';
import styled from 'styled-components';

const PADDLE_WIDTH = 30; 

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

const AIOpponent = ({ courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty }) => {
  
  useEffect(() => {
    const { speed: aiSpeed, delay: aiDelay } = (() => {
      switch (difficulty) {
        case 'easy': return { speed: 3, delay: 100 };
        case 'hard': return { speed: 7, delay: 20 };
        default: return { speed: 5, delay: 50 };
      }
    })();

    const followBall = () => {
      const COURT_MID = courtWidth / 2;
      const baseLineY = courtHeight - paddleHeight;
      
      // AI only tracks if ball is served AND is on the AI's side or near the net
      if (!ballState.isServed || ballState.position.left < COURT_MID - PADDLE_WIDTH) return;

      const targetX = ballState.position.left - PADDLE_WIDTH / 2;
      const currentX = positionX;

      // 1. Lateral Movement (Horizontal)
      if (targetX < currentX - 10) { 
        // Cannot move left past the net (COURT_MID)
        onPlayerMoveX((prevX) => Math.max(COURT_MID, prevX - aiSpeed));
      } else if (targetX > currentX + 10) {
        // Cannot move right past the edge
        onPlayerMoveX((prevX) => Math.min(courtWidth - PADDLE_WIDTH, prevX + aiSpeed));
      }
      
      // 2. Vertical Jump/Block Logic
      // Check if ball is low (hitting range) and coming towards AI (dir.x < 0)
      if (ballState.position.top > baseLineY - 50 && ballState.direction.x < 0) {
        // Move paddle up to simulate jump/block
        onPlayerMoveY(baseLineY - 50);
        setTimeout(() => onPlayerMoveY(baseLineY), 200); // Reset jump
      }
    };

    const timeoutId = setTimeout(followBall, aiDelay);
    return () => clearTimeout(timeoutId);
  }, [ballState, positionX, positionY, courtWidth, paddleHeight, difficulty, onPlayerMoveX, onPlayerMoveY, courtHeight]);

  return (
    <OpponentBody 
      positionX={positionX} 
      positionY={positionY} 
      paddleHeight={paddleHeight} 
    />
  );
};

export default AIOpponent;
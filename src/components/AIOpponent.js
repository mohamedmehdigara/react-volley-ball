// src/components/AIOpponent.js (Ensure logic is gated by ballState.isServed)

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const PADDLE_WIDTH = 30; 
const JUMP_HEIGHT = 50; 

const OpponentBody = styled.div`
  width: ${PADDLE_WIDTH}px;
  height: ${(props) => props.paddleHeight}px;
  background-color: ${(props) => (props.isFlashing ? '#f0f0f0' : '#4a148c')};
  border-radius: 5px;
  position: absolute;
  left: ${(props) => props.positionX}px; 
  top: ${(props) => props.positionY}px;
  transition: background-color 0.05s ease-in-out, left 0.1s linear, top 0.1s linear;
`;

const AIOpponent = ({ courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty, isFlashing, netTop }) => {
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    // 1. Difficulty Settings
    const { speed: aiSpeed, jumpThreshold } = (() => {
      switch (difficulty) {
        case 'easy': return { speed: 3, jumpThreshold: 0.2 };
        case 'hard': return { speed: 7, jumpThreshold: 0.8 };
        default: return { speed: 5, jumpThreshold: 0.5 };
      }
    })();

    const COURT_MID = courtWidth / 2;
    const baseLineY = courtHeight - paddleHeight;
    const updateRate = 16; 

    const tickAI = () => {
        // FIX: AI should not move or launch anything if the ball is not served.
        if (!ballState.isServed) return;
        
        // 2. Lateral Movement (Horizontal Tracking)
        const targetX = ballState.position.left - PADDLE_WIDTH / 2;
        const currentX = positionX;
        
        // Check if ball is on the AI's side or slightly over the net
        if (ballState.position.left >= COURT_MID - PADDLE_WIDTH / 2) {
            if (targetX < currentX - 5) { 
              onPlayerMoveX((prevX) => Math.max(COURT_MID, prevX - aiSpeed));
            } else if (targetX > currentX + 5) {
              onPlayerMoveX((prevX) => Math.min(courtWidth - PADDLE_WIDTH, prevX + aiSpeed));
            }
        }

        // 3. Vertical Movement (Jumping/Blocking)
        const isBallHittable = ballState.position.top > netTop - JUMP_HEIGHT && ballState.position.top < baseLineY;

        if (ballState.direction.x < 0 && isBallHittable) {
            const shouldJump = Math.random() < jumpThreshold;
            const isBallAligned = Math.abs(ballState.position.left - currentX) < PADDLE_WIDTH + 10;
            
            if (shouldJump && !isJumping && isBallAligned) {
                setIsJumping(true);
                
                onPlayerMoveY(baseLineY - JUMP_HEIGHT);
                
                setTimeout(() => {
                    onPlayerMoveY(baseLineY);
                    setIsJumping(false);
                }, 400); 
            }
        }
    };
    
    // Start the continuous tick loop
    const intervalId = setInterval(tickAI, updateRate);
    
    return () => clearInterval(intervalId);

  }, [
      ballState.isServed, 
      ballState.position.left, 
      positionX, 
      onPlayerMoveX, 
      onPlayerMoveY, 
      courtWidth, 
      paddleHeight, 
      difficulty, 
      isJumping,
      netTop,
      courtHeight
  ]);


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
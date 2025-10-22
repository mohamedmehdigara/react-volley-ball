// src/components/AIOpponent.js (Corrected Initialization Order)

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

const AIOpponent = ({netTop, courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty, isFlashing }) => {
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
    const BALL_RADIUS = 10;
    
    // --- FIX: Define the function first ---
    const followBall = () => {
        // AI only runs when the ball is served
        if (!ballState.isServed) {
            // If not served, just schedule the next check and return
            const timeoutId = setTimeout(followBall, 16); 
            return () => clearTimeout(timeoutId);
        };
        
        // 2. Lateral Movement (Horizontal Tracking)
        const targetX = ballState.position.left - PADDLE_WIDTH / 2;
        const currentX = positionX;
        
        // Only track if the ball is on the AI's side (or slightly over the net)
        if (ballState.position.left >= COURT_MID - PADDLE_WIDTH / 2) {
            if (targetX < currentX - 5) { 
              // Move Left
              onPlayerMoveX((prevX) => Math.max(COURT_MID, prevX - aiSpeed));
            } else if (targetX > currentX + 5) {
              // Move Right
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
        
        // Schedule the next check
        const timeoutId = setTimeout(followBall, 16); 
        return () => clearTimeout(timeoutId);
    };
    // --- End of function definition ---
    
    // 4. Start the loop by calling the function
    const cleanUp = followBall();
    
    // This return cleans up the initial timeout (if it was set)
    return cleanUp;

  }, [ballState, positionX, positionY, courtWidth, courtHeight, paddleHeight, difficulty, onPlayerMoveX, onPlayerMoveY, isJumping]);


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
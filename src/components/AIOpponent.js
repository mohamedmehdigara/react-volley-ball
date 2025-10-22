// src/components/AIOpponent.js (IMPROVED AND ENHANCED)

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const PADDLE_WIDTH = 30; 
const PADDLE_HALF_WIDTH = PADDLE_WIDTH / 2;
const JUMP_HEIGHT = 50; 
const BALL_RADIUS = 10;
const G = 0.5 / 10; // Gravity constant used for simple trajectory prediction (from Ball.js)

const OpponentBody = styled.div`
  width: ${PADDLE_WIDTH}px;
  height: ${(props) => props.paddleHeight}px;
  background-color: ${(props) => (props.isFlashing ? '#f0f0f0' : '#4a148c')};
  border-radius: 5px;
  position: absolute;
  left: ${(props) => props.positionX}px; 
  top: ${(props) => props.positionY}px;
  /* Reduced transition time for a slightly faster, more responsive AI feel */
  transition: background-color 0.05s ease-in-out, left 0.05s linear, top 0.05s linear;
`;

const AIOpponent = ({ courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty, isFlashing, netTop }) => {
  const [isJumping, setIsJumping] = useState(false);

  // --- TRAJECTORY PREDICTION FUNCTION ---
  // A simplified physics calculation to predict the ball's X position at a certain Y height (e.g., baseline)
  const predictX = (ball) => {
    // If ball is moving toward the player (direction.x < 0)
    if (ball.direction.x < 0) {
      const targetY = courtHeight - BALL_RADIUS; // Aim for the floor/baseline
      
      // Calculate time (t) to reach targetY using vertical motion:
      // Equation: Δy = V_y * t + 0.5 * G * t^2
      // This is a quadratic equation, but a simplified approach for small jumps is:
      // Time to fall = sqrt(2 * Δy / G_effective)
      const dy = targetY - ball.position.top;
      // Use a safety check for G
      if (G === 0) return ball.position.left; 

      const t_vertical = (-ball.direction.y + Math.sqrt(ball.direction.y * ball.direction.y + 2 * G * dy)) / G;
      
      // Calculate horizontal position at that time:
      // Equation: X_final = X_initial + V_x * t
      const predictedX = ball.position.left + ball.direction.x * ball.speed * t_vertical;

      return predictedX;
    }
    return ball.position.left; // If moving away, just track current position
  };

  useEffect(() => {
    // 1. Difficulty Settings
    const { speed: maxSpeed, jumpThreshold, accuracy } = (() => {
      switch (difficulty) {
        case 'easy': return { speed: 3, jumpThreshold: 0.2, accuracy: 0.3 };
        case 'hard': return { speed: 8, jumpThreshold: 0.9, accuracy: 1.0 };
        default: return { speed: 5, jumpThreshold: 0.5, accuracy: 0.7 };
      }
    })();

    const COURT_MID = courtWidth / 2;
    const baseLineY = courtHeight - paddleHeight;
    const updateRate = 16; 

    const tickAI = () => {
        if (!ballState.isServed) return;
        
        // --- 2. Lateral Movement (Horizontal Tracking & Prediction) ---
        
        // 2a. Determine Target X
        let predictedTargetX = predictX(ballState);
        
        // Introduce controlled inaccuracy based on difficulty
        const maxInaccuracy = COURT_MID * (1 - accuracy);
        const inaccuracyOffset = (Math.random() - 0.5) * maxInaccuracy; // -1 to 1 * maxInaccuracy/2

        // The AI is primarily interested in the predicted landing spot if the ball is far away.
        const targetX = (predictedTargetX + inaccuracyOffset) - PADDLE_HALF_WIDTH;
        const currentX = positionX;
        
        // 2b. Calculate Movement
        const distanceToTarget = targetX - currentX;
        // Move amount is proportional to distance, capped by maxSpeed
        const moveAmount = Math.min(Math.abs(distanceToTarget), maxSpeed); 
        
        if (distanceToTarget > 5) { // Move Right
            const newX = currentX + moveAmount;
            // Clamp position between net and court edge
            onPlayerMoveX(Math.min(courtWidth - PADDLE_WIDTH, newX));
        } else if (distanceToTarget < -5) { // Move Left
            const newX = currentX - moveAmount;
            onPlayerMoveX(Math.max(COURT_MID, newX));
        }

        // --- 3. Vertical Movement (Jumping/Blocking) ---
        
        // Jump only if the ball is moving towards us AND it's high
        const isBallMovingToAI = ballState.direction.x < 0;
        
        // Hitting Zone 1: Ball high over the net (Spike/Block)
        const isBallNearNetAndHigh = ballState.position.left < COURT_MID + PADDLE_WIDTH && ballState.position.top < netTop + 20;

        // Hitting Zone 2: Ball approaching the baseline (Dig)
        const isBallNearBaseline = ballState.position.top > baseLineY - JUMP_HEIGHT;


        if (isBallMovingToAI && (isBallNearNetAndHigh || isBallNearBaseline)) {
            const shouldJump = Math.random() < jumpThreshold;
            // Alignment check: Is the paddle close enough horizontally to the ball's CURRENT position?
            const isBallAligned = Math.abs(ballState.position.left - (currentX + PADDLE_HALF_WIDTH)) < PADDLE_WIDTH;
            
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
    
    const intervalId = setInterval(tickAI, updateRate);
    
    return () => clearInterval(intervalId);

  }, [
      ballState.isServed, 
      ballState.position.left, 
      ballState.direction.x, // Added direction to dependency array for better logic sync
      ballState.direction.y, // Added direction to dependency array for prediction sync
      ballState.speed,       // Added speed to dependency array for prediction sync
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
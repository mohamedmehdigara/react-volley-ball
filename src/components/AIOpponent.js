// src/components/AIOpponent.js (ULTIMATE IMPROVED VERSION)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';

const PADDLE_WIDTH = 30; 
const PADDLE_HALF_WIDTH = PADDLE_WIDTH / 2;
const JUMP_HEIGHT = 50; 
const BALL_RADIUS = 10;
// CRITICAL: Ensure G is a constant, or passed as a prop from App.js where physics is defined.
// Using the provided value:
const G_EFFECTIVE = 0.5 / 10; 

const OpponentBody = styled.div`
  width: ${PADDLE_WIDTH}px;
  height: ${(props) => props.paddleHeight}px;
  background-color: ${(props) => (props.isFlashing ? '#f0f0f0' : '#4a148c')};
  border-radius: 5px;
  position: absolute;
  left: ${(props) => props.positionX}px; 
  top: ${(props) => props.positionY}px;
  transition: background-color 0.05s ease-in-out, left 0.05s linear, top 0.05s linear;
`;

const AIOpponent = ({ courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty, isFlashing, netTop }) => {
  const [isJumping, setIsJumping] = useState(false);

  // Derived constants moved out of useEffect for performance
  const COURT_MID = courtWidth / 2;
  const baseLineY = courtHeight - paddleHeight;

  // Use useMemo for Difficulty Settings
  const { speed: maxSpeed, jumpThreshold, accuracy } = useMemo(() => {
    switch (difficulty) {
      case 'easy': return { speed: 3, jumpThreshold: 0.2, accuracy: 0.3 };
      case 'hard': return { speed: 8, jumpThreshold: 0.9, accuracy: 1.0 };
      default: return { speed: 5, jumpThreshold: 0.5, accuracy: 0.7 };
    }
  }, [difficulty]);

  // --- TRAJECTORY PREDICTION FUNCTION (Wrapped in useCallback) ---
  const predictX = useCallback((ball) => {
    if (ball.direction.x === 0 || ball.speed === 0) return ball.position.left;

    // We predict the X-position when the ball reaches the baseline Y-coordinate.
    const targetY = courtHeight - BALL_RADIUS; 
    const dy = targetY - ball.position.top;

    if (G_EFFECTIVE === 0) return ball.position.left; 

    // Solving the quadratic equation for time (t): 0.5 * G * t^2 + V_y * t - Δy = 0
    const a = 0.5 * G_EFFECTIVE;
    const b = ball.direction.y;
    const c = -dy;
    
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        // Imaginary roots: trajectory does not reach this Y-level (e.g., ball goes way too high)
        // Fallback: estimate time based on current vertical velocity
        const t_fallback = Math.max(0, dy / Math.abs(ball.direction.y * ball.speed) || 0);
        return ball.position.left + ball.direction.x * ball.speed * t_fallback;
    }

    // Use the positive root (time moving forward)
    const t_vertical = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    // Calculate horizontal position
    const predictedX = ball.position.left + ball.direction.x * ball.speed * t_vertical;

    return predictedX;
  }, [courtHeight]); // Dependency on courtHeight for targetY calculation


  useEffect(() => {
    const updateRate = 16; 

    const tickAI = () => {
        if (!ballState.isServed) return;
        
        // --- 2. Lateral Movement (Horizontal Tracking & Prediction) ---
        
        // 2a. Determine Target X
        let predictedTargetX = predictX(ballState);
        
        // Introduce controlled inaccuracy based on difficulty
        const maxInaccuracy = COURT_MID * (1 - accuracy);
        // Random offset to simulate human error/hesitation
        const inaccuracyOffset = (Math.random() - 0.5) * maxInaccuracy * (1 - accuracy); 

        // Target: Predicted landing X + center of paddle offset + inaccuracy
        const targetXCenter = predictedTargetX + inaccuracyOffset;
        const targetX = targetXCenter - PADDLE_HALF_WIDTH;
        const currentX = positionX;
        
        // 2b. Calculate Movement
        const distanceToTarget = targetX - currentX;
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
        
        const isBallMovingToAI = ballState.direction.x < 0;
        
        // Block Zone: Ball is near the net and high enough to be blocked/spiked
        const isBallInBlockZone = ballState.position.left < COURT_MID + PADDLE_WIDTH && ballState.position.top < netTop + 40;
        
        // Dig/Return Zone: Ball is dropping toward the base line.
        const isBallInDigZone = ballState.position.top > baseLineY - JUMP_HEIGHT;

        // Alignment check: Is the paddle close enough horizontally to the ball's CURRENT position?
        const isBallAligned = Math.abs(ballState.position.left - (currentX + PADDLE_HALF_WIDTH)) < PADDLE_WIDTH;

        if (isBallMovingToAI && !isJumping) {
            
            let actionTime = 0;
            if (isBallInBlockZone) actionTime = 0; // Block immediately
            else if (isBallInDigZone) actionTime = 50; // Dig/Return slightly delayed

            if (actionTime > 0) {
              // Predictive Jump Timing: Only jump if aligned AND the random check passes
              const shouldJump = Math.random() < jumpThreshold;

              if (shouldJump && isBallAligned) {
                // Use a short delay based on the calculated action time
                setTimeout(() => {
                    // Re-check alignment before jumping to prevent stale jumps
                    if (Math.abs(ballState.position.left - (positionX + PADDLE_HALF_WIDTH)) < PADDLE_WIDTH) {
                        setIsJumping(true);
                        onPlayerMoveY(baseLineY - JUMP_HEIGHT);
                        setTimeout(() => {
                            onPlayerMoveY(baseLineY);
                            setIsJumping(false);
                        }, 400); 
                    }
                }, actionTime);
              }
            }
        }
    };
    
    // Start the continuous tick loop
    const intervalId = setInterval(tickAI, updateRate);
    
    return () => clearInterval(intervalId);

  }, [
      ballState, // Depend on the entire ballState object for freshness
      positionX, 
      onPlayerMoveX, 
      onPlayerMoveY, 
      courtWidth, 
      paddleHeight, 
      difficulty, 
      isJumping,
      netTop,
      // All useMemo/useCallback derived values are implicitly stable.
      // Explicitly including maxSpeed and accuracy for clarity.
      maxSpeed,
      accuracy,
      jumpThreshold,
      predictX, 
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
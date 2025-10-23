import React, { useEffect, useState, useCallback, useMemo } from 'react';

// --- Physics and Constants ---
const PADDLE_WIDTH = 30; 
const PADDLE_HALF_WIDTH = PADDLE_WIDTH / 2;
const JUMP_HEIGHT = 50; 
const BALL_RADIUS = 10;
// CRITICAL: This physics constant must match the one used in Ball.js for prediction to work.
const G_EFFECTIVE = 0.5 / 10; 
const JUMP_DURATION_MS = 400; // Match the animation time in Player.js

const AIOpponent = ({ courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty, isFlashing, netTop }) => {
  const [isJumping, setIsJumping] = useState(false);

  // Derived constants for performance
  const COURT_MID = courtWidth / 2;
  const baseLineY = courtHeight - paddleHeight;

  // 1. Difficulty Settings (useMemo for stability)
  const { speed: maxSpeed, jumpThreshold, accuracy, dampingFactor } = useMemo(() => {
    switch (difficulty) {
      // Damping factor: dictates how quickly the AI covers the remaining distance (0.1 = slower, 0.6 = faster)
      case 'easy': return { speed: 3, jumpThreshold: 0.2, accuracy: 0.3, dampingFactor: 0.15 };
      case 'hard': return { speed: 8, jumpThreshold: 0.9, accuracy: 1.0, dampingFactor: 0.6 };
      default: return { speed: 5, jumpThreshold: 0.5, accuracy: 0.7, dampingFactor: 0.3 };
    }
  }, [difficulty]);

  // --- TRAJECTORY PREDICTION FUNCTION ---
  // Calculates where the ball will land horizontally (X) when it hits the baseline (Y).
  const predictX = useCallback((ball) => {
    if (ball.direction.x === 0 || ball.speed === 0) return ball.position.left;

    const targetY = courtHeight - BALL_RADIUS; 
    const dy = targetY - ball.position.top;

    if (G_EFFECTIVE === 0) return ball.position.left; 

    // Solves the quadratic equation for time (t) to reach targetY.
    // 0.5 * G * t^2 + V_y * t - Δy = 0
    const a = 0.5 * G_EFFECTIVE;
    const b = ball.direction.y;
    const c = -dy;
    
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        // Imaginary roots: trajectory does not reach this Y-level (ball goes too high or is already past the ground)
        // Fallback: use a simple proportional time estimate
        const t_fallback = Math.max(0, dy / (Math.abs(ball.direction.y * ball.speed) + 1e-6));
        return ball.position.left + ball.direction.x * ball.speed * t_fallback;
    }

    // Use the positive root, representing the forward time until impact.
    const t_vertical = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    // Calculate horizontal position at that time
    const predictedX = ball.position.left + ball.direction.x * ball.speed * t_vertical;

    return predictedX;
  }, [courtHeight]);

  // --- 2. JUMP MOVEMENT EFFECT (Decoupled and Stable) ---
  // This hook is solely responsible for moving the paddle vertically and resetting the jump state.
  useEffect(() => {
    let jumpTimeoutId;

    if (isJumping) {
      // 2a. Jump Up
      onPlayerMoveY(baseLineY - JUMP_HEIGHT);

      // 2b. Reset jump after duration
      jumpTimeoutId = setTimeout(() => {
        onPlayerMoveY(baseLineY); // Move paddle back down
        setIsJumping(false);      // Reset state flag
      }, JUMP_DURATION_MS);

    } else {
      // Ensure the paddle is at the baseline when not jumping
      if (positionY !== baseLineY) {
         onPlayerMoveY(baseLineY);
      }
    }

    return () => {
      clearTimeout(jumpTimeoutId);
      // Clean up the position if component unmounts while jumping
      if (isJumping) onPlayerMoveY(baseLineY); 
    };
  }, [isJumping, onPlayerMoveY, baseLineY, positionY]);


  // --- 3. AI LOGIC LOOP (tickAI) ---
  // This hook handles horizontal tracking and jump initiation.
  useEffect(() => {
    const updateRate = 16; 
    
    const tickAI = () => {
        if (!ballState.isServed) return;
        
        // --- Lateral Movement ---
        
        let predictedTargetX = predictX(ballState);
        const currentX = positionX;
        const isBallMovingToAI = ballState.direction.x < 0;
        
        // Block Strategy: If the ball is high and near the net on the AI side (spike possibility)
        const BLOCK_RANGE_X = COURT_MID + PADDLE_WIDTH * 2; // Position 2 paddle widths past the net
        const isBallHighAndNearNet = ballState.position.top < netTop + 50 && ballState.position.left < BLOCK_RANGE_X;
        
        if (difficulty === 'hard' && isBallMovingToAI && isBallHighAndNearNet) {
            // Target a fixed blocking position slightly back from the net instead of the predicted landing spot.
            predictedTargetX = BLOCK_RANGE_X - PADDLE_HALF_WIDTH; 
        }

        // Inaccuracy and Offset
        const maxInaccuracy = COURT_MID * (1 - accuracy);
        const inaccuracyOffset = (Math.random() - 0.5) * maxInaccuracy * (1 - accuracy); 

        const targetXCenter = predictedTargetX + inaccuracyOffset;
        const targetX = targetXCenter - PADDLE_HALF_WIDTH;
        
        const distanceToTarget = targetX - currentX;

        // ENHANCEMENT: Smoothed Movement (Proportional Control)
        // Calculate a proportional move amount (damping)
        const actualMove = distanceToTarget * dampingFactor;
        
        // Clamp the movement to the maximum speed limit
        const moveAmount = Math.min(Math.abs(actualMove), maxSpeed); 
        const moveDirection = actualMove > 0 ? 1 : -1;

        let newX = currentX;
        if (Math.abs(distanceToTarget) > 5) { 
            newX = currentX + moveAmount * moveDirection;
        }

        // Apply movement with court clamping (AI must stay on its side, X >= COURT_MID)
        onPlayerMoveX(Math.min(courtWidth - PADDLE_WIDTH, Math.max(COURT_MID, newX)));


        // --- Vertical Movement (Jumping/Blocking) ---
        
        // Hitting Threshold: Ball must be within vertical reach of a jump
        const isBallInVerticalReach = ballState.position.top > netTop - JUMP_HEIGHT && ballState.position.top < baseLineY;

        // Alignment check: Is the paddle close enough horizontally to the ball?
        // Use a wider alignment zone for easier difficulties
        const alignmentThreshold = PADDLE_WIDTH * (1 + (1 - accuracy)); 
        const isBallAligned = Math.abs(ballState.position.left - (currentX + PADDLE_HALF_WIDTH)) < alignmentThreshold;
        
        if (isBallMovingToAI && isBallInVerticalReach && !isJumping) {
            
            // Decisive Jump Check: Must align and pass the difficulty probability check
            const shouldJump = Math.random() < jumpThreshold;

            if (shouldJump && isBallAligned) {
                // Trigger the jump state. The dedicated useEffect handles the movement.
                setIsJumping(true);
            }
        }
    };
    
    // Start the continuous tick loop
    const intervalId = setInterval(tickAI, updateRate);
    
    return () => clearInterval(intervalId);

  }, [
      ballState, 
      positionX, 
      onPlayerMoveX, 
      courtWidth, 
      paddleHeight, 
      difficulty, 
      isJumping,
      netTop,
      // Stable dependencies from useMemo/useCallback
      maxSpeed,
      accuracy,
      jumpThreshold,
      dampingFactor, 
      predictX, 
      COURT_MID
  ]);


  // Inline styles for the paddle body (replacing Tailwind)
  const paddleStyle = useMemo(() => ({
    width: PADDLE_WIDTH,
    height: paddleHeight,
    left: positionX,
    top: positionY,
    
    // Standard CSS equivalents of Tailwind classes
    position: 'absolute',
    borderRadius: '0.375rem', // rounded-md
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // shadow-lg
    
    // Dynamic color based on flashing state
    backgroundColor: isFlashing ? '#f3f4f6' : '#4c1d95', // bg-gray-200 or bg-purple-900
    
    // Note: The transition duration is set here for smooth movement
    transition: `background-color 0.05s ease-in-out, left 0.05s linear, top ${JUMP_DURATION_MS / 2000}s ease-out`,
  }), [positionX, positionY, paddleHeight, isFlashing]);

  return (
    <div 
      style={paddleStyle}
    />
  );
};

export default AIOpponent;

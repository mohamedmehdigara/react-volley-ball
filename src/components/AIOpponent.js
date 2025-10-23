import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';

// --- Physics and Constants ---
const PADDLE_WIDTH = 30; 
const PADDLE_HALF_WIDTH = PADDLE_WIDTH / 2;
const JUMP_HEIGHT = 50; 
const BALL_RADIUS = 10;
// CRITICAL: This physics constant must match the one used in Ball.js for prediction to work.
const G_EFFECTIVE = 0.5 / 10; 
const JUMP_DURATION_MS = 400; // Match the animation time in Player.js
const UPDATE_RATE = 16; // 60 FPS update rate

const AIOpponent = ({ courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty, isFlashing, netTop }) => {
  const [isJumping, setIsJumping] = useState(false);
  
  // State to hold the predicted target X position for smoothing (Optional for future use)
  const [targetX, setTargetX] = useState(positionX);

  // Use a ref to store the latest values of props/state that change frequently (e.g., every tick)
  const latest = useRef({});
  // Ref to manage the AI's reaction delay timeout for cleanup
  const reactionTimeoutRef = useRef(null); 

  // Derived constants for performance
  const COURT_MID = courtWidth / 2;
  const baseLineY = courtHeight - paddleHeight;
  const optimalHitY = baseLineY - JUMP_HEIGHT / 2; // Optimal vertical position for hitting/spiking

  // 1. Difficulty Settings (useMemo for stability)
  const { speed: maxSpeed, jumpThreshold, accuracy, dampingFactor, reactionDelayMs } = useMemo(() => {
    switch (difficulty) {
      // Added reactionDelayMs: Easy is slower to react (more latency)
      case 'easy': return { speed: 3, jumpThreshold: 0.2, accuracy: 0.3, dampingFactor: 0.15, reactionDelayMs: 250 };
      case 'hard': return { speed: 8, jumpThreshold: 0.9, accuracy: 1.0, dampingFactor: 0.6, reactionDelayMs: 50 };
      default: return { speed: 5, jumpThreshold: 0.5, accuracy: 0.7, dampingFactor: 0.3, reactionDelayMs: 150 };
    }
  }, [difficulty]);

  // --- TRAJECTORY PREDICTION FUNCTION ---
  // Calculates where the ball will land horizontally (X) and the TIME (t) it takes to reach a target Y.
  const getTrajectoryData = useCallback((ball, targetY) => {
    if (ball.direction.x === 0 || ball.speed === 0) {
        return { predictedX: ball.position.left, timeToTarget: Infinity };
    }

    const dy = targetY - ball.position.top;
    if (G_EFFECTIVE === 0) {
        // Fallback for non-gravity simulation
        const t_simple = dy / (ball.direction.y * ball.speed + 1e-6);
        const predictedX = ball.position.left + ball.direction.x * ball.speed * t_simple;
        return { predictedX, timeToTarget: t_simple };
    }

    // Solves the quadratic equation for time (t) to reach targetY.
    // 0.5 * G * t^2 + V_y * t - Δy = 0
    const a = 0.5 * G_EFFECTIVE;
    const b = ball.direction.y;
    const c = -dy;
    
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        return { predictedX: ball.position.left, timeToTarget: Infinity };
    }

    // Use the root that results in a positive time, representing the forward time until impact.
    const t_vertical1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t_vertical2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    
    // Choose the smaller, positive time (the first time the ball crosses the target Y line)
    const t_vertical = (t_vertical1 > 0 && t_vertical2 > 0) 
        ? Math.min(t_vertical1, t_vertical2) 
        : Math.max(t_vertical1, t_vertical2, 0);

    if (t_vertical <= 0) return { predictedX: ball.position.left, timeToTarget: Infinity };

    // Convert physics time to real world milliseconds for planning
    const timeToTargetMs = t_vertical * UPDATE_RATE;

    // Calculate horizontal position at that time
    const predictedX = ball.position.left + ball.direction.x * ball.speed * t_vertical;

    return { predictedX, timeToTarget: timeToTargetMs };
  }, [courtHeight]);


  // 2. KEEP LATEST VALUES IN REF
  // Update the ref on every render to ensure tickAI has access to the freshest props and state.
  useEffect(() => {
    latest.current = {
        positionX, 
        positionY,
        ballState, 
        isJumping, 
        onPlayerMoveX, 
        onPlayerMoveY, 
        accuracy, 
        jumpThreshold, 
        maxSpeed, 
        dampingFactor, 
        reactionDelayMs, 
        getTrajectoryData, 
        COURT_MID, 
        optimalHitY, 
        courtWidth, 
        netTop,
        baseLineY,
        setIsJumping,
        setTargetX,
    };
  }); // No dependency array: runs on every render

  // --- 2. JUMP MOVEMENT EFFECT (Decoupled and Stable) ---
  // This hook relies on isJumping state change, which is fine.
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
      if (isJumping) onPlayerMoveY(baseLineY); 
    };
  }, [isJumping, onPlayerMoveY, baseLineY, positionY]);


  // --- 3. AI LOGIC LOOP (tickAI) ---
  // This hook handles horizontal tracking and jump initiation.
  useEffect(() => {
    const tickAI = () => {
        // Destructure all needed values from the latest ref
        const { 
            ballState, positionX, isJumping, onPlayerMoveX, 
            accuracy, jumpThreshold, maxSpeed, dampingFactor, 
            reactionDelayMs, getTrajectoryData, COURT_MID, 
            optimalHitY, courtWidth, netTop, setIsJumping: setJump,
            setTargetX: setTargetXRef
        } = latest.current;


        if (!ballState || !ballState.isServed) return;
        
        const currentX = positionX;
        const isBallMovingToAI = ballState.direction.x < 0;

        // --- Lateral Movement Logic ---

        // 3a. Get Predicted Landing X (using baseLineY as the target Y)
        const { predictedX: predictedLandingX } = getTrajectoryData(ballState, courtHeight - BALL_RADIUS);
        let targetXToAim = predictedLandingX;
        
        // 3b. Blocking Strategy Override (Hard Difficulty Only)
        const BLOCK_RANGE_X = COURT_MID + PADDLE_WIDTH * 2;
        const isBallHighAndNearNet = ballState.position.top < netTop + 50 && ballState.position.left < BLOCK_RANGE_X;
        
        if (difficulty === 'hard' && isBallMovingToAI && isBallHighAndNearNet) {
            // Override: Move to blocking position near the net
            targetXToAim = BLOCK_RANGE_X - PADDLE_HALF_WIDTH; 
        }

        // 3c. Introduce Inaccuracy
        const maxInaccuracy = COURT_MID * (1 - accuracy);
        const inaccuracyOffset = (Math.random() - 0.5) * maxInaccuracy * (1 - accuracy); 

        const targetXCenter = targetXToAim + inaccuracyOffset;
        const finalTargetX = targetXCenter - PADDLE_HALF_WIDTH;
        
        // Update the target X state for reference (optional, but good for debugging)
        setTargetXRef(finalTargetX);
        
        const distanceToTarget = finalTargetX - currentX;

        // 3d. Smoothed Movement (Proportional Control)
        const actualMove = distanceToTarget * dampingFactor;
        const moveAmount = Math.min(Math.abs(actualMove), maxSpeed); 
        const moveDirection = actualMove > 0 ? 1 : -1;

        let newX = currentX;
        if (Math.abs(distanceToTarget) > 5) { 
            newX = currentX + moveAmount * moveDirection;
        }

        // Apply movement with court clamping (AI must stay on its side)
        onPlayerMoveX(Math.min(courtWidth - PADDLE_WIDTH, Math.max(COURT_MID, newX)));


        // --- Vertical Movement (Jumping/Blocking) ---

        // 4a. Predictive Jump Timing
        const { predictedX: predictedJumpX, timeToTarget: timeToOptimalHitMs } = getTrajectoryData(ballState, optimalHitY);
        
        // Check if the jump is worthwhile and the ball is moving to the AI
        if (isBallMovingToAI && !isJumping && timeToOptimalHitMs !== Infinity) {

            // Calculate the required time window for the jump
            const jumpTimeBufferMs = JUMP_DURATION_MS / 2;
            const requiredJumpLeadTimeMs = jumpTimeBufferMs + reactionDelayMs;

            // Alignment check
            const alignmentThreshold = PADDLE_WIDTH * (1 + (1 - accuracy)); 
            const isAlignedForJump = Math.abs(predictedJumpX - (currentX + PADDLE_HALF_WIDTH)) < alignmentThreshold;

            const shouldJump = Math.random() < jumpThreshold;

            // Trigger jump if: within the reaction window & aligned & probability passed.
            if (shouldJump && isAlignedForJump && timeToOptimalHitMs > requiredJumpLeadTimeMs && timeToOptimalHitMs < requiredJumpLeadTimeMs + 50) {
                 // Clear any previous pending jump timeout to ensure only the latest prediction counts
                 if (reactionTimeoutRef.current) {
                     clearTimeout(reactionTimeoutRef.current);
                 }
                 
                 // Use a slight delay to simulate the reaction time
                 reactionTimeoutRef.current = setTimeout(() => {
                    // Re-check alignment before jumping to prevent stale jumps
                    if (Math.abs(latest.current.ballState.position.left - (latest.current.positionX + PADDLE_HALF_WIDTH)) < alignmentThreshold) {
                        setJump(true);
                    }
                    reactionTimeoutRef.current = null; // Clear the ref after execution
                }, reactionDelayMs);
            }
        }
    };
    
    // Set up the continuous tick loop
    const intervalId = setInterval(tickAI, UPDATE_RATE);
    
    return () => {
        clearInterval(intervalId);
        // CRITICAL: Clear any pending reaction timeout when the effect cleans up
        if (reactionTimeoutRef.current) {
            clearTimeout(reactionTimeoutRef.current);
        }
    };

  // The interval only depends on the stable function and constants, preventing frequent teardown.
  // All frequently changing values are read from the `latest` ref.
  }, [getTrajectoryData, difficulty, COURT_MID, optimalHitY, courtHeight, netTop]);


  // Inline styles for the paddle body
  const paddleStyle = useMemo(() => ({
    width: PADDLE_WIDTH,
    height: paddleHeight,
    left: positionX,
    top: positionY,
    
    // Standard CSS
    position: 'absolute',
    borderRadius: '0.375rem', 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', 
    
    // Dynamic color
    backgroundColor: isFlashing ? '#f3f4f6' : '#4c1d95', 
    
    // Transition for smooth horizontal movement and jump animation
    transition: `background-color 0.05s ease-in-out, left 0.05s linear, top ${JUMP_DURATION_MS / 2000}s ease-out`,
  }), [positionX, positionY, paddleHeight, isFlashing]);

  return (
    <div 
      style={paddleStyle}
      // Optional: Display target X for debugging
      // title={`Target X: ${targetX.toFixed(2)}`}
    />
  );
};

export default AIOpponent;

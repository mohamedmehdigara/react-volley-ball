import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

// --- Physics and Constants ---
const PADDLE_WIDTH = 30; 
const PADDLE_HALF_WIDTH = PADDLE_WIDTH / 2;
const JUMP_HEIGHT = 50; 
const BALL_RADIUS = 10;
// CRITICAL: This physics constant must match the one used in Ball.js for prediction to work.
const G_EFFECTIVE = 0.5 / 10; 
const JUMP_DURATION_MS = 400; // Match the animation time in Player.js
const UPDATE_RATE = 16; // 60 FPS update rate (approx 16.67ms)

// --- AI Modes for Strategic Play ---
const AI_MODES = {
    IDLE: 'IDLE', // No action, ball is served or on the other side
    COVER_COURT: 'COVER_COURT', // Moving to a defensive home position
    PREPARE_JUMP: 'PREPARE_JUMP', // Positioning for a spike/block/high hit
    BLOCKING: 'BLOCKING', // Stance near the net to block spikes
};

const AIOpponent = ({ courtWidth, courtHeight, ballState, onPlayerMoveX, onPlayerMoveY, paddleHeight, positionX, positionY, difficulty, isFlashing, netTop }) => {
    const [isJumping, setIsJumping] = useState(false);
    const [aiMode, setAiMode] = useState(AI_MODES.IDLE);
    
    // State to hold the predicted target X position for smoothing/debugging
    const [targetX, setTargetX] = useState(positionX);

    // Use a ref to store the latest values of props/state that change frequently (e.g., every tick)
    const latest = useRef({});
    // Ref to manage the AI's reaction delay timeout for cleanup
    const reactionTimeoutRef = useRef(null); 

    // Derived constants for performance
    const COURT_MID = courtWidth / 2;
    // AI is Player 2, on the left side (X < COURT_MID)
    const AI_MAX_X = COURT_MID - PADDLE_WIDTH;
    const baseLineY = courtHeight - paddleHeight;
    // Optimal vertical position for hitting/spiking (at the apex of the jump)
    const optimalHitY = baseLineY - JUMP_HEIGHT; 
    // Defensive home position (center of the AI's court half)
    const homePositionX = (COURT_MID / 2) - PADDLE_HALF_WIDTH; 

    // 1. Difficulty Settings (useMemo for stability)
    const { 
        speed: maxSpeed, 
        jumpThreshold, 
        accuracy, 
        dampingFactor, 
        reactionDelayMs,
        blockingRangeX,
        idleWaitMs
    } = useMemo(() => {
        switch (difficulty) {
            case 'easy': 
                return { speed: 3, jumpThreshold: 0.2, accuracy: 0.4, dampingFactor: 0.1, reactionDelayMs: 250, blockingRangeX: 0.3, idleWaitMs: 300 };
            case 'hard': 
                return { speed: 8, jumpThreshold: 0.9, accuracy: 0.9, dampingFactor: 0.6, reactionDelayMs: 50, blockingRangeX: 0.1, idleWaitMs: 50 };
            case 'lunatic': 
                // Near-perfect settings: fast speed, max damping for instant movement, near-instant reaction
                return { speed: 12, jumpThreshold: 1.0, accuracy: 1.0, dampingFactor: 1.0, reactionDelayMs: 0, blockingRangeX: 0.05, idleWaitMs: 0 }; 
            default: 
                return { speed: 5, jumpThreshold: 0.6, accuracy: 0.7, dampingFactor: 0.3, reactionDelayMs: 150, blockingRangeX: 0.2, idleWaitMs: 150 };
        }
    }, [difficulty]);

    // --- TRAJECTORY PREDICTION FUNCTION ---
    const getTrajectoryData = useCallback((ball, targetY) => {
        if (ball.direction.x === 0 || ball.speed === 0) {
            return { predictedX: ball.position.left, timeToTarget: Infinity, ballVelocityY: ball.direction.y * ball.speed };
        }

        const dy = targetY - ball.position.top;
        if (G_EFFECTIVE === 0) {
            // Fallback for non-gravity simulation
            const t_simple = dy / (ball.direction.y * ball.speed + 1e-6);
            const predictedX = ball.position.left + ball.direction.x * ball.speed * t_simple;
            return { predictedX, timeToTarget: t_simple * UPDATE_RATE, ballVelocityY: ball.direction.y * ball.speed };
        }

        // Solves the quadratic equation for time (t) to reach targetY.
        // 0.5 * G * t^2 + V_y * t - Δy = 0
        const a = 0.5 * G_EFFECTIVE;
        const b = ball.direction.y; // V_y
        const c = -dy;
        
        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return { predictedX: ball.position.left, timeToTarget: Infinity, ballVelocityY: b };
        }

        const sqrtDisc = Math.sqrt(discriminant);
        // t_vertical1 is usually the positive root for forward time
        const t_vertical1 = (-b + sqrtDisc) / (2 * a);
        // t_vertical2 could be negative or the second crossing point (if ball is launched up)
        const t_vertical2 = (-b - sqrtDisc) / (2 * a);
        
        let t_vertical;
        
        if (t_vertical1 > 0 && t_vertical2 > 0) {
            // Both times are positive, take the smaller one (first contact)
            t_vertical = Math.min(t_vertical1, t_vertical2);
        } else if (t_vertical1 > 0) {
            t_vertical = t_vertical1;
        } else if (t_vertical2 > 0) {
            t_vertical = t_vertical2;
        } else {
             // If both are non-positive, the target is behind or currently being passed.
            return { predictedX: ball.position.left, timeToTarget: Infinity, ballVelocityY: b };
        }

        // Calculate horizontal position at that time
        const predictedX = ball.position.left + ball.direction.x * ball.speed * t_vertical;

        // Convert physics time to real world milliseconds for planning
        const timeToTargetMs = t_vertical * UPDATE_RATE;

        // Velocity at impact: V_final = V_initial + G * t
        const ballVelocityY = b + G_EFFECTIVE * t_vertical;

        return { predictedX, timeToTarget: timeToTargetMs, ballVelocityY };
    }, [courtHeight]);


    // 2. KEEP LATEST VALUES IN REF
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
            AI_MAX_X,
            optimalHitY, 
            courtWidth, 
            netTop,
            baseLineY,
            homePositionX,
            blockingRangeX,
            idleWaitMs,
            aiMode,
            setIsJumping,
            setAiMode,
            setTargetX,
        };
    }); 

    // --- 2. JUMP MOVEMENT EFFECT (Decoupled and Stable) ---
    useEffect(() => {
        let jumpTimeoutId;

        if (isJumping) {
            // 2a. Jump Up
            onPlayerMoveY(baseLineY - JUMP_HEIGHT);

            // 2b. Reset jump after duration
            jumpTimeoutId = setTimeout(() => {
                onPlayerMoveY(baseLineY); // Move paddle back down
                setIsJumping(false);     // Reset state flag
                setAiMode(AI_MODES.COVER_COURT); // Transition to covering after jump
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
    useEffect(() => {
        let lastBallX = null;
        let idleTimer = 0;

        const tickAI = () => {
            // Destructure all needed values from the latest ref
            const { 
                ballState, positionX, isJumping, onPlayerMoveX, 
                accuracy, jumpThreshold, maxSpeed, dampingFactor, 
                reactionDelayMs, getTrajectoryData, COURT_MID, 
                AI_MAX_X, optimalHitY, netTop, aiMode, setAiMode: setMode,
                setTargetX: setTargetXRef, homePositionX, blockingRangeX, idleWaitMs
            } = latest.current;

            if (!ballState || !ballState.isServed) return;
            
            const currentX = positionX;
            // AI is on the left, so ball moving right-to-left means it's coming towards the AI
            const isBallMovingToAI = ballState.direction.x < 0 && ballState.position.left < COURT_MID;
            const ballMidX = ballState.position.left;

            let targetXCenter = homePositionX + PADDLE_HALF_WIDTH; // Default to center

            // --- State Transition Logic ---
            if (isBallMovingToAI) {
                // If the ball is moving to the AI, we need to track it
                setMode(AI_MODES.PREPARE_JUMP); 
                idleTimer = 0;
            } else if (ballMidX >= COURT_MID) {
                // Ball is on the opponent's side
                
                // If the ball X hasn't changed much, the opponent might be holding it or setting up
                if (Math.abs(ballMidX - lastBallX) < 1) {
                    idleTimer += UPDATE_RATE;
                } else {
                    idleTimer = 0;
                }
                
                if (idleTimer > idleWaitMs) {
                    // After a short delay, move to defense position
                    setMode(AI_MODES.COVER_COURT);
                } else {
                    // Temporary IDLE until movement is needed
                    setMode(AI_MODES.IDLE);
                }
            }
            lastBallX = ballMidX;


            // --- Lateral Target Determination ---
            switch (aiMode) {
                case AI_MODES.PREPARE_JUMP: {
                    // 4a. Trajectory Prediction (to floor)
                    const { predictedX: predictedLandingX } = getTrajectoryData(ballState, courtHeight - BALL_RADIUS);
                    
                    // 4b. Prediction Blend: Rely more on prediction when ball is deep (close to AI side)
                    const ballDistFromNet = COURT_MID - ballMidX;
                    const predictionBlend = (0.5 + accuracy * 0.5); 
                    const blendFactor = Math.min(1, Math.max(0, (ballDistFromNet / COURT_MID) * predictionBlend));
                    
                    // Target is a weighted average of current X and predicted landing X.
                    targetXCenter = ballMidX * (1 - blendFactor) + predictedLandingX * blendFactor;

                    // 4c. Blocking Override Check
                    const isBallNearNet = ballState.position.top < netTop + 50 && ballState.position.left > COURT_MID * blockingRangeX;
                    const targetBlockX = COURT_MID * blockingRangeX - PADDLE_HALF_WIDTH;

                    if (difficulty !== 'easy' && isBallMovingToAI && isBallNearNet) {
                        setMode(AI_MODES.BLOCKING);
                        targetXCenter = targetBlockX;
                    }
                    break;
                }

                case AI_MODES.BLOCKING: {
                    // Keep positioning aggressively near the net's boundary
                    const targetBlockX = COURT_MID * blockingRangeX;
                    targetXCenter = targetBlockX;
                    
                    // Exit BLOCKING if the ball is no longer near the net
                    const isBallStillNearNet = ballState.position.top < netTop + 100;
                    if (!isBallMovingToAI || !isBallStillNearNet) {
                        setMode(AI_MODES.COVER_COURT);
                    }
                    break;
                }

                case AI_MODES.COVER_COURT:
                    // Aim for the defensive home position
                    targetXCenter = homePositionX + PADDLE_HALF_WIDTH;
                    break;

                case AI_MODES.IDLE:
                default:
                    // Stand still (or slight movement towards center)
                    targetXCenter = currentX + PADDLE_HALF_WIDTH; 
                    break;
            }

            // 4d. Introduce Inaccuracy (only when not IDLE/COVERING)
            if (aiMode !== AI_MODES.IDLE && aiMode !== AI_MODES.COVER_COURT) {
                const maxInaccuracy = COURT_MID * (1 - accuracy);
                const inaccuracyOffset = (Math.random() - 0.5) * maxInaccuracy; 
                targetXCenter += inaccuracyOffset;
            }

            const finalTargetX = targetXCenter - PADDLE_HALF_WIDTH;
            setTargetXRef(finalTargetX);
            
            const distanceToTarget = finalTargetX - currentX;

            // 4e. Smoothed Movement (Proportional Control)
            const actualMove = distanceToTarget * dampingFactor;
            const moveAmount = Math.min(Math.abs(actualMove), maxSpeed); 
            const moveDirection = actualMove > 0 ? 1 : -1;

            let newX = currentX;
            // Only move if the distance is significant enough
            if (Math.abs(distanceToTarget) > 1) { 
                newX = currentX + moveAmount * moveDirection;
            }

            // CRITICAL CLAMPING FIX: AI must stay on its side (0 to AI_MAX_X)
            const clampedX = Math.min(AI_MAX_X, Math.max(0, newX));
            onPlayerMoveX(clampedX);


            // --- Vertical Movement (Jumping/Blocking) ---

            // 5a. Predictive Jump Timing
            const { predictedX: predictedJumpX, timeToTarget: timeToOptimalHitMs } = getTrajectoryData(ballState, optimalHitY);
            
            // Check if the jump is worthwhile and the AI is in a PREPARE mode
            if (aiMode === AI_MODES.PREPARE_JUMP && !isJumping && timeToOptimalHitMs !== Infinity) {

                // Calculate the required time window for the jump
                const jumpTimeBufferMs = JUMP_DURATION_MS / 2;
                const requiredJumpLeadTimeMs = jumpTimeBufferMs + reactionDelayMs;

                // Dynamic Jump Window: Higher accuracy = tighter window for perfect timing.
                const baseWindow = 100; 
                const jumpWindowBuffer = difficulty === 'lunatic' ? 5 : baseWindow * (1 - accuracy);
                
                // Alignment check
                const alignmentThreshold = PADDLE_WIDTH * (1 + (1 - accuracy)); 
                const isAlignedForJump = Math.abs(predictedJumpX - targetXCenter) < alignmentThreshold;

                const shouldJump = Math.random() < jumpThreshold;

                // Trigger jump if: within the dynamic time window & aligned & probability passed.
                const isWithinJumpWindow = (
                    timeToOptimalHitMs > requiredJumpLeadTimeMs - jumpWindowBuffer &&
                    timeToOptimalHitMs < requiredJumpLeadTimeMs + jumpWindowBuffer
                );

                if (shouldJump && isAlignedForJump && isWithinJumpWindow) {
                    // Clear any previous pending jump timeout
                    if (reactionTimeoutRef.current) {
                        clearTimeout(reactionTimeoutRef.current);
                    }
                    
                    // Use a slight delay to simulate the reaction time
                    reactionTimeoutRef.current = setTimeout(() => {
                        // Re-check alignment before jumping to prevent stale jumps
                        if (Math.abs(latest.current.ballState.position.left - (latest.current.positionX + PADDLE_HALF_WIDTH)) < alignmentThreshold) {
                            latest.current.setIsJumping(true); // Use ref setter inside timeout
                        }
                        reactionTimeoutRef.current = null;
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

    // The interval only depends on stable function and constants
    }, [getTrajectoryData, difficulty]);


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
        zIndex: 6, // Ensure paddle is above court markings but below net (Z-index 10)
    }), [positionX, positionY, paddleHeight, isFlashing]);

    return (
        <div 
            style={paddleStyle}
            // Optional: Display target X and AI Mode for debugging
            title={`Mode: ${aiMode} | Target X: ${targetX.toFixed(2)}`}
        />
    );
};

AIOpponent.propTypes = {
    courtWidth: PropTypes.number.isRequired,
    courtHeight: PropTypes.number.isRequired,
    ballState: PropTypes.object.isRequired,
    onPlayerMoveX: PropTypes.func.isRequired,
    onPlayerMoveY: PropTypes.func.isRequired,
    paddleHeight: PropTypes.number.isRequired,
    positionX: PropTypes.number.isRequired,
    positionY: PropTypes.number.isRequired,
    difficulty: PropTypes.string.isRequired,
    isFlashing: PropTypes.bool,
    netTop: PropTypes.number.isRequired,
};

export default AIOpponent;
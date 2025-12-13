import React, { useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

// --- Physics and Core Constants ---
const BALL_RADIUS = 10;
const G_EFFECTIVE = 0.5 / 10; // Gravity effect per frame
const AIR_DAMPING = 0.9995; // Slight energy loss due to air resistance
const PADDLE_COLLISION_DAMPING = 1.05; // Can slightly increase speed on hit (for spiking)
const NET_COLLISION_DAMPING = 0.6; // Heavy speed loss on net hit
const WALL_COLLISION_DAMPING = 0.9; // Horizontal wall and ceiling bounce speed loss
const MAX_SPEED = 20; // Cap the ball speed for better playability

// New Constants for Hit Influence
const MAX_HORIZONTAL_CURVE = 0.1; // Max side curve based on hit position (affects spinY for next frame)
const MAX_VERTICAL_IMPULSE = 1.5; // Max instantaneous vertical push/pull on impact
const VISUAL_ROTATION_SCALE = 360 * 3; // Total degrees of rotation added on impact

// --- Utility: Vector Normalization ---
const normalizeVector = (dir) => {
    const magnitude = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    if (magnitude < 1e-6) return { x: 0, y: 0 };
    return { x: dir.x / magnitude, y: dir.y / magnitude };
};

// --- Component Definition ---
const Ball = ({
    position = { top: 0, left: 0 },
    speed, 
    direction,
    courtWidth,
    courtHeight,
    netTop,
    onPaddleCollision,
    outOfBounds,
    player1Paddle,
    player2Paddle,
    onBallUpdate, 
    paddleHeight,
    isServed,
}) => {
    // Local state for spin: calculated on collision, applied in the next physics frame (affects trajectory)
    const [spinY, setSpinY] = React.useState(0); 
    // Local state for visual feedback (rotation effect)
    const [visualRotation, setVisualRotation] = React.useState(0); 

    // Ref to hold all volatile data (props and state) for the stable animation loop
    const latestRef = useRef({});

    const C = courtWidth / 2; 
    const R = BALL_RADIUS;

    // 1. Update the ref on every render with the freshest data
    useEffect(() => {
        latestRef.current = {
            position, speed, direction, courtWidth, courtHeight, netTop,
            onPaddleCollision, outOfBounds, player1Paddle, player2Paddle,
            onBallUpdate, paddleHeight, isServed, spinY, setSpinY, visualRotation, setVisualRotation,
            C, R,
        };
    });


    // --- PADDLE COLLISION LOGIC (Pure Geometry Check and Physics Response) ---
    const checkPaddleCollision = useCallback((ballPos, paddle, isP1, currentDir, currentSpeed) => {
        
        const { R, C, onPaddleCollision, setSpinY: setSpin, setVisualRotation: setVisual, paddleHeight } = latestRef.current;

        // Ball's center coordinates 
        const ballCenterX = ballPos.left + R;
        const ballCenterY = ballPos.top + R;

        // Exit if paddle is undefined or ball is on the wrong side of the net
        if (!paddle || (isP1 && ballCenterX < C) || (!isP1 && ballCenterX > C)) {
            return { newDir: currentDir, newSpeed: currentSpeed, hit: false };
        }

        // 1. Find the closest point (closestX, closestY) on the paddle to the ball center
        const closestX = Math.max(paddle.x, Math.min(ballCenterX, paddle.x + paddle.width));
        const closestY = Math.max(paddle.y, Math.min(ballCenterY, paddle.y + paddle.height));

        // 2. Calculate the distance 
        const distX = ballCenterX - closestX;
        const distY = ballCenterY - closestY;
        const distanceSquared = (distX * distX) + (distY * distY);

        if (distanceSquared < R * R) {
            
            // --- Collision occurred! ---
            onPaddleCollision(isP1 ? 'player1' : 'player2');
            
            // Calculate Hit Position
            // Hit Y relative to paddle center: negative for top half (spike), positive for bottom half (dig)
            const hitY = ballCenterY - (paddle.y + paddle.height / 2);
            // Normalized hitY to be between -1 (top edge) and +1 (bottom edge)
            const normalizedHitY = hitY / (paddle.height / 2); 
            
            // 1. Horizontal Direction (X reverses and is slightly influenced by spin)
            // Reverse direction, then apply horizontal curve influence (spinY for next frame)
            const horizontalInfluence = normalizedHitY * MAX_HORIZONTAL_CURVE;
            setSpin(horizontalInfluence); // This is applied as spin for the next frame
            
            // 2. Vertical Direction (Y reverses, with impulse force from hit position)
            let newX = -currentDir.x; // Always reverse X
            
            // Vertical Impulse: Negative normalizedHitY means hitting the top of the paddle, forcing ball down (positive Y)
            let newY = -currentDir.y; // Initial vertical reverse
            newY += -normalizedHitY * MAX_VERTICAL_IMPULSE; // Apply vertical impulse

            // 3. Direction Vector Normalization
            const normalizedDir = normalizeVector({ x: newX, y: newY });

            // 4. Speed Update: dampen the speed slightly and enforce a minimum speed, capped by MAX_SPEED
            const newSpeed = Math.min(MAX_SPEED, Math.max(1, currentSpeed * PADDLE_COLLISION_DAMPING));

            // 5. Visual Spin Update
            setVisual(prev => prev + (currentDir.x > 0 ? 1 : -1) * VISUAL_ROTATION_SCALE);

            // Re-normalize the horizontal component of the paddle hit for immediate effect
            return { newDir: normalizedDir, newSpeed, hit: true };
        }
        return { newDir: currentDir, newSpeed: currentSpeed, hit: false };
    }, []);


    // --- Animation Loop Setup (Runs only once) ---
    useEffect(() => {
        let animationFrameId;

        const animate = () => {
            // Read current state from the latest ref
            const {
                position, speed, direction, courtWidth, courtHeight, netTop,
                outOfBounds, player1Paddle, player2Paddle, onBallUpdate, isServed,
                spinY, C, R
            } = latestRef.current;

            // Only run physics if the ball is served (speed > 0)
            if (speed <= 0 || !isServed) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }
            
            let currentPos = position;
            let currentSpeed = speed;
            let currentDir = direction;

            // 1. APPLY PHYSICS
            // Apply air resistance damping
            let s = currentSpeed * AIR_DAMPING; 
            
            // Apply Gravity and Spin (Spin is the horizontal curve angle from the previous paddle hit)
            let newDir = { 
                x: currentDir.x + spinY, // spinY now applies a horizontal curve over time
                y: currentDir.y + G_EFFECTIVE
            };
            
            // Reset spin after application
            latestRef.current.setSpinY(0); 
            latestRef.current.spinY = 0; // Update ref immediately
            
            // Normalize the new direction vector for consistent movement
            newDir = normalizeVector(newDir);

            let newTop = currentPos.top + s * newDir.y;
            let newLeft = currentPos.left + s * newDir.x;
            
            // --- COLLISION CHECKS ---
            
            // 2. CEILING BOUNCE (Top edge of the ball)
            if (newTop <= 0) {
                newDir.y = -newDir.y;
                newTop = 0; // Clamp position to prevent sticking
                s = s * WALL_COLLISION_DAMPING; // Apply damping on bounce
            }

            // 3. FLOOR BOUNDARY SCORING (Ball bottom edge)
            if (newTop + R * 2 >= courtHeight) {
                // Point is scored for the player who receives the point (opponent of the side the ball landed on)
                outOfBounds(newLeft + R < C ? 'player2' : 'player1');
                return; // End animation loop immediately for scoring
            }

            // 4. NET COLLISION (Net is located at X=C, Y=netTop)
            const ballCenter = newLeft + R;
            const NET_BOUNDARY_X = 5; // How close to the center line the ball needs to be
            
            if (newTop + R >= netTop && Math.abs(ballCenter - C) < R + NET_BOUNDARY_X) {
                
                const isComingFromP2 = newLeft + R < C; // Ball currently on AI side
                
                // Only consider collision if moving towards the opponent's court
                const isMovingAcrossNet = (isComingFromP2 && newDir.x > 0) || (!isComingFromP2 && newDir.x < 0);
                
                if (isMovingAcrossNet) {
                    
                    // Net hit - Heavy speed loss and X reversal
                    newDir.x = -newDir.x;
                    s = s * NET_COLLISION_DAMPING; 
                    
                    // Push the ball away from the net 
                    newLeft += newDir.x * s * 2;
                    
                    // --- FAULT CHECK (Net violation or ball drops short) ---
                    // If the remaining speed is too low to cross the net, it's a fault.
                    if (s < 2) { 
                        outOfBounds(isComingFromP2 ? 'player1' : 'player2');
                        return;
                    }
                    
                    // Otherwise, the play continues (e.g., net let)
                    // The ball might drop or bounce over, depending on gravity/velocity.
                } else {
                    // Ball hit the net while moving backward or already on the other side
                    // Treat as fault for the player on the side the ball is currently on.
                    outOfBounds(isComingFromP2 ? 'player2' : 'player1');
                    return;
                }
            }
            
            // 5. HORIZONTAL WALL BOUNCE (Ball left/right edges)
            if (newLeft <= 0 || newLeft + R * 2 >= courtWidth) {
                newDir.x = -newDir.x;
                // Clamp position to ensure it doesn't get stuck in the wall
                newLeft = Math.max(0, Math.min(courtWidth - R * 2, newLeft)); 
                s = s * WALL_COLLISION_DAMPING;
            }

            // 6. PADDLE COLLISION (Updates newDir and s if collision occurs)
            let result = checkPaddleCollision({ top: newTop, left: newLeft }, player1Paddle, true, newDir, s);
            newDir = result.newDir;
            s = result.newSpeed;
            
            // Only check Player 2 if Player 1 didn't hit it in the same frame
            if (!result.hit) {
                result = checkPaddleCollision({ top: newTop, left: newLeft }, player2Paddle, false, newDir, s);
                newDir = result.newDir;
                s = result.newSpeed;
            }
            
            // Apply movement based on final speed and direction
            newTop = currentPos.top + s * newDir.y;
            newLeft = currentPos.left + s * newDir.x;

            // 7. Update Parent State
            onBallUpdate({ 
                position: { top: newTop, left: newLeft }, 
                speed: s, 
                direction: newDir 
            });
            
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
        
    }, [checkPaddleCollision]);

    // The return statement renders the ball at its current position using inline styling
    const ballStyle = {
        width: R * 2,
        height: R * 2,
        borderRadius: '50%',
        backgroundColor: '#fef3c7', // Volleyball color
        // Simple striped pattern to simulate rotation
        backgroundImage: 'radial-gradient(circle at 30% 30%, #fff, #f0f0f0), repeating-linear-gradient(45deg, #fb923c, #fb923c 2px, transparent 2px, transparent 4px)',
        backgroundSize: '100%, 15px 15px',
        border: '1px solid #ffedd5',
        boxShadow: '0 0 8px rgba(255, 165, 0, 0.7), inset 0 0 4px rgba(255, 255, 255, 0.9)',
        position: 'absolute',
        top: position.top,
        left: position.left,
        // Apply the visual rotation effect
        transform: `rotateZ(${visualRotation}deg)`, 
        transition: 'transform 0.01s linear', 
        willChange: 'transform, left, top',
        zIndex: 9, // Below net (10)
    };

    return <div style={ballStyle} />;
};

Ball.propTypes = {
    position: PropTypes.shape({
        top: PropTypes.number.isRequired,
        left: PropTypes.number.isRequired,
    }),
    speed: PropTypes.number.isRequired,
    direction: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
    }).isRequired,
    courtWidth: PropTypes.number.isRequired,
    courtHeight: PropTypes.number.isRequired,
    netTop: PropTypes.number.isRequired,
    onPaddleCollision: PropTypes.func.isRequired,
    outOfBounds: PropTypes.func.isRequired,
    onBallUpdate: PropTypes.func.isRequired,
    player1Paddle: PropTypes.object,
    player2Paddle: PropTypes.object,
    paddleHeight: PropTypes.number.isRequired,
    isServed: PropTypes.bool.isRequired,
};

export default Ball;
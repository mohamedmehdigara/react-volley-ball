import React, { useEffect, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * --- Physics and Core Constants ---
 * Tweak these values to adjust the "feel" of the game.
 */
const BALL_RADIUS = 10;                // Synchronized with LineJudge.js
const G_EFFECTIVE = 0.5 / 10;          // Vertical acceleration (Gravity)
const AIR_DAMPING = 0.9992;            // Velocity decay over time (Drag)
const PADDLE_BOUNCE_BASE = 1.05;       // Base speed multiplier
const SPIKE_INFLUENCE = 0.3;           // Bonus speed from paddle vertical movement
const NET_DAMPING = 0.45;              // Speed multiplier on net hit (Loss)
const WALL_FRICTION = 0.85;            // Speed multiplier on wall/ceiling bounce
const MAX_SPEED = 24;                  // Terminal velocity cap
const MIN_SPEED = 1.5;                 // Minimum speed to keep ball moving

// --- Spin & Curve (Magnus Effect) ---
const MAX_HORIZONTAL_SPIN = 0.18;      // Max arc intensity
const MAX_VERTICAL_IMPULSE = 2.0;      // Strength of spike/dig vertical push
const SPIN_DECAY = 0.97;               // How fast the trajectory curve straightens out
const VISUAL_ROTATION_SPEED = 360 * 4; // Visual rotation degrees on impact

// --- Utility: Vector Normalization ---
const normalize = (v) => {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y);
    return mag < 1e-6 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
};

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
    // State for visual effects and trajectory manipulation
    const [curveX, setCurveX] = useState(0); 
    const [rotation, setRotation] = useState(0);
    const [isSquishing, setIsSquishing] = useState(false);
    const [trail, setTrail] = useState([]); // Visual trail effect

    // Ref for high-frequency physics data to avoid React render lag in the loop
    const physicsRef = useRef({
        pos: position,
        spd: speed,
        dir: direction,
        p1PrevY: player1Paddle?.y || 0,
        p2PrevY: player2Paddle?.y || 0
    });

    const C = courtWidth / 2; 
    const R = BALL_RADIUS;

    // Sync external props to physics ref
    useEffect(() => {
        physicsRef.current.pos = position;
        physicsRef.current.spd = speed;
        physicsRef.current.dir = direction;
    }, [position, speed, direction]);

    /**
     * Handles complex collision geometry between ball and paddle.
     * Includes "Spike" logic based on paddle velocity.
     */
    const handlePaddleHit = useCallback((ballPos, paddle, isP1, currentDir, currentSpd) => {
        const ballCenterX = ballPos.left + R;
        const ballCenterY = ballPos.top + R;

        if (!paddle || (isP1 && ballCenterX < C) || (!isP1 && ballCenterX > C)) {
            return { dir: currentDir, spd: currentSpd, hit: false };
        }

        const closestX = Math.max(paddle.x, Math.min(ballCenterX, paddle.x + paddle.width));
        const closestY = Math.max(paddle.y, Math.min(ballCenterY, paddle.y + paddle.height));
        const distX = ballCenterX - closestX;
        const distY = ballCenterY - closestY;

        if ((distX * distX) + (distY * distY) < R * R) {
            onPaddleCollision(isP1 ? 'player1' : 'player2');
            
            // Calculate Paddle Velocity (Spike Factor)
            const prevY = isP1 ? physicsRef.current.p1PrevY : physicsRef.current.p2PrevY;
            const paddleVeloY = paddle.y - prevY;
            const spikeBonus = Math.abs(paddleVeloY) * SPIKE_INFLUENCE;

            // Calculate hit precision (-1 top to 1 bottom)
            const hitOffset = (ballCenterY - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
            
            setIsSquishing(true);
            setTimeout(() => setIsSquishing(false), 100);

            setCurveX(hitOffset * MAX_HORIZONTAL_SPIN);
            setRotation(prev => prev + (currentDir.x > 0 ? 1 : -1) * VISUAL_ROTATION_SPEED);

            let nX = -currentDir.x; 
            // Add vertical impulse based on hit offset AND paddle movement
            let nY = -currentDir.y + (-hitOffset * MAX_VERTICAL_IMPULSE) + (paddleVeloY * 0.1);

            const nDir = normalize({ x: nX, y: nY });
            const nSpd = Math.min(MAX_SPEED, Math.max(MIN_SPEED, currentSpd * PADDLE_BOUNCE_BASE + spikeBonus));

            return { dir: nDir, spd: nSpd, hit: true };
        }
        return { dir: currentDir, spd: currentSpd, hit: false };
    }, [R, C, onPaddleCollision]);

    /**
     * Main Physics Loop
     */
    useEffect(() => {
        let rafId;
        let trailCounter = 0;

        const loop = () => {
            const state = physicsRef.current;
            if (state.spd <= 0 || !isServed) {
                rafId = requestAnimationFrame(loop);
                return;
            }

            // 1. Update Paddle History for velocity tracking
            state.p1PrevY = player1Paddle?.y || state.p1PrevY;
            state.p2PrevY = player2Paddle?.y || state.p2PrevY;

            // 2. Air Resistance & Dynamic Curve
            let s = state.spd * AIR_DAMPING;
            let currentCurve = curveX;
            
            let nextDir = normalize({ 
                x: state.dir.x + currentCurve, 
                y: state.dir.y + G_EFFECTIVE 
            });

            setCurveX(c => c * SPIN_DECAY);

            let nTop = state.pos.top + s * nextDir.y;
            let nLeft = state.pos.left + s * nextDir.x;

            // 3. Collision Handling (Walls/Ceiling)
            if (nTop <= 0) {
                nextDir.y = -nextDir.y;
                nTop = 0;
                s *= WALL_FRICTION;
            }
            if (nLeft <= 0 || nLeft + R * 2 >= courtWidth) {
                nextDir.x = -nextDir.x;
                nLeft = Math.max(0, Math.min(courtWidth - R * 2, nLeft));
                s *= WALL_FRICTION;
            }

            // 4. Floor Detection (Scoring)
            if (nTop + R * 2 >= courtHeight) {
                outOfBounds(nLeft + R < C ? 'player2' : 'player1');
                return;
            }

            // 5. Net Collision
            const ballCenterX = nLeft + R;
            const ballCenterY = nTop + R;
            if (ballCenterY >= netTop && Math.abs(ballCenterX - C) < R + 2.5) {
                const comingFromLeft = state.pos.left + R < C;
                nextDir.x = -nextDir.x;
                s *= NET_DAMPING;
                nLeft = comingFromLeft ? (C - R - 3) : (C + R + 3);
            }

            // 6. Paddle Collisions
            let result = handlePaddleHit({ top: nTop, left: nLeft }, player1Paddle, true, nextDir, s);
            if (!result.hit) {
                result = handlePaddleHit({ top: nTop, left: nLeft }, player2Paddle, false, result.dir, result.spd);
            }

            // 7. Visual Trail Logic
            trailCounter++;
            if (trailCounter % 3 === 0) {
                setTrail(prev => [{ top: nTop, left: nLeft, id: Date.now() }, ...prev].slice(0, 8));
            }

            // Update Final State
            onBallUpdate({
                position: { top: nTop, left: nLeft },
                speed: result.spd,
                direction: result.dir
            });

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [handlePaddleHit, isServed, courtWidth, courtHeight, netTop, curveX, player1Paddle?.y, player2Paddle?.y]);

    // Calculate Shadow Properties
    const distanceFromFloor = Math.max(0, courtHeight - (position.top + R * 2));
    const shadowScale = Math.max(0.2, 1 - (distanceFromFloor / courtHeight));
    const shadowOpacity = Math.max(0.1, 0.6 - (distanceFromFloor / (courtHeight * 0.5)));

    const ballStyle = {
        width: R * 2,
        height: R * 2,
        borderRadius: '50%',
        backgroundColor: '#fffbeb',
        backgroundImage: `radial-gradient(circle at 30% 30%, #ffffff, #f59e0b)`,
        border: '1px solid #fde68a',
        boxShadow: `0 0 15px rgba(251, 146, 60, ${speed / MAX_SPEED})`,
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: `rotateZ(${rotation}deg) scale(${isSquishing ? '1.2, 0.8' : '1, 1'})`,
        transition: 'transform 0.1s linear',
        willChange: 'transform, left, top',
        zIndex: 10,
    };

    const shadowStyle = {
        width: R * 2.5,
        height: R * 0.6,
        backgroundColor: 'rgba(0,0,0,1)',
        borderRadius: '50%',
        position: 'absolute',
        left: position.left - R * 0.25,
        top: courtHeight - R * 0.3,
        transform: `scale(${shadowScale})`,
        opacity: shadowOpacity,
        filter: 'blur(4px)',
        zIndex: 5,
        pointerEvents: 'none'
    };

    return (
        <>
            {/* Trail Particles */}
            {trail.map((t, i) => (
                <div key={t.id} style={{
                    position: 'absolute',
                    top: t.top,
                    left: t.left,
                    width: R * 2,
                    height: R * 2,
                    borderRadius: '50%',
                    backgroundColor: '#fb923c',
                    opacity: (trail.length - i) / (trail.length * 4),
                    transform: `scale(${1 - i / trail.length})`,
                    pointerEvents: 'none',
                    zIndex: 8
                }} />
            ))}
            
            {/* Shadow */}
            <div style={shadowStyle} />
            
            {/* Ball */}
            <div style={ballStyle} />
        </>
    );
};

Ball.propTypes = {
    position: PropTypes.shape({ top: PropTypes.number, left: PropTypes.number }),
    speed: PropTypes.number.isRequired,
    direction: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }).isRequired,
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
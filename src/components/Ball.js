import React, { useEffect, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * --- Physics and Core Constants ---
 */
const BALL_RADIUS = 10;
const G_EFFECTIVE = 0.5 / 10;
const AIR_DAMPING = 0.9992;
const PADDLE_BOUNCE_BASE = 1.05;
const SPIKE_INFLUENCE = 0.35;          // Increased for more aggressive play
const PERFECT_HIT_THRESHOLD = 5;       // Pixels from center for "Perfect Hit"
const PERFECT_BOOST = 1.15;            // Speed multiplier for sweet-spot hits
const NET_DAMPING = 0.45;
const WALL_FRICTION = 0.85;
const MAX_SPEED = 26;                  // Increased cap
const MIN_SPEED = 1.5;

// --- Spin & Curve (Magnus Effect) ---
const MAX_HORIZONTAL_SPIN = 0.22;      
const MAX_VERTICAL_IMPULSE = 2.2;      
const SPIN_DECAY = 0.96;               
const VISUAL_ROTATION_SPEED = 360 * 5; 

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
    // Visual State
    const [curveX, setCurveX] = useState(0); 
    const [rotation, setRotation] = useState(0);
    const [isSquishing, setIsSquishing] = useState(false);
    const [isPerfect, setIsPerfect] = useState(false);
    const [trail, setTrail] = useState([]); 
    const [wobble, setWobble] = useState({ x: 0, y: 0 });

    const physicsRef = useRef({
        pos: position,
        spd: speed,
        dir: direction,
        p1PrevY: player1Paddle?.y || 0,
        p2PrevY: player2Paddle?.y || 0,
        frame: 0
    });

    const C = courtWidth / 2; 
    const R = BALL_RADIUS;

    useEffect(() => {
        physicsRef.current.pos = position;
        physicsRef.current.spd = speed;
        physicsRef.current.dir = direction;
    }, [position, speed, direction]);

    /**
     * Enhanced Collision with Sweet-Spot (Perfect Hit) Logic
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
            
            const prevY = isP1 ? physicsRef.current.p1PrevY : physicsRef.current.p2PrevY;
            const paddleVeloY = paddle.y - prevY;
            const spikeBonus = Math.abs(paddleVeloY) * SPIKE_INFLUENCE;

            // Perfect Hit Detection (Sweet Spot)
            const distFromPaddleCenter = Math.abs(ballCenterY - (paddle.y + paddle.height / 2));
            const isPerfectHit = distFromPaddleCenter < PERFECT_HIT_THRESHOLD;
            
            setIsPerfect(isPerfectHit);
            if (isPerfectHit) setTimeout(() => setIsPerfect(false), 400);

            const hitOffset = (ballCenterY - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
            
            setIsSquishing(true);
            setTimeout(() => setIsSquishing(false), 120);

            setCurveX(hitOffset * MAX_HORIZONTAL_SPIN);
            setRotation(prev => prev + (currentDir.x > 0 ? 1 : -1) * VISUAL_ROTATION_SPEED);

            let nX = -currentDir.x; 
            let nY = -currentDir.y + (-hitOffset * MAX_VERTICAL_IMPULSE) + (paddleVeloY * 0.12);

            const nDir = normalize({ x: nX, y: nY });
            let nSpd = currentSpd * (isPerfectHit ? PERFECT_BOOST : PADDLE_BOUNCE_BASE) + spikeBonus;
            nSpd = Math.min(MAX_SPEED, Math.max(MIN_SPEED, nSpd));

            return { dir: nDir, spd: nSpd, hit: true };
        }
        return { dir: currentDir, spd: currentSpd, hit: false };
    }, [R, C, onPaddleCollision]);

    /**
     * Main Physics Loop
     */
    useEffect(() => {
        let rafId;

        const loop = () => {
            const state = physicsRef.current;
            state.frame++;
            
            if (state.spd <= 0 || !isServed) {
                rafId = requestAnimationFrame(loop);
                return;
            }

            state.p1PrevY = player1Paddle?.y || state.p1PrevY;
            state.p2PrevY = player2Paddle?.y || state.p2PrevY;

            // Air Wobble for high speed shots
            if (state.spd > 15) {
                const wX = Math.sin(state.frame * 0.5) * (state.spd * 0.05);
                const wY = Math.cos(state.frame * 0.5) * (state.spd * 0.05);
                setWobble({ x: wX, y: wY });
            } else {
                setWobble({ x: 0, y: 0 });
            }

            let s = state.spd * AIR_DAMPING;
            let currentCurve = curveX;
            
            let nextDir = normalize({ 
                x: state.dir.x + currentCurve, 
                y: state.dir.y + G_EFFECTIVE 
            });

            setCurveX(c => c * SPIN_DECAY);

            let nTop = state.pos.top + s * nextDir.y;
            let nLeft = state.pos.left + s * nextDir.x;

            // Boundaries
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

            // Scoring
            if (nTop + R * 2 >= courtHeight) {
                outOfBounds(nLeft + R < C ? 'player2' : 'player1');
                return;
            }

            // Net Collision
            const ballCenterX = nLeft + R;
            const ballCenterY = nTop + R;
            if (ballCenterY >= netTop && Math.abs(ballCenterX - C) < R + 3) {
                const comingFromLeft = state.pos.left + R < C;
                nextDir.x = -nextDir.x;
                s *= NET_DAMPING;
                nLeft = comingFromLeft ? (C - R - 4) : (C + R + 4);
            }

            // Paddle Collision
            let result = handlePaddleHit({ top: nTop, left: nLeft }, player1Paddle, true, nextDir, s);
            if (!result.hit) {
                result = handlePaddleHit({ top: nTop, left: nLeft }, player2Paddle, false, result.dir, result.spd);
            }

            // Dynamic Trail
            if (state.frame % 2 === 0) {
                setTrail(prev => [{ 
                    top: nTop, 
                    left: nLeft, 
                    id: state.frame, 
                    type: isPerfect ? 'perfect' : 'normal' 
                }, ...prev].slice(0, 12));
            }

            onBallUpdate({
                position: { top: nTop, left: nLeft },
                speed: result.spd,
                direction: result.dir
            });

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [handlePaddleHit, isServed, courtWidth, courtHeight, netTop, curveX, player1Paddle?.y, player2Paddle?.y, isPerfect]);

    const distanceFromFloor = Math.max(0, courtHeight - (position.top + R * 2));
    const shadowScale = Math.max(0.1, 1 - (distanceFromFloor / courtHeight));
    const shadowOpacity = Math.max(0, 0.5 - (distanceFromFloor / (courtHeight * 0.4)));

    const ballStyle = {
        width: R * 2,
        height: R * 2,
        borderRadius: '50%',
        backgroundColor: isPerfect ? '#fef08a' : '#fffbeb',
        backgroundImage: isPerfect 
            ? `radial-gradient(circle at 30% 30%, #ffffff, #eab308)`
            : `radial-gradient(circle at 30% 30%, #ffffff, #f59e0b)`,
        border: isPerfect ? '2px solid #facc15' : '1px solid #fde68a',
        boxShadow: isPerfect 
            ? `0 0 30px #facc15, 0 0 10px #eab308`
            : `0 0 20px rgba(251, 146, 60, ${speed / MAX_SPEED})`,
        position: 'absolute',
        top: position.top + wobble.y,
        left: position.left + wobble.x,
        transform: `rotateZ(${rotation}deg) scale(${isSquishing ? '1.3, 0.7' : '1, 1'})`,
        transition: 'transform 0.08s linear, background-color 0.2s ease',
        willChange: 'transform, left, top',
        zIndex: 10,
    };

    return (
        <>
            {trail.map((t, i) => (
                <div key={t.id} style={{
                    position: 'absolute',
                    top: t.top,
                    left: t.left,
                    width: R * 2,
                    height: R * 2,
                    borderRadius: '50%',
                    backgroundColor: t.type === 'perfect' ? '#fde047' : '#fb923c',
                    opacity: (trail.length - i) / (trail.length * 5),
                    transform: `scale(${1 - i / trail.length})`,
                    filter: t.type === 'perfect' ? 'blur(2px)' : 'none',
                    pointerEvents: 'none',
                    zIndex: 8
                }} />
            ))}
            
            <div style={{
                width: R * 3,
                height: R * 0.8,
                backgroundColor: 'rgba(0,0,0,0.8)',
                borderRadius: '50%',
                position: 'absolute',
                left: position.left - R * 0.5,
                top: courtHeight - R * 0.4,
                transform: `scale(${shadowScale})`,
                opacity: shadowOpacity,
                filter: 'blur(5px)',
                zIndex: 5,
                pointerEvents: 'none'
            }} />
            
            <div style={ballStyle}>
                {/* Visual "Stitches" for ball rotation effect */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '2px',
                    background: 'rgba(0,0,0,0.1)',
                    top: '50%',
                    transform: 'rotate(45deg)'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '2px',
                    background: 'rgba(0,0,0,0.1)',
                    top: '50%',
                    transform: 'rotate(-45deg)'
                }} />
            </div>
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
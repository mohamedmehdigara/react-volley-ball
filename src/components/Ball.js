import React, { useEffect, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * --- Physics and Core Constants ---
 */
const BALL_RADIUS = 10;
const G_EFFECTIVE = 0.5 / 10;
const AIR_DAMPING = 0.9992;
const PADDLE_BOUNCE_BASE = 1.05;
const SPIKE_INFLUENCE = 0.38;          // Increased for sharper volleys
const PERFECT_HIT_THRESHOLD = 7;       // Slightly wider sweet spot for satisfying hits
const PERFECT_BOOST = 1.30;            // More aggressive speed multiplier
const NET_DAMPING = 0.40;
const WALL_FRICTION = 0.92;            // Slightly higher to maintain "back and forth" momentum
const MAX_SPEED = 32;                  // Raised cap for high-level play
const MIN_SPEED = 2.0;

// --- Spin & Curve (Magnus Effect) ---
const MAX_HORIZONTAL_SPIN = 0.28;      
const MAX_VERTICAL_IMPULSE = 2.5;      
const SPIN_DECAY = 0.96;               
const VISUAL_ROTATION_SPEED = 360 * 6; 

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
    // Visual & State Effects
    const [curveX, setCurveX] = useState(0); 
    const [rotation, setRotation] = useState(0);
    const [isSquishing, setIsSquishing] = useState(false);
    const [isPerfect, setIsPerfect] = useState(false);
    const [trail, setTrail] = useState([]); 
    const [particles, setParticles] = useState([]); // New: Impact particles
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

    // Clean up particles
    useEffect(() => {
        if (particles.length > 0) {
            const timer = setTimeout(() => {
                setParticles(prev => prev.filter(p => p.life > 0));
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [particles]);

    const createParticles = (x, y, color) => {
        const newParticles = Array.from({ length: 8 }).map((_, i) => ({
            id: Math.random(),
            x,
            y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color
        }));
        setParticles(prev => [...prev, ...newParticles]);
    };

    /**
     * Enhanced Collision Logic
     */
    const handlePaddleHit = useCallback((ballPos, paddle, isP1, currentDir, currentSpd) => {
        const ballCenterX = ballPos.left + R;
        const ballCenterY = ballPos.top + R;

        if (!paddle || (isP1 && ballCenterX > C) || (!isP1 && ballCenterX < C)) {
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

            const distFromPaddleCenter = Math.abs(ballCenterY - (paddle.y + paddle.height / 2));
            const isPerfectHit = distFromPaddleCenter < PERFECT_HIT_THRESHOLD;
            
            setIsPerfect(isPerfectHit);
            if (isPerfectHit) {
                createParticles(ballCenterX, ballCenterY, '#facc15');
                setTimeout(() => setIsPerfect(false), 600);
            }

            const hitOffset = (ballCenterY - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
            
            setIsSquishing(true);
            setTimeout(() => setIsSquishing(false), 120);

            setCurveX(hitOffset * MAX_HORIZONTAL_SPIN);
            setRotation(prev => prev + (currentDir.x > 0 ? 1 : -1) * VISUAL_ROTATION_SPEED);

            let nX = -currentDir.x; 
            let nY = -currentDir.y + (-hitOffset * MAX_VERTICAL_IMPULSE) + (paddleVeloY * 0.18);

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

            // Kinetic Wobble
            if (state.spd > 20) {
                const intensity = (state.spd - 20) * 0.15;
                const wX = Math.sin(state.frame * 0.6) * intensity;
                const wY = Math.cos(state.frame * 0.6) * intensity;
                setWobble({ x: wX, y: wY });
            } else {
                setWobble({ x: 0, y: 0 });
            }

            let s = state.spd * AIR_DAMPING;
            let currentCurve = curveX;
            
            // Apply air resistance / Magnus effect
            let nextDir = normalize({ 
                x: state.dir.x + (currentCurve * (s / 8)), 
                y: state.dir.y + G_EFFECTIVE 
            });

            setCurveX(c => c * SPIN_DECAY);

            let nTop = state.pos.top + s * nextDir.y;
            let nLeft = state.pos.left + s * nextDir.x;

            // Boundaries: Ceiling and Walls (Back and Forth Bounce Logic)
            if (nTop <= 0) {
                nextDir.y = -nextDir.y;
                nTop = 0;
                s *= WALL_FRICTION;
                createParticles(nLeft + R, 0, '#94a3b8');
            }
            
            // Handle Horizontal Bouncing back and forth
            if (nLeft <= 0) {
                nextDir.x = Math.abs(nextDir.x); // Force move right
                nLeft = 0;
                s *= WALL_FRICTION;
                createParticles(0, nTop + R, '#94a3b8');
            } else if (nLeft + R * 2 >= courtWidth) {
                nextDir.x = -Math.abs(nextDir.x); // Force move left
                nLeft = courtWidth - R * 2;
                s *= WALL_FRICTION;
                createParticles(courtWidth, nTop + R, '#94a3b8');
            }

            // Floor/Scoring
            if (nTop + R * 2 >= courtHeight) {
                outOfBounds(nLeft + R < C ? 'player2' : 'player1');
                return;
            }

            // Net Collision
            const ballCenterX = nLeft + R;
            const ballCenterY = nTop + R;
            if (ballCenterY >= netTop && Math.abs(ballCenterX - C) < R + 5) {
                const comingFromLeft = state.pos.left + R < C;
                nextDir.x = -nextDir.x;
                s *= NET_DAMPING;
                nLeft = comingFromLeft ? (C - R - 6) : (C + R + 6);
                createParticles(ballCenterX, ballCenterY, '#334155');
            }

            // Paddle Interaction
            let result = handlePaddleHit({ top: nTop, left: nLeft }, player1Paddle, true, nextDir, s);
            if (!result.hit) {
                result = handlePaddleHit({ top: nTop, left: nLeft }, player2Paddle, false, result.dir, result.spd);
            }

            // Trail Logic
            if (state.frame % 2 === 0) {
                setTrail(prev => [{ 
                    top: nTop, 
                    left: nLeft, 
                    id: state.frame, 
                    type: isPerfect ? 'perfect' : (state.spd > 22 ? 'fast' : 'normal'),
                    speed: state.spd
                }, ...prev].slice(0, 18));
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
    const shadowOpacity = Math.max(0, 0.45 - (distanceFromFloor / (courtHeight * 0.4)));

    const ballStyle = {
        width: R * 2,
        height: R * 2,
        borderRadius: '50%',
        backgroundColor: isPerfect ? '#fef08a' : '#fffbeb',
        backgroundImage: isPerfect 
            ? `radial-gradient(circle at 35% 35%, #ffffff, #facc15, #ca8a04)`
            : `radial-gradient(circle at 35% 35%, #ffffff, #fbbf24, #d97706)`,
        border: isPerfect ? '2px solid #eab308' : '1px solid #fcd34d',
        boxShadow: isPerfect 
            ? `0 0 50px #facc15, 0 0 20px #ca8a04, 0 0 100px rgba(250, 204, 21, 0.3)`
            : `0 0 ${10 + (speed / 2)}px rgba(251, 191, 36, ${speed / MAX_SPEED})`,
        position: 'absolute',
        top: position.top + wobble.y,
        left: position.left + wobble.x,
        transform: `rotateZ(${rotation}deg) scale(${isSquishing ? '1.5, 0.6' : '1, 1'})`,
        transition: 'transform 0.04s linear, background-color 0.2s ease',
        willChange: 'transform, left, top',
        zIndex: 10,
    };

    return (
        <>
            {/* Particles */}
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute',
                    left: p.x,
                    top: p.y,
                    width: 4,
                    height: 4,
                    backgroundColor: p.color,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 15,
                    transform: `translate(${(1 - p.life) * p.vx * 10}px, ${(1 - p.life) * p.vy * 10}px) scale(${p.life})`,
                    opacity: p.life,
                }} />
            ))}

            {/* Motion Trail */}
            {trail.map((t, i) => (
                <div key={t.id} style={{
                    position: 'absolute',
                    top: t.top,
                    left: t.left,
                    width: R * 2,
                    height: R * 2,
                    borderRadius: '50%',
                    backgroundColor: t.type === 'perfect' ? '#facc15' : (t.type === 'fast' ? '#fb923c' : '#fbbf24'),
                    opacity: (trail.length - i) / (trail.length * 8),
                    transform: `scale(${1 - (i / trail.length) * 0.8})`,
                    filter: `blur(${t.type === 'normal' ? '1px' : '4px'})`,
                    pointerEvents: 'none',
                    zIndex: 8
                }} />
            ))}
            
            {/* Ground Shadow */}
            <div style={{
                width: R * 3.5,
                height: R * 0.8,
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: '50%',
                position: 'absolute',
                left: position.left - R * 0.75,
                top: courtHeight - R * 0.4,
                transform: `scale(${shadowScale})`,
                opacity: shadowOpacity,
                filter: 'blur(8px)',
                zIndex: 5,
                pointerEvents: 'none'
            }} />
            
            {/* Main Ball Component */}
            <div style={ballStyle}>
                {/* Visual Stitches */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '1px',
                    background: 'rgba(0,0,0,0.15)',
                    top: '50%',
                    transform: 'rotate(45deg)'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '1px',
                    background: 'rgba(0,0,0,0.15)',
                    top: '50%',
                    transform: 'rotate(-45deg)'
                }} />
                {/* Shine Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '15%',
                    left: '15%',
                    width: '30%',
                    height: '30%',
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: '50%',
                    filter: 'blur(2px)'
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
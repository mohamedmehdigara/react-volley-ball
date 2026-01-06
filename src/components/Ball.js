import React, { useEffect, useCallback, useRef, useState } from 'react';

const BALL_RADIUS = 10;
const G_EFFECTIVE = 0.05;
const AIR_DAMPING = 0.999;
const PADDLE_BOUNCE = 1.05;
const PERFECT_HIT_THRESHOLD = 8;
const MAX_SPEED = 30;
const MIN_SPEED = 3;
const SPIN_DECAY = 0.97;

const normalize = (v) => {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  return mag < 1e-6 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
};

const Ball = ({
  position = { top: 0, left: 0 },
  speed = 0,
  direction = { x: 0, y: 0 },
  courtWidth,
  courtHeight,
  netTop,
  onPaddleCollision,
  outOfBounds,
  player1Paddle,
  player2Paddle,
  onBallUpdate,
  isServed,
}) => {
  const [visuals, setVisuals] = useState({ rotation: 0, trail: [], isPerfect: false });
  
  // Use a ref to track physics state to avoid stale closures in requestAnimationFrame
  const physicsRef = useRef({ 
    pos: position, 
    spd: speed, 
    dir: direction, 
    curve: 0, 
    frame: 0 
  });

  // Keep ref in sync with props from the parent
  useEffect(() => {
    if (position) physicsRef.current.pos = position;
    if (speed !== undefined) physicsRef.current.spd = speed;
    if (direction) physicsRef.current.dir = direction;
  }, [position, speed, direction]);

  const handlePaddleHit = useCallback((ballPos, paddle, isP1) => {
    if (!paddle || !ballPos) return null;
    
    const ballCenterX = ballPos.left + BALL_RADIUS;
    const ballCenterY = ballPos.top + BALL_RADIUS;
    const centerLine = courtWidth / 2;

    // Boundary check: players can only hit the ball on their own side
    if ((isP1 && ballCenterX > centerLine) || (!isP1 && ballCenterX < centerLine)) return null;

    const closestX = Math.max(paddle.x, Math.min(ballCenterX, paddle.x + paddle.width));
    const closestY = Math.max(paddle.y, Math.min(ballCenterY, paddle.y + paddle.height));
    const distance = Math.sqrt((ballCenterX - closestX) ** 2 + (ballCenterY - closestY) ** 2);

    if (distance < BALL_RADIUS) {
      const hitOffset = (ballCenterY - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
      const isPerfect = Math.abs(ballCenterY - (paddle.y + paddle.height / 2)) < PERFECT_HIT_THRESHOLD;
      
      onPaddleCollision(isP1 ? 'player1' : 'player2');
      
      physicsRef.current.curve = hitOffset * 0.25;
      const nDir = normalize({ 
        x: isP1 ? 1 : -1, 
        y: hitOffset * 1.5 
      });

      return {
        spd: Math.min(MAX_SPEED, Math.max(MIN_SPEED, physicsRef.current.spd * (isPerfect ? 1.25 : PADDLE_BOUNCE))),
        dir: nDir,
        isPerfect
      };
    }
    return null;
  }, [courtWidth, onPaddleCollision]);

  useEffect(() => {
    let raf;
    const update = () => {
      const p = physicsRef.current;
      
      // Don't process physics if not served or missing data
      if (!isServed || !p.pos) { 
        raf = requestAnimationFrame(update); 
        return; 
      }

      p.frame++;
      let s = p.spd * AIR_DAMPING;
      let nextDir = normalize({ x: p.dir.x + p.curve, y: p.dir.y + G_EFFECTIVE });
      p.curve *= SPIN_DECAY;

      let nTop = p.pos.top + s * nextDir.y;
      let nLeft = p.pos.left + s * nextDir.x;

      // Wall Bounces (Ceiling)
      if (nTop <= 0) { 
        nextDir.y = Math.abs(nextDir.y); 
        nTop = 0; 
        s *= 0.9; 
      }
      
      // Side Wall Bounces
      if (nLeft <= 0 || nLeft + BALL_RADIUS * 2 >= courtWidth) {
        nextDir.x *= -1;
        nLeft = nLeft <= 0 ? 0 : courtWidth - BALL_RADIUS * 2;
        s *= 0.9;
      }

      // Net Collision
      const ballCenterX = nLeft + BALL_RADIUS;
      const ballCenterY = nTop + BALL_RADIUS;
      if (ballCenterY > netTop && Math.abs(ballCenterX - courtWidth / 2) < BALL_RADIUS + 2) {
        nextDir.x *= -1;
        s *= 0.5;
        nLeft = ballCenterX < courtWidth / 2 ? (courtWidth / 2 - BALL_RADIUS - 3) : (courtWidth / 2 + BALL_RADIUS + 3);
      }

      // Floor / Point Scored
      if (nTop + BALL_RADIUS * 2 >= courtHeight) {
        outOfBounds(nLeft + BALL_RADIUS < courtWidth / 2 ? 'player2' : 'player1');
        return;
      }

      // Paddle Checks
      const p1Hit = handlePaddleHit({ top: nTop, left: nLeft }, player1Paddle, true);
      const p2Hit = handlePaddleHit({ top: nTop, left: nLeft }, player2Paddle, false);
      const hit = p1Hit || p2Hit;

      if (hit) {
        s = hit.spd;
        nextDir = hit.dir;
        setVisuals(v => ({ ...v, isPerfect: hit.isPerfect, rotation: v.rotation + 180 }));
      }

      // Notify parent of new state
      onBallUpdate({ position: { top: nTop, left: nLeft }, speed: s, direction: nextDir });
      
      // Update trail every few frames for performance
      if (p.frame % 3 === 0) {
        setVisuals(v => ({
          ...v,
          trail: [{ top: nTop, left: nLeft, id: p.frame }, ...v.trail].slice(0, 8)
        }));
      }

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [isServed, courtWidth, courtHeight, netTop, onBallUpdate, outOfBounds, player1Paddle, player2Paddle, handlePaddleHit]);

  // Safety check to prevent "cannot read properties of undefined"
  if (!position) return null;

  const shadowScale = Math.max(0.2, 1 - (courtHeight - position.top) / courtHeight);

  return (
    <>
      {/* Ground Shadow */}
      <div style={{
        position: 'absolute',
        left: position.left,
        top: courtHeight - 5,
        width: BALL_RADIUS * 2,
        height: 6,
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '50%',
        transform: `scale(${shadowScale})`,
        filter: 'blur(3px)',
        pointerEvents: 'none'
      }} />

      {/* Motion Trail */}
      {visuals.trail.map((t, i) => (
        <div key={t.id} style={{
          position: 'absolute',
          left: t.left,
          top: t.top,
          width: BALL_RADIUS * 2,
          height: BALL_RADIUS * 2,
          borderRadius: '50%',
          background: visuals.isPerfect ? '#facc15' : '#e2e8f0',
          opacity: 0.25 - i * 0.03,
          transform: `scale(${1 - i * 0.05})`,
          pointerEvents: 'none',
          zIndex: 10
        }} />
      ))}

      {/* Main Ball */}
      <div style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width: BALL_RADIUS * 2,
        height: BALL_RADIUS * 2,
        borderRadius: '50%',
        background: visuals.isPerfect 
          ? 'radial-gradient(circle at 35% 35%, #fff, #fbbf24, #d97706)' 
          : 'radial-gradient(circle at 35% 35%, #fff, #fef08a, #ca8a04)',
        boxShadow: visuals.isPerfect ? '0 0 20px #fbbf24' : '0 2px 4px rgba(0,0,0,0.1)',
        transform: `rotate(${visuals.rotation}deg)`,
        transition: 'transform 0.15s ease-out',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        {/* Simple Ball Seam */}
        <div style={{
          width: '100%',
          height: '1px',
          background: 'rgba(0,0,0,0.1)',
          transform: 'rotate(45deg)'
        }} />
      </div>
    </>
  );
};

export default  Ball;
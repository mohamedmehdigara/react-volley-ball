import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SAT from 'sat';

// --- Component Styling ---
const BallDiv = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: red;
  position: absolute;
  top: ${(p) => p.top}px;
  left: ${(p) => p.left}px;
`;
// -------------------------

const Ball = ({
  initialPosition = { top: 200, left: 400 },
  initialSpeed = 0,
  initialDirection = { x: 0, y: 0 }, // Ensure default object exists
  ...P // Collect all other props
}) => {
  // FIX: Use default props directly in useState, ensuring they are never undefined
  const [pos, setPos] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [dir, setDir] = useState(initialDirection);
  const [, setSpinY] = useState(0); 

  const R = 10; // Radius
  const G = 0.5; // Gravity
  const AR = 0.01; // Air Resistance
  const C = P.courtWidth / 2; // Net Center

  // Resync state on parent change (e.g., serve/reset)
  useEffect(() => {
    setPos(initialPosition);
    setSpeed(initialSpeed);
    setDir(initialDirection);
  }, [initialPosition, initialSpeed, initialDirection]);

  // --- Collision Logic ---
  const collision = (ballPos, paddle, isP1) => {
    // Spatial Check & Null Check
    if ((isP1 && ballPos.left > C) || (!isP1 && ballPos.left < C) || !paddle) return false;

    const ballC = new SAT.Circle(new SAT.Vector(ballPos.left, ballPos.top), R);
    const paddleR = new SAT.Polygon(new SAT.Vector(paddle.x, paddle.y), [
      new SAT.Vector(0, 0), new SAT.Vector(paddle.width, 0), new SAT.Vector(paddle.width, paddle.height), new SAT.Vector(0, paddle.height)
    ]);

    if (SAT.testCirclePolygon(ballC, paddleR)) {
      setDir((prev) => ({ ...prev, x: -prev.x }));
      
      const hitY = ballPos.top - (paddle.y + paddle.height / 2);
      setSpinY(hitY / (P.paddleHeight / 2) * 0.5); 
      
      P.onPaddleCollision(isP1 ? 'player1' : 'player2');
      return true;
    }
    return false;
  };
  
  // --- Animation Loop ---
  const animate = () => {
    if (speed === 0) return requestAnimationFrame(animate);

    let s = speed * (1 - AR);
    let newDir = { x: dir.x, y: dir.y + G / 10 };
    let newTop = pos.top + s * newDir.y;
    let newLeft = pos.left + s * newDir.x;

    // 1. FLOOR BOUNDARY SCORING
    if (newTop + R >= P.courtHeight) {
      P.outOfBounds(newLeft < C ? 'player2' : 'player1');
      return;
    }

    // 2. NET COLLISION (Fault)
    if (newTop + R >= P.netTop && Math.abs(newLeft - C) < R) {
      P.outOfBounds(newLeft < C ? 'player1' : 'player2');
      return;
    }

    // 3. PADDLE COLLISION
    collision({ top: newTop, left: newLeft }, P.player1Paddle, true);
    collision({ top: newTop, left: newLeft }, P.player2Paddle, false);
    
    // 4. Update state
    P.onBallUpdate({ position: { top: newTop, left: newLeft }, speed: s, direction: newDir });
    
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [pos, speed, dir, P.courtWidth, P.courtHeight, P.netTop, P.player1Paddle, P.player2Paddle]);

  return <BallDiv top={pos.top} left={pos.left} />;
};

export default Ball;
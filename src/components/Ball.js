// src/components/Ball.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SAT from 'sat';

// --- Component Styling ---
const BallDiv = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  /* Volleyball colors: White background with subtle segments */
  background: radial-gradient(circle at 30% 30%, #fff, #f0f0f0);
  border: 1px solid #ccc;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  position: absolute;
  top: ${(p) => p.top}px;
  left: ${(p) => p.left}px;
  transition: transform 0.1s linear; 
`;
// -------------------------

const Ball = ({
  initialPosition = { top: 200, left: 400 },
  initialSpeed = 0,
  initialDirection = { x: 0, y: 0 }, 
  ...P // Collect all other props
}) => {
  const [pos, setPos] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [dir, setDir] = useState(initialDirection);
  const [, setSpinY] = useState(0); 

  const R = 10; 
  const G = 0.5; 
  const AR = 0.01; 
  const C = P.courtWidth / 2; 

  // Resync state on parent change (e.g., serve/reset)
  useEffect(() => {
    setPos(initialPosition);
    setSpeed(initialSpeed);
    setDir(initialDirection);
  }, [initialPosition, initialSpeed, initialDirection]);

  // --- Collision Logic ---
  const collision = (ballPos, paddle, isP1) => {
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
    // FIX: Only pause movement if speed is exactly zero, 
    // but the loop MUST continue running to check for serve input from App.js
    if (speed === 0 && !P.initialDirection.x && !P.initialDirection.y) {
       requestAnimationFrame(animate);
       return;
    }

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
    
    // 3. HORIZONTAL WALL BOUNCE (Kept for safety, though should rarely happen)
    if (newLeft - R <= 0 || newLeft + R >= P.courtWidth) {
        newDir.x = -newDir.x;
    }

    // 4. PADDLE COLLISION 
    collision({ top: newTop, left: newLeft }, P.player1Paddle, true);
    collision({ top: newTop, left: newLeft }, P.player2Paddle, false);
    
    // 5. Update state
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
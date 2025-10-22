// src/components/Ball.js (FINAL, STATELESS PHYSICS)

import React, { useEffect } from 'react';
import styled from 'styled-components';
import SAT from 'sat';

// --- Component Styling ---
const BallDiv = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
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
  courtWidth,
  courtHeight,
  netTop,
  onPaddleCollision,
  outOfBounds,
  player1Paddle,
  player2Paddle,
  onBallUpdate, // This setter now dictates movement
  paddleHeight,
  // Power-up props omitted for simplicity, but included in the prop spread if needed
  ...P
}) => {
  // REMOVE useState for position, speed, and direction.
  // We only keep spin as it's locally calculated.
  const [spinY, setSpinY] = React.useState(0); 

  const R = 10; 
  const G = 0.5; 
  const AR = 0.01; 
  const C = courtWidth / 2; 

  // Collision logic now reads the current position/speed/direction directly from props
  const collision = (ballPos, paddle, isP1, currentDirection) => {
    if ((isP1 && ballPos.left > C) || (!isP1 && ballPos.left < C) || !paddle) return currentDirection;

    const ballC = new SAT.Circle(new SAT.Vector(ballPos.left, ballPos.top), R);
    const paddleR = new SAT.Polygon(new SAT.Vector(paddle.x, paddle.y), [
      new SAT.Vector(0, 0), new SAT.Vector(paddle.width, 0), new SAT.Vector(paddle.width, paddle.height), new SAT.Vector(0, paddle.height)
    ]);

    if (SAT.testCirclePolygon(ballC, paddleR)) {
      // Collision occurred! Calculate new direction
      const newDirection = { ...currentDirection, x: -currentDirection.x };
      
      const hitY = ballPos.top - (paddle.y + paddle.height / 2);
      setSpinY(hitY / (paddleHeight / 2) * 0.5); 
      
      onPaddleCollision(isP1 ? 'player1' : 'player2');
      return newDirection;
    }
    return currentDirection; // Return direction unchanged
  };
  
  // --- Animation Loop ---
  // The loop is now defined inside a hook to capture the latest props/values.
  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      // Read current state directly from the props (which are updated by App.js)
      let currentPos = initialPosition;
      let currentSpeed = initialSpeed;
      let currentDir = initialDirection;

      if (currentSpeed === 0 && currentDir.x === 0 && currentDir.y === 0) {
        // Still paused, just request next frame to check again
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      // 1. Apply Physics
      let s = currentSpeed * (1 - AR);
      let newDir = { x: currentDir.x, y: currentDir.y + G / 10 };
      let newTop = currentPos.top + s * newDir.y;
      let newLeft = currentPos.left + s * newDir.x;

      // 2. FLOOR BOUNDARY SCORING (must happen before collision update)
      if (newTop + R >= courtHeight) {
        outOfBounds(newLeft < C ? 'player2' : 'player1');
        return;
      }

      // 3. NET COLLISION (Fault)
      if (newTop + R >= netTop && Math.abs(newLeft - C) < R) {
        outOfBounds(newLeft < C ? 'player1' : 'player2');
        return;
      }
      
      // 4. HORIZONTAL WALL BOUNCE
      if (newLeft - R <= 0 || newLeft + R >= courtWidth) {
          newDir.x = -newDir.x;
      }

      // 5. PADDLE COLLISION (Updates newDir if collision occurs)
      newDir = collision({ top: newTop, left: newLeft }, player1Paddle, true, newDir);
      newDir = collision({ top: newTop, left: newLeft }, player2Paddle, false, newDir);
      
      // 6. Update Parent State (This triggers a re-render with new props/positions)
      onBallUpdate({ position: { top: newTop, left: newLeft }, speed: s, direction: newDir });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
    
    // The dependency array is now HUGE, but it correctly ensures the loop uses the LATEST props/state
  }, [initialPosition, initialSpeed, initialDirection, courtWidth, courtHeight, netTop, player1Paddle, player2Paddle, onBallUpdate, onPaddleCollision, outOfBounds]);

  // The return statement still relies on the current initialPosition prop for rendering
  return <BallDiv top={initialPosition.top} left={initialPosition.left} />;
};

export default Ball;
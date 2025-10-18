import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SAT from 'sat'; // Necessary for collision detection

// --- Component Styling ---
const BallDiv = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: red;
  position: absolute;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
`;
// -------------------------

const Ball = ({
  initialPosition = { top: 200, left: 400 },
  initialSpeed,
  initialDirection,
  courtWidth,
  courtHeight,
  netTop,
  onPaddleCollision,
  outOfBounds,
  player1Paddle,
  player2Paddle,
  onBallUpdate,
  paddleHeight,
  // PowerUp props are kept but unused logic is removed for minimalism
  powerUpState, setPowerUpState, applyPowerUpEffect, 
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);
  const [, setSpinX] = useState(0); 
  const [, setSpinY] = useState(0);

  const BALL_RADIUS = 10;
  const GRAVITY = 0.5;
  const AIR_RESISTANCE = 0.01;
  const NET_CENTER = courtWidth / 2;

  // Resync state on parent change (e.g., serve/reset)
  useEffect(() => {
    setPosition(initialPosition);
    setSpeed(initialSpeed);
    setDirection(initialDirection);
  }, [initialPosition, initialSpeed, initialDirection]);

  // --- Core Collision Logic ---

  const isPlayerCollision = (ballPos, paddle, isPlayer1) => {
    // Spatial Check: Ensure collision check is only on the paddle's side
    if (isPlayer1 && ballPos.left > NET_CENTER) return false;
    if (!isPlayer1 && ballPos.left < NET_CENTER) return false;

    const ballCircle = new SAT.Circle(new SAT.Vector(ballPos.left, ballPos.top), BALL_RADIUS);
    if (!paddle) return false;

    const paddleRect = new SAT.Polygon(
      new SAT.Vector(paddle.x, paddle.y),
      [new SAT.Vector(0, 0), new SAT.Vector(paddle.width, 0), new SAT.Vector(paddle.width, paddle.height), new SAT.Vector(0, paddle.height)]
    );

    if (SAT.testCirclePolygon(ballCircle, paddleRect)) {
      setDirection((prev) => ({ ...prev, x: -prev.x })); // Reverse X direction
      
      // Calculate and apply spin
      const hitPointY = ballPos.top - (paddle.y + paddle.height / 2);
      setSpinY(hitPointY / (paddleHeight / 2) * 0.5); 
      
      onPaddleCollision(isPlayer1 ? 'player1' : 'player2');
      return true;
    }
    return false;
  };
  
  // --- Animation Loop ---

  const animateBall = () => {
    if (speed === 0) {
      requestAnimationFrame(animateBall);
      return;
    }

    let currentSpeed = speed * (1 - AIR_RESISTANCE);
    let newDirection = {
      x: direction.x,
      y: direction.y + GRAVITY / 10, // Apply gravity
    };

    const newTop = position.top + currentSpeed * newDirection.y;
    const newLeft = position.left + currentSpeed * newDirection.x;

    // 1. COURT BOUNDARY SCORING (Volleyball: hits the floor)
    if (newTop + BALL_RADIUS >= courtHeight) {
      const losingPlayer = newLeft < NET_CENTER ? 'player1' : 'player2';
      outOfBounds(losingPlayer);
      return;
    }

    // 2. NET COLLISION (Fault if ball hits net rope)
    if (newTop + BALL_RADIUS >= netTop && Math.abs(newLeft - NET_CENTER) < BALL_RADIUS) {
      const losingPlayer = newLeft < NET_CENTER ? 'player1' : 'player2';
      outOfBounds(losingPlayer);
      return;
    }

    // 3. PADDLE COLLISION
    isPlayerCollision({ top: newTop, left: newLeft }, player1Paddle, true);
    isPlayerCollision({ top: newTop, left: newLeft }, player2Paddle, false);
    
    // (Power-up logic is omitted for minimum size, but the props remain)

    // 4. Update state and continue loop
    onBallUpdate({
      position: { top: newTop, left: newLeft },
      speed: currentSpeed,
      direction: newDirection,
    });
    
    requestAnimationFrame(animateBall);
  };

  useEffect(() => {
    const animationFrame = requestAnimationFrame(animateBall);
    return () => cancelAnimationFrame(animationFrame);
  }, [position, speed, direction, courtWidth, courtHeight, netTop, player1Paddle, player2Paddle]);

  return <BallDiv top={position.top} left={position.left} />;
};

export default Ball;
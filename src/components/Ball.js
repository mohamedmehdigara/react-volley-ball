import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import SAT from 'sat';

const Ball = ({
  initialPosition = { top: 200, left: 400 },
  initialSpeed,
  initialDirection,
  courtWidth,
  courtHeight,
  netTop, // New prop for net collision height
  onPaddleCollision,
  outOfBounds,
  player1Paddle,
  player2Paddle,
  onBallUpdate,
  paddleHeight,
  powerUpState,
  setPowerUpState,
  applyPowerUpEffect,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);
  const [spinX, setSpinX] = useState(0); 
  const [spinY, setSpinY] = useState(0);
  const [gravity, setGravity] = useState(0.5); // Stronger gravity for volleyball feel
  const [airResistance, setAirResistance] = useState(0.01);
  const bounciness = 1;

  const ballRadius = 10;
  const netCenter = courtWidth / 2;

  // Sync state with props when parent state changes (e.g., on game reset/serve)
  useEffect(() => {
    setPosition(initialPosition);
    setSpeed(initialSpeed);
    setDirection(initialDirection);
  }, [initialPosition, initialSpeed, initialDirection]);

  const isPlayerCollision = (ballPosition, playerPaddle, isPlayer1) => {
    // Check if the ball is even on the paddle's side
    if (isPlayer1 && ballPosition.left > netCenter) return false;
    if (!isPlayer1 && ballPosition.left < netCenter) return false;

    const ballCircle = new SAT.Circle(new SAT.Vector(ballPosition.left, ballPosition.top), ballRadius);
    
    if (!playerPaddle) return false;

    // Paddle coordinates are now X, Y instead of left, top
    const paddleRect = new SAT.Polygon(
      new SAT.Vector(playerPaddle.x, playerPaddle.y),
      [
        new SAT.Vector(0, 0),
        new SAT.Vector(playerPaddle.width, 0),
        new SAT.Vector(playerPaddle.width, playerPaddle.height),
        new SAT.Vector(0, playerPaddle.height),
      ]
    );

    const collided = SAT.testCirclePolygon(ballCircle, paddleRect);

    if (collided) {
      // Reverse X direction for the bounce
      setDirection((prevDirection) => ({ ...prevDirection, x: -prevDirection.x }));

      // Vertical spin logic (hitting top/bottom of player)
      const paddleCenterY = playerPaddle.y + playerPaddle.height / 2;
      const hitPointY = ballPosition.top - paddleCenterY;
      setSpinY(hitPointY / (paddleHeight / 2) * 0.5); 

      // Horizontal spin logic (hitting left/right of player)
      const paddleCenterX = playerPaddle.x + playerPaddle.width / 2;
      const hitPointX = ballPosition.left - paddleCenterX;
      setSpinX(hitPointX / (playerPaddle.width / 2) * 0.5);

      onPaddleCollision(isPlayer1 ? 'player1' : 'player2');
      return true;
    }
    return false;
  };

  // ... (isPowerUpCollision function - remains mostly the same)

  const animateBall = () => {
    if (speed === 0) return; // Don't move if not served

    let currentSpeed = speed * (1 - airResistance);
    let newDirection = {
      x: direction.x,
      y: direction.y + gravity / 10, // Apply gravity
    };

    const newTop = position.top + currentSpeed * newDirection.y;
    const newLeft = position.left + currentSpeed * newDirection.x;

    // 1. COURT BOUNDARY SCORING (Volleyball specific: hits the floor)
    if (newTop + ballRadius >= courtHeight) {
      if (newLeft < netCenter) {
        // Ball lands on Player 1's side (Point for Player 2)
        outOfBounds('player2');
        return;
      } else {
        // Ball lands on Player 2's side (Point for Player 1)
        outOfBounds('player1');
        return;
      }
    }

    // 2. NET COLLISION (Net is Y=netTop)
    if (
      newTop + ballRadius >= netTop && // Ball is below the net rope
      Math.abs(newLeft - netCenter) < ballRadius // Ball is near the net center
    ) {
        // Net fault (point to the side the ball came from, or the side the ball is failing to clear)
        const losingPlayer = newLeft < netCenter ? 'player1' : 'player2';
        outOfBounds(losingPlayer);
        return;
    }

    // 3. HORIZONTAL WALL BOUNCE (Shouldn't happen in volleyball, but keep for safety)
    if (newLeft - ballRadius <= 0 || newLeft + ballRadius >= courtWidth) {
      newDirection.x = -newDirection.x;
    }
    
    // 4. PADDLE COLLISION (X and Y coordinates are complex now)
    const player1Hit = isPlayerCollision({ top: newTop, left: newLeft }, player1Paddle, true);
    const player2Hit = isPlayerCollision({ top: newTop, left: newLeft }, player2Paddle, false);

    if (player1Hit || player2Hit) {
        // Collision updates done inside isPlayerCollision
    }

    // ... (Power-up collision logic)

    onBallUpdate({
      position: { top: newTop, left: newLeft },
      speed: currentSpeed,
      direction: newDirection,
      // Spin states are managed by setters inside isPlayerCollision
    });
    
    requestAnimationFrame(animateBall);
  };

  // ... (useEffect hook and BallDiv styling)

  return <Ball top={position.top} left={position.left} />;
};

export default Ball;
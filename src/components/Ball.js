import React, { useState, useEffect } from 'react';
import styled from 'styled-components';



function Ball({
  initialPosition = { top: 200, left: 400 },
  initialSpeed = 5,
  initialDirection = { x: 1, y: 1 },
  initialSpinX = 0,
  initialSpinY = 0,
  airResistance = 0.01,
  courtWidth,
  courtHeight,
  netWidth,
  netHeight,
  onPlayerCollision,
  outOfBounds,
  player1Paddle,
  player2Paddle,
}) {
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);
  const [spinX, setSpinX] = useState(initialSpinX);
  const [spinY, setSpinY] = useState(initialSpinY);

  const ballRadius = 10;

  const isPlayerCollision = (ballPosition, ballRadius, playerPaddle) => {
    // ... (same as before)
  };

  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

  const resetBall = () => {
    setPosition(initialPosition);
    setSpeed(initialSpeed);
    // Set initial direction and spin based on desired reset behavior
    setDirection({ x: 1, y: 1 }); // Adjust initial direction as needed
    setSpinX(0);
    setSpinY(0);
  };

  const Ball = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: red;
  position: absolute;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
`;

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newTop = position.top + speed * direction.y + spinY;
      const newLeft = position.left + speed * direction.x + spinX;

      // Apply air resistance
      setSpeed(Math.max(speed - airResistance, 0));

      // Check for collisions with court boundaries
      if (newTop - ballRadius <= 0 || newTop + ballRadius >= courtHeight) {
        setDirection({ ...direction, y: -direction.y });
        setSpinY(-spinY); // Reverse spin on y-axis
      }
      if (newLeft - ballRadius <= 0) {
        // Player 2 scores
        if (outOfBounds) {
          outOfBounds('player2');
        }
        resetBall(); // Reset ball position and direction
      } else if (newLeft + ballRadius >= courtWidth) {
        // Player 1 scores
        if (outOfBounds) {
          outOfBounds('player1');
        }
        resetBall();
      }

      // Check for net collision
      // ... (same as before)

      // Check for player collisions
      // ... (same as before)

      setPosition({ top: newTop, left: newLeft });
    }, 10);

    return () => clearInterval(intervalId);
  }, [position, speed, direction, spinX, spinY, airResistance, courtWidth, courtHeight, netWidth, netHeight, onPlayerCollision, outOfBounds, playerPaddle]);

  return <Ball top={position.top} left={position.left} />;
}

export default Ball;
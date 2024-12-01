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
  powerUps,
}) {
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);
  const [spinX, setSpinX] = useState(initialSpinX);
  const [spinY, setSpinY] = useState(initialSpinY);

  const ballRadius = 10;

  const isPlayerCollision = (ballPosition, ballRadius, playerPaddle) => {
    const { top, left, width, height } = playerPaddle;

    if (
      ballPosition.top + ballRadius >= top &&
      ballPosition.top - ballRadius <= top + height &&
      ballPosition.left + ballRadius >= left &&
      ballPosition.left - ballRadius <= left + width
    ) {
      const impactY = (ballPosition.top - top) / height;
      return {
        side: impactY < 0.5 ? 'top' : 'bottom',
        impactY,
      };
    }
    return null;
  };

  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

  const resetBall = () => {
    setPosition(initialPosition);
    setSpeed(initialSpeed);
    setDirection({ x: 1, y: 1 });
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
        setSpinY(-spinY);
      }
      if (newLeft - ballRadius <= 0) {
        outOfBounds('player2');
        resetBall();
      } else if (newLeft + ballRadius >= courtWidth) {
        outOfBounds('player1');
        resetBall();
      }

      // Check for net collision
      if (newLeft >= courtWidth / 2 - netWidth / 2 && newLeft <= courtWidth / 2 + netWidth / 2 && newTop >= 0 && newTop <= netHeight) {
        setDirection({ ...direction, y: -direction.y });
        setSpinY(-spinY);
        setSpeed(speed * 0.8);
      }

      // Check for player collisions and power-ups
      const player1Collision = isPlayerCollision(position, ballRadius, player1Paddle);
      const player2Collision = isPlayerCollision(position, ballRadius, player2Paddle);

      if (player1Collision || player2Collision) {
        const collisionData = player1Collision || player2Collision;
        const { side, impactY } = collisionData;

        // Update ball direction and spin based on collision
        setDirection({ ...direction, y: -direction.y });
        setSpinY(-spinY);

        // Adjust spin based on impact point
        const spinImpact = Math.abs(impactY - 0.5) * 0.5;
        setSpinX(spinX * (1 - spinImpact) + sign(impactY - 0.5) * spinY * spinImpact);
        setSpinY(spinY * (1 - spinImpact) - sign(impactY - 0.5) * spinX * spinImpact);

        // Apply power-up effects if applicable
        if (powerUps.length > 0) {
          const currentPowerUp = powerUps[0];
          if (isPowerUpActive(currentPowerUp, position)) {
            applyPowerUpEffect(currentPowerUp);
            powerUps.shift(); // Remove used power-up
          }
        }
      }

      setPosition({ top: newTop, left: newLeft });
    }, 10);

    return () => clearInterval(intervalId);
  }, [position, speed, direction, spinX, spinY, airResistance, courtWidth, courtHeight, netWidth, netHeight, onPlayerCollision, outOfBounds, player1Paddle, player2Paddle, powerUps]);

  return <Ball top={position.top} left={position.left} />;
}

export default Ball;
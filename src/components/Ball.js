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
  playerPaddle,
}) {
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);
  const [spinX, setSpinX] = useState(initialSpinX);
  const [spinY, setSpinY] = useState(initialSpinY);

  const ballRadius = 10;

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
      if (newLeft - ballRadius <= 0 || newLeft + ballRadius >= courtWidth) {
        setDirection({ ...direction, x: -direction.x });
        setSpinX(-spinX); // Reverse spin on x-axis
      }

      // Check for net collision
      if (newLeft >= courtWidth / 2 - netWidth / 2 && newLeft <= courtWidth / 2 + netWidth / 2 && newTop >= 0 && newTop <= netHeight) {
        // Handle net collision (e.g., bounce back, lose point)
        setDirection({ ...direction, y: -direction.y });
        setSpinY(-spinY); // Reverse spin on y-axis
        setSpeed(speed * 0.8); // Reduce speed after net collision
      }

      // Check for player collisions
      if (onPlayerCollision) {
        const collisionData = isPlayerCollision(position, ballRadius, playerPaddle);
        if (collisionData) {
          const { side, impactY } = collisionData;
          onPlayerCollision(collisionData); // Call the callback with collision details

          // Update ball direction and spin based on collision
          setDirection({ ...direction, y: -direction.y });
          setSpinY(-spinY); // Reverse spin on y-axis

          // Adjust spin based on impact point
          const spinImpact = Math.abs(impactY - 0.5) * 0.5;
          setSpinX(spinX * (1 - spinImpact) + sign(impactY - 0.5) * spinY * spinImpact);
          setSpinY(spinY * (1 - spinImpact) - sign(impactY - 0.5) * spinX * spinImpact);
        }
      }

      // Out-of-bounds detection
      if (newTop - ballRadius < 0 || newTop + ballRadius > courtHeight || newLeft - ballRadius < 0 || newLeft + ballRadius > courtWidth) {
        if (outOfBounds) {
          outOfBounds();
        }
      }

      setPosition({ top: newTop, left: newLeft });
    }, 10);

    return () => clearInterval(intervalId);
  }, [position, speed, direction, spinX, spinY, airResistance, courtWidth, courtHeight, netWidth, netHeight, onPlayerCollision, outOfBounds, playerPaddle]);

  return <Ball top={position.top} left={position.left} />;
}

export default Ball;
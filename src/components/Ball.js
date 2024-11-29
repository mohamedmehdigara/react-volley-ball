import React, { useState, useEffect } from 'react';
import styled from 'styled-components';



function Ball({ initialPosition = { top: 200, left: 400 }, initialSpeed = 5, initialDirection = { x: 1, y: 1 }, initialSpinX = 0, initialSpinY = 0, airResistance = 0.01, courtWidth, courtHeight, netWidth }) {
  const Ball = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: red;
  position: absolute;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
`;
  
  
  
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);
  const [spinX, setSpinX] = useState(initialSpinX);
  const [spinY, setSpinY] = useState(initialSpinY);

  const ballRadius = 10; // Define ball radius here

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
        // ...
      }

      // Check for player collisions (implement later)

      setPosition({ top: newTop, left: newLeft });
    }, 10);

    return () => clearInterval(intervalId);
  }, [position, speed, direction, spinX, spinY, airResistance, courtWidth, courtHeight, netWidth]);

  return <Ball top={position.top} left={position.left} />;
}

export default Ball;
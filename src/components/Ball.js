import React, { useState, useEffect } from 'react';
import styled from 'styled-components';



function Ball({ initialPosition = { top: 200, left: 400 }, speed, direction = { x: 1, y: 1 }, radius = 10 }) {
  const Ball = styled.div`
  width: 20px;
  height: 20px;
  background-color: red;
  border-radius: 50%; /* Add rounded shape */
  position: absolute;
 
`;
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Update ball position based on speed and direction
      const newTop = position.top + speed * direction.y;
      const newLeft = position.left + speed * direction.x;

      // Check for ball collisions with court boundaries (add logic here)
      // ... (This logic depends on your court dimensions)

      setPosition({ top: newTop, left: newLeft });
    }, 10);

    return () => clearInterval(intervalId);
  }, [position, speed, direction]);

  return <Ball top={position.top} left={position.left} radius={radius} />;
}

export default Ball;
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
      const courtWidth = 800; // Replace with your actual court width
      const courtHeight = 400; // Replace with your actual court height
      const ballRadius = 10; // Adjust as needed
  
      // Prevent ball from going out of bounds
      let adjustedTop = newTop;
      let adjustedLeft = newLeft;
  
      if (adjustedTop - ballRadius < 0) {
        adjustedTop = ballRadius; // Clamp top position at the court top
      } else if (adjustedTop + ballRadius > courtHeight) {
        adjustedTop = courtHeight - ballRadius; // Clamp top position at the court bottom
      }
  
      if (adjustedLeft - ballRadius < 0) {
        adjustedLeft = ballRadius; // Clamp left position at the court left
      } else if (adjustedLeft + ballRadius > courtWidth) {
        adjustedLeft = courtWidth - ballRadius; // Clamp left position at the court right
      }
  
      // Update ball position with collision prevention
      setPosition({ top: adjustedTop, left: adjustedLeft });
    }, 10);
  
    return () => clearInterval(intervalId);
  }, [position, speed, direction]);

  return <Ball top={position.top} left={position.left} radius={radius} />;
}

export default Ball;
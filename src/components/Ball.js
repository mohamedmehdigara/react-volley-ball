import React, { useState, useEffect } from 'react';
import styled from 'styled-components';



function Ball({ initialPosition, speed, direction }) {
   
    const Ball = styled.div`
    width: 20px;
    height: 20px;
    background-color: red;
    position: absolute;
    top: ${(props) => props.top}px;
    left: ${(props) => props.left}px;
  `;
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newTop = position.top + speed * direction.y;
      const newLeft = position.left + speed * direction.x;

      // Check for collisions with the court boundaries
      if (newTop < 0) {
        newTop = 0;
        direction.y = -direction.y;
      } else if (newTop > 400 - 20) {
        newTop = 400 - 20;
        direction.y = -direction.y;
      }

      if (newLeft < 0) {
        newLeft = 0;
        direction.x = -direction.x;
      } else if (newLeft > 800 - 20) {
        newLeft = 800 - 20;
        direction.x = -direction.x;
      }

      setPosition({ top: newTop, left: newLeft });
    }, 10);

    return () => clearInterval(intervalId);
  }, [position, speed, direction]);

  return <Ball top={position.top} left={position.left} />;
}

export default Ball;
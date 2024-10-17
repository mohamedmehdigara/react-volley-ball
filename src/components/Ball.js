import React, { useState, useEffect } from 'react';
import styled from 'styled-components';



function Ball({ initialPosition = { top: 200, left: 400 }, speed, direction }) {
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
    if (!position) {
      console.error("Initial position is undefined.");
      return;
    }

    const intervalId = setInterval(() => {
      // ... rest of your ball movement logic ...
    }, 10);

    return () => clearInterval(intervalId);
  }, [position, speed, direction]);

  return <Ball top={position.top} left={position.left} />;
}

export default Ball;
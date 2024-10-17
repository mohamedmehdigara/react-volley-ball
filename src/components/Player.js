import React, { useState, useEffect } from 'react';
import styled from 'styled-components';



function Player({ initialPosition = { top: 160, left: 50 }, height, width }) {
  const Player = styled.div`
  width: 40px;
  height: 80px;
  background-color: blue;
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

    // ... player movement logic ...

  }, [position, height, width]);

  return <Player top={position.top} left={position.left} height={height} width={width} />;
}

export default Player;
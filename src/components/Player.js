import React, { useState, useEffect } from 'react';
import styled from 'styled-components';



function Player({ initialPosition = { top: 160, left: 50 }, height = 80, width = 40 }) {
  const Player = styled.div`
  width: ${(props) => props.width}px; /* Allow customization of width */
  height: ${(props) => props.height}px; /* Allow customization of height */
  background-color: blue;
  border-radius: 10px; /* Add rounded corners */
  position: absolute;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
`;
  const [position, setPosition] = useState(initialPosition);

  // Add state for player movement direction (optional)
  const [direction, setDirection] = useState({ x: 0, y: 0 });

  // Add function for handling player movement (optional)
  const handleMovement = (newDirection) => {
    setDirection(newDirection);
  };

  useEffect(() => {
    if (!position) {
      console.error("Initial position is undefined.");
      return;
    }

    // Update player position based on direction and speed (implement logic here)

    // ... (implement logic for updating position based on direction)

  }, [position, direction]);

  return (
    <Player top={position.top} left={position.left} height={height} width={width} />
  );
}

export default Player;
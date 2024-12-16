import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Paddle = ({ initialTop, playerSide, courtHeight, courtWidth }) => {
  const [top, setTop] = useState(initialTop);
  const paddleSpeed = 5; // Define paddle speed here

  const handleKeyDown = (event) => {
    if (event.key === 'w' && playerSide === 'player1') {
      setTop(Math.max(top - paddleSpeed, 0));
    } else if (event.key === 's' && playerSide === 'player1') {
      setTop(Math.min(top + paddleSpeed, courtHeight - 100));
    } else if (event.key === 'ArrowUp' && playerSide === 'player2') {
      setTop(Math.max(top - paddleSpeed, 0));
    } else if (event.key === 'ArrowDown' && playerSide === 'player2') {
      setTop(Math.min(top + paddleSpeed, courtHeight - 100));
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const Paddle = styled.div`
    position: absolute;
    width: 20px;
    height: 100px;
    background-color: blue;
    top: ${(props) => props.top}px;
    left: ${(props) => props.left}px;
  `;

  return (
    <Paddle top={top} left={playerSide === 'player1' ? 0 : courtWidth - 20} />
  );
};

export default Paddle;
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Paddle = ({ initialTop, playerSide, courtHeight }) => {
  const [top, setTop] = useState(initialTop);
  const paddleSpeed = 5;

  const handleKeyUp = (event) => {
    if (event.key === 'w' && playerSide === 'player1') {
      setTop((prevTop) => Math.max(prevTop - paddleSpeed, 0));
    } else if (event.key === 's' && playerSide === 'player1') {
      setTop((prevTop) => Math.min(prevTop + paddleSpeed, courtHeight - paddleHeight));
    } else if (event.key === 'ArrowUp' && playerSide === 'player2') {
      setTop((prevTop) => Math.max(prevTop - paddleSpeed, 0));
    } else if (event.key === 'ArrowDown' && playerSide === 'player2') {
      setTop((prevTop) => Math.min(prevTop + paddleSpeed, courtHeight - paddleHeight));
    }
  };

  useEffect(() => {
    document.addEventListener('keyup', handleKeyUp);
    return () => document.removeEventListener('keyup', handleKeyUp);
  }, [handleKeyUp]); 1 

  const paddleHeight = 100;

  return (
    <Paddle top={top} left={playerSide === 'player1' ? 10 : courtWidth - 30}>
    </Paddle>
  );
};

export default Paddle;
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Paddle = ({ initialTop, playerSide, courtHeight, courtWidth }) => {
  const [top, setTop] = useState(initialTop);
  const [speed, setSpeed] = useState(0); // Initial speed
  const [acceleration] = useState(0.2); // Acceleration factor

  const paddleHeight = 100;
  const paddleWidth = 20;

  const handleKeyDown = (event) => {
    if (event.key === 'w' && playerSide === 'player1') {
      setSpeed(-paddleSpeed);
    } else if (event.key === 's' && playerSide === 'player1') {
      setSpeed(paddleSpeed);
    } else if (event.key === 'ArrowUp' && playerSide === 'player2') {
      setSpeed(-paddleSpeed);
    } else if (event.key === 'ArrowDown' && playerSide === 'player2') {
      setSpeed(paddleSpeed);
    }
  };

  const handleKeyUp = (event) => {
    setSpeed(0);
  };

  useEffect(() => {
    const animationFrame = () => {
      const newTop = Math.min(Math.max(top + speed, 0), courtHeight - paddleHeight);
      setTop(newTop);
      requestAnimationFrame(animationFrame);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    requestAnimationFrame(animationFrame);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <Paddle
      top={top}
      left={playerSide === 'player1' ? 0 : courtWidth - paddleWidth}
      width={paddleWidth}
      height={paddleHeight}
    />
  );
};

export default Paddle;
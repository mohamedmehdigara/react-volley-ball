import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Paddle = styled.div`
  width: 20px;
  height: 100px;
  background-color: blue;
  position: absolute;
  top: ${(props) => props.top}px;
  left: 50px;
`;

const Player = ({ courtHeight, onPlayerMove, paddleHeight }) => {
  const speed = 15; // Increased speed for more responsive control

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowUp') {
        onPlayerMove(prevPos => Math.max(0, prevPos - speed));
      } else if (event.key === 'ArrowDown') {
        onPlayerMove(prevPos => Math.min(courtHeight - paddleHeight, prevPos + speed));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayerMove, courtHeight, paddleHeight, speed]);

  return <Paddle top={courtHeight / 2 - paddleHeight / 2} />; // Initial position
};

export default Player;
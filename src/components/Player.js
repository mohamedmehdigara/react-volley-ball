import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Paddle = styled.div`
  position: absolute;
  width: 20px;
  height: 100px;
  background-color: blue;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
`;

const Player = ({ position, onPlayerMove }) => {
  const handleKeyDown = (event) => {
    const paddleSpeed = 5; 
    if (event.key === 'w') {
      onPlayerMove({ top: Math.max(position.top - paddleSpeed, 0), left: position.left });
    } else if (event.key === 's') {
      onPlayerMove({ top: Math.min(position.top + paddleSpeed, 400 - 100), left: position.left }); 
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <Paddle top={position.top} left={position.left} />;
};

export default Player;
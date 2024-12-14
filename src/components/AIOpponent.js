import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Paddle from './Paddle';

const AIOpponent = ({ playerSide, courtHeight, ballPosition, ballSpeed, ballDirection }) => {
  const [playerPosition, setPlayerPosition] = useState({ top: 160, left: 50 }); // Initial position

  const paddleHeight = 100;
  const paddleSpeed = 5;
  const courtWidth = 100;

  const handleAIMovement = () => {
    // Predict ball's future position based on current speed and direction
    const predictedPosition = {
      top: ballPosition.top + ballSpeed * ballDirection.y * 0.5, // Adjust prediction factor as needed
      left: ballPosition.left + ballSpeed * ballDirection.x * 0.5,
    };

    // Calculate desired paddle position to intercept the ball
    const desiredTop = predictedPosition.top - paddleHeight / 2;

    // Move the paddle towards the desired position, considering court boundaries
    const newTop = Math.max(0, Math.min(desiredTop, courtHeight - paddleHeight));
    setPlayerPosition({ ...playerPosition, top: newTop });
  };

  useEffect(() => {
    handleAIMovement();
  }, [ballPosition, ballSpeed, ballDirection]);

  return (
    <Paddle
      top={playerPosition.top}
      left={playerSide === 'player1' ? 10 : courtWidth - 30}
      height={paddleHeight}
    />
  );
};

export default AIOpponent;
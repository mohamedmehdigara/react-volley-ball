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

const AIOpponent = ({
  playerSide,
  courtHeight,
  ballPosition,
  ballSpeed,
  ballDirection,
  onPlayerMove,
  reactionTime = 150, // Adjust AI reaction time (milliseconds)
  difficulty = 'medium', // Set difficulty level (easy, medium, hard)
}) => {
  const [playerPosition, setPlayerPosition] = useState({ top: 160, left: 750 });

  const paddleHeight = 100;
  const paddleSpeed = 5;
  const courtWidth = 800;

  const handleAIMovement = () => {
    // Predict ball's future position based on current speed and direction
    const predictedPosition = {
      top: ballPosition.top + ballSpeed * ballDirection.y * 0.5,
      left: ballPosition.left + ballSpeed * ballDirection.x * 0.5,
    };

    // Calculate desired paddle position to intercept the ball
    const desiredTop = predictedPosition.top - paddleHeight / 2;

    // Move the paddle towards the desired position, considering court boundaries
    const newTop = Math.max(0, Math.min(desiredTop, courtHeight - paddleHeight));

    // Apply reaction time delay based on difficulty
    const reactionDelay = getReactionDelay(difficulty);
    setTimeout(() => {
      onPlayerMove({ ...playerPosition, top: newTop });
    }, reactionDelay);
  };

  const getReactionDelay = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return reactionTime * 2;
      case 'medium':
        return reactionTime;
      case 'hard':
        return reactionTime / 2;
      default:
        console.warn(`Invalid difficulty level: ${difficulty}. Using 'medium'`);
        return reactionTime;
    }
  };

  useEffect(() => {
    handleAIMovement();
  }, [ballPosition, ballSpeed, ballDirection, difficulty]);

  return (
    <Paddle
      top={playerPosition.top}
      left={playerSide === 'player1' ? 10 : courtWidth - 30}
      height={paddleHeight}
    />
  );
};

export default AIOpponent;
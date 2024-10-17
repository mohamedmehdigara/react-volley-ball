import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import Court from './components/Court';
import Net from './components/Net';
import Ball from './components/Ball';
import Player from './components/Player';

const GameContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

function App() {
  const [ballPosition, setBallPosition] = useState({ top: 200, left: 400 });
  const [player1Position, setPlayer1Position] = useState({ top: 160, left: 50 });
  const [player2Position, setPlayer2Position] = useState({ top: 160, left: 750 });

  // Game settings (adjust as needed)
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 243;
  const ballRadius = 20;
  const ballSpeed = 5;
  const playerHeight = 80;
  const playerWidth = 40;

  const updateBallPosition = () => {
    const newTop = ballPosition.top + ballSpeed * (Math.random() - 0.5);
    const newLeft = ballPosition.left + ballSpeed * (Math.random() - 0.5);

    // Ensure ball stays within court boundaries
    const clampedTop = Math.min(Math.max(newTop, ballRadius), courtHeight - ballRadius);
    const clampedLeft = Math.min(Math.max(newLeft, ballRadius), courtWidth - ballRadius);

    setBallPosition({ top: clampedTop, left: clampedLeft });
  };

  useEffect(() => {
    const intervalId = setInterval(updateBallPosition, 10);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <GameContainer>
      <Court />
      <Net height={netHeight} width={2} left={courtWidth / 2} />
      <Ball radius={ballRadius} />
      <Player height={playerHeight} width={playerWidth} />
      <Player height={playerHeight} width={playerWidth} />
    </GameContainer>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import Court from './components/Court';
import Scoreboard from './components/Scoreboard';
import Player from './components/Player';
import AIOpponent from './components/AIOpponent';
import Ball from './components/Ball';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e0e0e0;
`;

const VolleyballGame = () => {
  const courtWidth = 800;
  const courtHeight = 400;
  const netWidth = 2;
  const netHeight = 243;
  const paddleWidth = 20;
  const paddleHeight = 100;

  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState('');

  const [player1Position, setPlayer1Position] = useState(courtHeight / 2 - paddleHeight / 2);
  const [player2Position, setPlayer2Position] = useState(courtHeight / 2 - paddleHeight / 2);
  const [ballState, setBallState] = useState({
    position: { top: 200, left: 400 },
    speed: 5,
    direction: { x: 1, y: 1 },
    spinX: 0,
    spinY: 0,
  });

  const updateScore = (player) => {
    setScore((prevScore) => {
      const newScore = { ...prevScore, [player]: prevScore[player] + 1 };
      if (newScore[player] >= 11) {
        setIsGameOver(true);
        setWinner(player);
      }
      return newScore;
    });
  };

  const handleOutOfBounds = (losingPlayer) => {
    updateScore(losingPlayer);
    setBallState({
      position: { top: 200, left: 400 },
      speed: 5,
      direction: { x: 1, y: 1 },
    });
    setPlayer1Position(courtHeight / 2 - paddleHeight / 2);
    setPlayer2Position(courtHeight / 2 - paddleHeight / 2);
  };

  const handleBallUpdate = (newBallState) => {
    setBallState(newBallState);
  };

  return (
    <GameContainer>
      <Scoreboard
        player1Score={score.player1}
        player2Score={score.player2}
        isGameOver={isGameOver}
        winner={winner}
      />
      <Court
        courtWidth={courtWidth}
        courtHeight={courtHeight}
      >
        <Player
          position={player1Position}
          onPlayerMove={setPlayer1Position}
          courtHeight={courtHeight}
          paddleHeight={paddleHeight}
        />
        <AIOpponent
          position={player2Position}
          onPlayerMove={setPlayer2Position}
          courtHeight={courtHeight}
          paddleHeight={paddleHeight}
          ballPosition={ballState.position}
        />
        <Ball
          // The Ball component needs these props to function properly
          initialPosition={ballState.position}
          initialSpeed={ballState.speed}
          initialDirection={ballState.direction}
          courtWidth={courtWidth}
          courtHeight={courtHeight}
          netWidth={netWidth}
          netHeight={netHeight}
          paddleHeight={paddleHeight} // Pass paddleHeight to Ball.js
          player1Paddle={{ top: player1Position, left: 50, width: paddleWidth, height: paddleHeight }}
          player2Paddle={{ top: player2Position, left: 750, width: paddleWidth, height: paddleHeight }}
          outOfBounds={handleOutOfBounds}
          onBallUpdate={handleBallUpdate} // This is the fix!
        />
      </Court>
    </GameContainer>
  );
};

export default VolleyballGame;
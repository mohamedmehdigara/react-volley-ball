// src/App.js

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

import Court from './components/Court';
import Scoreboard from './components/Scoreboard';
import Player from './components/Player';
import AIOpponent from './components/AIOpponent';
import Ball from './components/Ball';
import Net from './components/Net';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e0e0e0;
`;

const DifficultySelector = styled.select`
  margin-bottom: 20px;
  padding: 8px;
  font-size: 1rem;
  border-radius: 5px;
`;

const VolleyballGame = () => {
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 250; 
  const netTop = courtHeight - netHeight; 
  const paddleWidth = 30; 
  const paddleHeight = 80; 
  
  const player1InitialX = courtWidth / 4 - paddleWidth / 2;
  const player2InitialX = courtWidth * 3 / 4 - paddleWidth / 2;
  const playerBaseY = courtHeight - paddleHeight;

  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [difficulty, setDifficulty] = useState('normal');

  const [player1PositionX, setPlayer1PositionX] = useState(player1InitialX);
  const [player2PositionX, setPlayer2PositionX] = useState(player2InitialX);

  const [player1PositionY, setPlayer1PositionY] = useState(playerBaseY);
  const [player2PositionY, setPlayer2PositionY] = useState(playerBaseY);

  const [ballState, setBallState] = useState({
    position: { top: playerBaseY - 20, left: player1InitialX + paddleWidth / 2 },
    speed: 0,
    direction: { x: 0, y: 0 },
    isServed: false, 
  });

  const [player1Flashing, setPlayer1Flashing] = useState(false);
  const [player2Flashing, setPlayer2Flashing] = useState(false);
  
  const powerUpEffects = useRef({
    paddle1Height: paddleHeight,
    paddle2Height: paddleHeight,
    ballSpeed: 0,
  });

  const triggerPaddleFlash = (player) => {
    if (player === 'player1') {
      setPlayer1Flashing(true);
      setTimeout(() => setPlayer1Flashing(false), 100);
    } else {
      setPlayer2Flashing(true);
      setTimeout(() => setPlayer2Flashing(false), 100);
    }
  };

  const updateScore = (player) => {
    setScore((prevScore) => {
      const newScore = { ...prevScore, [player]: prevScore[player] + 1 };
      return newScore;
    });
  };

  const handleOutOfBounds = (losingPlayer) => {
    updateScore(losingPlayer);
    
    // Determine the serving player for the next round
    const servingPlayer = losingPlayer === 'player2' ? 1 : 2;
    const initialX = servingPlayer === 1 ? player1InitialX + paddleWidth / 2 : player2InitialX + paddleWidth / 2;

    setBallState({
      position: { top: playerBaseY - 20, left: initialX },
      speed: 0,
      direction: { x: 0, y: 0 },
      isServed: false,
    });
  };

  // FIX: This function is now strictly for serving and is conditional.
  const handleServe = () => {
    // Only serve if the ball is not currently in play
    if (!ballState.isServed && ballState.speed === 0) {
      setBallState((prev) => ({
        ...prev,
        speed: 10,
        direction: { x: 1.5, y: -2 }, 
        isServed: true,
      }));
      return true; // Serve successful
    }
    return false; // Ball already in play
  };

  const player1Paddle = { 
    x: player1PositionX, 
    y: player1PositionY, 
    width: paddleWidth, 
    height: powerUpEffects.current.paddle1Height 
  };
  const player2Paddle = { 
    x: player2PositionX, 
    y: player2PositionY, 
    width: paddleWidth, 
    height: powerUpEffects.current.paddle2Height 
  };
  
  return (
    <GameContainer>
      <DifficultySelector value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="normal">Normal</option>
        <option value="hard">Hard</option>
      </DifficultySelector>
      <Scoreboard player1Score={score.player1} player2Score={score.player2} />
      <Court courtWidth={courtWidth} courtHeight={courtHeight}>
        <Net courtWidth={courtWidth} netTop={netTop} netHeight={netHeight} />
        
        <Player
          positionX={player1PositionX}
          onPlayerMoveX={setPlayer1PositionX}
          positionY={player1PositionY}
          onPlayerMoveY={setPlayer1PositionY}
          courtWidth={courtWidth}
          paddleHeight={powerUpEffects.current.paddle1Height}
          isFlashing={player1Flashing}
          onServe={handleServe} // Player 1 handles serve and jump/hit
        />
        <AIOpponent
          positionX={player2PositionX}
          onPlayerMoveX={setPlayer2PositionX}
          positionY={player2PositionY}
          onPlayerMoveY={setPlayer2PositionY}
          courtWidth={courtWidth}
          courtHeight={courtHeight}
          paddleHeight={powerUpEffects.current.paddle2Height}
          ballState={ballState}
          difficulty={difficulty}
          isFlashing={player2Flashing}
          netTop={netTop}
          // The AI does NOT receive an onServe prop. It handles hits autonomously.
        />
        <Ball
          initialPosition={ballState.position}
          initialSpeed={ballState.speed + powerUpEffects.current.ballSpeed}
          initialDirection={ballState.direction}
          courtWidth={courtWidth}
          courtHeight={courtHeight}
          netTop={netTop} 
          paddleHeight={paddleHeight}
          player1Paddle={player1Paddle}
          player2Paddle={player2Paddle}
          outOfBounds={handleOutOfBounds}
          onBallUpdate={setBallState}
          onPaddleCollision={triggerPaddleFlash}
        />
      </Court>
    </GameContainer>
  );
};

export default VolleyballGame;
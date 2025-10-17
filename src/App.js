import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

import Court from './components/Court';
import Scoreboard from './components/Scoreboard';
import Player from './components/Player';
import AIOpponent from './components/AIOpponent';
import Ball from './components/Ball';
import Net from './components/Net';
import PowerUp from './components/PowerUp';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e0e0e0;
`;

const GameOverScreen = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  z-index: 100;
`;

const RestartButton = styled.button`
  padding: 10px 20px;
  font-size: 1.2rem;
  margin-top: 20px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  &:hover {
    background-color: #45a049;
  }
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
  const netHeight = 250; // Visual height of the net post
  const netTop = 250; // Collision Y-coordinate for the net rope
  const paddleWidth = 30; // Player width
  const paddleHeight = 80; // Player height
  const powerUpInterval = 10000;

  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [difficulty, setDifficulty] = useState('normal');

  // Player position is now lateral (X-coordinate)
  const [player1PositionX, setPlayer1PositionX] = useState(courtWidth / 4 - paddleWidth / 2);
  const [player2PositionX, setPlayer2PositionX] = useState(courtWidth * 3 / 4 - paddleWidth / 2);

  // New state for player jumping (vertical movement)
  const [player1PositionY, setPlayer1PositionY] = useState(courtHeight - paddleHeight);
  const [player2PositionY, setPlayer2PositionY] = useState(courtHeight - paddleHeight);

  const [ballState, setBallState] = useState({
    position: { top: courtHeight - 20, left: 100 }, // Start ball near Player 1 baseline
    speed: 0,
    direction: { x: 0, y: 0 },
    spinX: 0,
    spinY: 0,
    isServed: false, // New state for initial serve
  });

  const [powerUpState, setPowerUpState] = useState(null);
  const [player1Flashing, setPlayer1Flashing] = useState(false);
  const [player2Flashing, setPlayer2Flashing] = useState(false);
  
  const powerUpEffects = useRef({
    player1Speed: 0,
    player2Speed: 0,
    ballSpeed: 0,
    paddle1Height: paddleHeight,
    paddle2Height: paddleHeight,
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
      if (newScore[player] >= 11) {
        setIsGameOver(true);
        setWinner(player === 'player1' ? 'Player 1' : 'AI Opponent');
      }
      return newScore;
    });
  };

  const handleOutOfBounds = (losingPlayer) => {
    updateScore(losingPlayer);
    
    // Reset ball to the serving side of the scoring player
    const servingSideX = losingPlayer === 'player2' ? courtWidth / 4 : courtWidth * 3 / 4;

    setBallState({
      position: { top: courtHeight - 20, left: servingSideX },
      speed: 0,
      direction: { x: 0, y: 0 },
      spinX: 0,
      spinY: 0,
      isServed: false,
    });
    // ... (reset player positions and power-ups)
  };

  const handleServe = () => {
    if (!ballState.isServed) {
      setBallState((prev) => ({
        ...prev,
        speed: 10,
        direction: { x: 1, y: -2 }, // Launch ball up and forward
        isServed: true,
      }));
    }
  };

  // ... (handleRestart, applyPowerUpEffect, handleDifficultyChange, useEffect for power-ups)

  return (
    <GameContainer>
      <DifficultySelector value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="normal">Normal</option>
        <option value="hard">Hard</option>
      </DifficultySelector>
      <Scoreboard player1Score={score.player1} player2Score={score.player2} isGameOver={isGameOver} winner={winner} />
      <Court courtWidth={courtWidth} courtHeight={courtHeight}>
        <Net courtWidth={courtWidth} netTop={netTop} netHeight={netHeight} />
        
        <Player
          positionX={player1PositionX}
          onPlayerMoveX={setPlayer1PositionX}
          positionY={player1PositionY}
          onPlayerMoveY={setPlayer1PositionY}
          courtWidth={courtWidth / 2} // Player 1 restricted to left side
          courtHeight={courtHeight}
          paddleHeight={powerUpEffects.current.paddle1Height}
          isFlashing={player1Flashing}
          onServe={handleServe}
        />
        <AIOpponent
          positionX={player2PositionX}
          onPlayerMoveX={setPlayer2PositionX}
          positionY={player2PositionY}
          onPlayerMoveY={setPlayer2PositionY}
          courtWidth={courtWidth / 2} // Player 2 restricted to right side
          courtHeight={courtHeight}
          paddleHeight={powerUpEffects.current.paddle2Height}
          ballState={ballState}
          difficulty={difficulty}
          isFlashing={player2Flashing}
        />
        <Ball
          // ... (existing props)
          courtWidth={courtWidth}
          courtHeight={courtHeight}
          netTop={netTop} // Pass net height for collision
          paddleHeight={paddleHeight}
          player1Paddle={{ 
            x: player1PositionX, 
            y: player1PositionY, 
            width: paddleWidth, 
            height: powerUpEffects.current.paddle1Height 
          }}
          player2Paddle={{ 
            x: player2PositionX, 
            y: player2PositionY, 
            width: paddleWidth, 
            height: powerUpEffects.current.paddle2Height 
          }}
          outOfBounds={handleOutOfBounds}
          onBallUpdate={setBallState}
          onPaddleCollision={triggerPaddleFlash}
        />
        {/* ... (PowerUp rendering) */}
      </Court>
      {/* ... (GameOverScreen rendering) */}
    </GameContainer>
  );
};

export default VolleyballGame;
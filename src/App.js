import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

import Court from './components/Court';
import Scoreboard from './components/Scoreboard';
import Player from './components/Player';
import AIOpponent from './components/AIOpponent';
import Ball from './components/Ball';
import Net from './components/Net';
// import PowerUp from './components/PowerUp'; // Keeping this commented for minimal code

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
  const netHeight = 250; // Visual height of the net post
  const netTop = courtHeight - netHeight; // Collision Y-coordinate for the net rope (150px from top)
  const paddleWidth = 30; // Player width
  const paddleHeight = 80; // Player height
  
  // Initial positions
  const player1InitialX = courtWidth / 4 - paddleWidth / 2;
  const player2InitialX = courtWidth * 3 / 4 - paddleWidth / 2;
  const playerBaseY = courtHeight - paddleHeight;

  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [difficulty, setDifficulty] = useState('normal');

  // Player position is now lateral (X-coordinate)
  const [player1PositionX, setPlayer1PositionX] = useState(player1InitialX);
  const [player2PositionX, setPlayer2PositionX] = useState(player2InitialX);

  // Player Y position is fixed at the baseline
  const [player1PositionY, setPlayer1PositionY] = useState(playerBaseY);
  const [player2PositionY, setPlayer2PositionY] = useState(playerBaseY);

  const [ballState, setBallState] = useState({
    // Initial ball position MUST be valid objects
    position: { top: playerBaseY - 20, left: player1InitialX + paddleWidth / 2 },
    speed: 0,
    direction: { x: 0, y: 0 }, // MUST be an object
    isServed: false, 
  });

  const [player1Flashing, setPlayer1Flashing] = useState(false);
  const [player2Flashing, setPlayer2Flashing] = useState(false);
  
  // PowerUp logic stripped for minimalism, but variables are kept
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
      // Check for win condition...
      return newScore;
    });
  };

  const handleOutOfBounds = (losingPlayer) => {
    updateScore(losingPlayer);
    
    // Reset ball to the serving side of the scoring player
    const servingPlayer = losingPlayer === 'player2' ? 1 : 2;
    const initialX = servingPlayer === 1 ? player1InitialX + paddleWidth / 2 : player2InitialX + paddleWidth / 2;

    setBallState({
      position: { top: playerBaseY - 20, left: initialX },
      speed: 0,
      direction: { x: 0, y: 0 },
      isServed: false,
    });
  };

  // FIX: This function is key to making the ball move!
  const handleServe = () => {
    if (!ballState.isServed) {
      setBallState((prev) => ({
        ...prev,
        // Set a non-zero speed and a direction (up and forward)
        speed: 10,
        direction: { x: 1.5, y: -2 }, 
        isServed: true,
      }));
    }
  };

  // The rendering logic requires the player paddles to be objects for SAT.js collision
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
          onServe={handleServe} // Passes the function to initiate movement
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
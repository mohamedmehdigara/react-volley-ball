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

const VolleyballGame = () => {
  const courtWidth = 800;
  const courtHeight = 400;
  const netWidth = 2;
  const netHeight = 243;
  const paddleWidth = 20;
  const paddleHeight = 100;
  const powerUpInterval = 10000; // 10 seconds

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
  const [powerUpState, setPowerUpState] = useState(null);

  // A ref to store active power-up effects (e.g., speed boost)
  const powerUpEffects = useRef({
    player1Speed: 0,
    player2Speed: 0,
    ballSpeed: 0,
    paddle1Height: paddleHeight,
    paddle2Height: paddleHeight,
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
      spinX: 0,
      spinY: 0,
    });
    setPlayer1Position(courtHeight / 2 - paddleHeight / 2);
    setPlayer2Position(courtHeight / 2 - paddleHeight / 2);
    powerUpEffects.current = {
      player1Speed: 0,
      player2Speed: 0,
      ballSpeed: 0,
      paddle1Height: paddleHeight,
      paddle2Height: paddleHeight,
    };
  };

  const applyPowerUpEffect = (type, player) => {
    switch (type) {
      case 'speed':
        powerUpEffects.current.ballSpeed = 5; // Temporarily boost ball speed
        setTimeout(() => {
          powerUpEffects.current.ballSpeed = 0;
        }, 5000);
        break;
      case 'enlarge':
        if (player === 'player1') {
          powerUpEffects.current.paddle1Height = paddleHeight * 1.5;
        } else {
          powerUpEffects.current.paddle2Height = paddleHeight * 1.5;
        }
        setTimeout(() => {
          powerUpEffects.current.paddle1Height = paddleHeight;
          powerUpEffects.current.paddle2Height = paddleHeight;
        }, 5000);
        break;
      case 'slow':
        powerUpEffects.current.ballSpeed = -3; // Temporarily slow down ball
        setTimeout(() => {
          powerUpEffects.current.ballSpeed = 0;
        }, 5000);
        break;
      default:
        break;
    }
  };

  // The main game loop
  useEffect(() => {
    if (isGameOver) return;

    const spawnTimer = setInterval(() => {
      if (!powerUpState) {
        const types = ['speed', 'enlarge', 'slow'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomPosition = {
          top: Math.random() * (courtHeight - 30),
          left: Math.random() * (courtWidth - 30),
        };
        setPowerUpState({ type: randomType, position: randomPosition });
      }
    }, powerUpInterval);

    const gameLoop = () => {
      // Logic for ball movement, paddle AI, and collisions would go here
      // This is the core of the game loop
      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(gameLoop);
      clearInterval(spawnTimer);
    };
  }, [isGameOver, courtWidth, courtHeight, powerUpState]);

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
        <Net
          courtWidth={courtWidth}
          netWidth={netWidth}
          netHeight={netHeight}
        />
        <Player
          position={player1Position}
          onPlayerMove={setPlayer1Position}
          courtHeight={courtHeight}
          paddleHeight={powerUpEffects.current.paddle1Height}
        />
        <AIOpponent
          position={player2Position}
          onPlayerMove={setPlayer2Position}
          courtHeight={courtHeight}
          paddleHeight={powerUpEffects.current.paddle2Height}
          ballPosition={ballState.position}
        />
        <Ball
          initialPosition={ballState.position}
          initialSpeed={ballState.speed + powerUpEffects.current.ballSpeed}
          initialDirection={ballState.direction}
          courtWidth={courtWidth}
          courtHeight={courtHeight}
          netWidth={netWidth}
          netHeight={netHeight}
          paddleHeight={paddleHeight}
          player1Paddle={{ top: player1Position, left: 50, width: paddleWidth, height: powerUpEffects.current.paddle1Height }}
          player2Paddle={{ top: player2Position, left: 750, width: paddleWidth, height: powerUpEffects.current.paddle2Height }}
          outOfBounds={handleOutOfBounds}
          onBallUpdate={setBallState}
          powerUpState={powerUpState}
          setPowerUpState={setPowerUpState}
          applyPowerUpEffect={applyPowerUpEffect}
        />
        {powerUpState && (
          <PowerUp type={powerUpState.type} position={powerUpState.position} />
        )}
      </Court>
    </GameContainer>
  );
};

export default VolleyballGame;
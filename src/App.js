import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import Court from './components/Court';
import Ball from './components/Ball';
import Player from './components/Player';
import Net from "./components/Net";

const GameContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e0e0e0; /* Light gray background */
`;

const Scoreboard = styled.div`
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translate(-50%);
  font-size: 3rem;
`;

function VolleyballGame() {
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 243;
  const netWidth = 2;

  const [ballProps, setBallProps] = useState({
    position: { top: 200, left: 400 },
    speed: 5,
    direction: { x: 1, y: 1 },
    spinX: 0,
    spinY: 0,
    courtWidth,
    courtHeight,
    netWidth,
    netHeight,
  });

  const [player1Position, setPlayer1Position] = useState({ top: 160, left: 50 });
  const [player2Position, setPlayer2Position] = useState({ top: 160, left: 750 });

  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [prevScore, setprevScore] = useState({ player1: 0, player2: 0 });

  const [isGameOver, setIsGameOver] = useState(false);
const [winner, setWinner] = useState('');


  const handlePlayerMove = (playerId, direction) => {
    const movementAmount = 10; // Adjust movement speed as needed
    const newPosition = { ...player1Position }; // Copy current position

    if (playerId === 'player1') {
      if (direction === 'up') {
        newPosition.top = Math.max(newPosition.top - movementAmount, 0);
      } else if (direction === 'down') {
        newPosition.top = Math.min(newPosition.top + movementAmount, courtHeight - Player.HEIGHT);
      }
      setPlayer1Position(newPosition);
    } else if (playerId === 'player2') {
      if (direction === 'up') {
        newPosition.top = Math.max(newPosition.top - movementAmount, 0);
      } else if (direction === 'down') {
        newPosition.top = Math.min(newPosition.top + movementAmount, courtHeight - Player.HEIGHT);
      }
      setPlayer2Position(newPosition);
    }
  };

  const handleBallCollision = () => {
    // ... (Implement advanced collision detection and physics)
  };

  const updateScore = (player) => {
    setScore((prevScore) => ({
      ...prevScore,
      [player]: prevScore[player] + 1,
    }));
  
    if (prevScore[player] + 1 >= 11) {
      setIsGameOver(true);
      setWinner(player);
    }
  };
  return (
    <GameContainer>
       <Scoreboard
      player1Score={score.player1}
      player2Score={score.player2}
      isGameOver={isGameOver}
      winner={winner}
    />
      <Court>
        <Net />
        <Ball {...ballProps} />
        <Player position={player1Position} />
        <Player position={player2Position} />
      </Court>
    </GameContainer>
  );
}

export default VolleyballGame;
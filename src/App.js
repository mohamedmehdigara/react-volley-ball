import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import Court from './components/Court';
import Scoreboard from './components/Scoreboard'; 

const GameContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e0e0e0;
`;

function VolleyballGame() {
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 243;
  const netWidth = 2;

  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [prevScore, setPrevScore] = useState();

  const updateScore = (player) => {
    setScore((prevScore) => ({ 
      ...prevScore, 
      [player]: prevScore[player] + 1 
    }));

    if (prevScore[player] + 1 >= 11) { 
      setIsGameOver(true);
      setWinner(player);
    }
  };

  const handleOutOfBounds = (losingPlayer) => {
    updateScore(losingPlayer === 'player1' ? 'player2' : 'player1');
  };

  const handlePlayerCollision = () => {
    // Handle player collisions (e.g., play sounds)
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
        netWidth={netWidth} 
        netHeight={netHeight} 
        onPlayerCollision={handlePlayerCollision} 
        outOfBounds={handleOutOfBounds} 
      /> 
    </GameContainer>
  );
}

export default VolleyballGame;
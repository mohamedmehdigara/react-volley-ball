import React from 'react';
import styled from 'styled-components';

const Scoreboard = ({ player1Score, player2Score, isGameOver, winner }) => {
  return (
    <div>
      <p>Player 1: {player1Score}</p>
      <p>Player 2: {player2Score}</p>
      {isGameOver && (
        <p>Game Over! Winner: {winner}</p>
      )}
    </div>
  );
};

export default Scoreboard;
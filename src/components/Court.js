import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Ball from './Ball';
import Player from './Player';
import AIOpponent from './AIOpponent';
import PowerUp from './PowerUp';
import Net from './Net';

const CourtContainer = styled.div`
  width: 800px;
  height: 400px;
  border: 2px solid black;
  position: relative;
  background-color: #f0f0f0;
`;



const Court = () => {
  // ... (rest of the Court component)

  return (
    <CourtContainer>
      <Net />
      <Ball {...ballProps} powerUps={powerUps} setPowerUps={setPowerUps} />
      <Player position={player1Position} />
      <AIOpponent
        playerSide="player2"
        courtHeight={courtHeight}
        ballPosition={ballProps.position}
        ballSpeed={ballProps.speed}
        ballDirection={ballProps.direction}
      />
      {powerUps.map((powerUp, index) => (
        <PowerUp key={index} type={powerUp.type} position={powerUp.position} />
      ))}
    </CourtContainer>
  );
};

export default Court;
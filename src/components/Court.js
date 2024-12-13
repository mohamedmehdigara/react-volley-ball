import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Ball from './Ball';
import Player from './Player';
import PowerUp from './PowerUp';

const CourtContainer = styled.div`
  width: 800px;
  height: 400px;
  border: 2px solid black;
  position: relative;
  background-color: #f0f0f0;
`;

const Net = styled.div`
  width: 2px;
  height: 243px;
  background-color: black;
  position: absolute;
  left: 400px;
  top: 0;
`;

const Court = () => {
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 243;
  const netWidth = 2;

  const [ballProps, setBallProps] = useState({
    // ...
  });

  const [player1Position, setPlayer1Position] = useState({ top: 160, left: 50 });
  const [player2Position, setPlayer2Position] = useState({ top: 160, left: 750 });

  const [score, setScore] = useState({ player1: 0, player2: 0 });

  const [powerUps, setPowerUps] = useState([]);

  const generatePowerUp = () => {
    const newPowerUp = {
      type: 'speedBoost', // Example power-up type
      position: {
        top: Math.random() * courtHeight,
        left: Math.random() * courtWidth,
      },
      duration: 5000, // Duration in milliseconds
    };
    setPowerUps([...powerUps, newPowerUp]);
  };

  // ... (rest of the Court component)

  return (
    <CourtContainer>
      <Net />
      <Ball {...ballProps} powerUps={powerUps} setPowerUps={setPowerUps} />
      <Player position={player1Position} />
      <Player position={player2Position} />
      {powerUps.map((powerUp, index) => (
        <PowerUp key={index} type={powerUp.type} position={powerUp.position} />
      ))}
    </CourtContainer>
  );
};

export default Court;
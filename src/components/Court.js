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



const Court = ({
  courtWidth = 800,
  courtHeight = 400,
  netHeight = 243,
  netWidth = 2,
  onPlayerCollision,
  outOfBounds,
  player1Paddle, 
  player2Paddle, 
}) => {
  const [ballProps, setBallProps] = useState({
    position: { top: 200, left: 400 },
    speed: 5,
    direction: { x: 1, y: 1 },
    courtWidth,
    courtHeight,
    netWidth,
    netHeight,
  });

  const Net = styled.div`
  width: 2px;
  height: 243px;
  background-color: black;
  position: absolute;
  left: 400px;
  top: 0;
`;

  const [player1Position, setPlayer1Position] = useState({ top: 160, left: 50 });
  const [player2Position, setPlayer2Position] = useState({ top: 160, left: 750 });

  const [powerUps, setPowerUps] = useState([]);

  // ... (rest of the Court component)

  return (
    <CourtContainer>
      <Net />
      <Ball {...ballProps} powerUps={powerUps} setPowerUps={setPowerUps} 
            onPlayerCollision={onPlayerCollision} 
            outOfBounds={outOfBounds} 
            player1Paddle={player1Paddle} 
            player2Paddle={player2Paddle} 
      />
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
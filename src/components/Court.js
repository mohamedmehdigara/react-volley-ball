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
  courtWidth, 
  courtHeight, 
  netWidth, 
  netHeight, 
  onPlayerCollision, 
  outOfBounds 
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

  const [player1Position, setPlayer1Position] = useState({ top: 160, left: 50 });
  const [player2Position, setPlayer2Position] = useState({ top: 160, left: 750 });

  const [powerUps, setPowerUps] = useState([]);

  const Net = styled.div`
  width: 2px;
  height: 243px;
  background-color: black;
  position: absolute;
  left: 400px;
  top: 0;
`;

  // ... (rest of the Court component)

  return (
    <CourtContainer>
      <Net />
      <Ball 
        {...ballProps} 
        powerUps={powerUps} 
        setPowerUps={setPowerUps} 
        onPlayerCollision={onPlayerCollision} 
        outOfBounds={outOfBounds} 
        player1Paddle={{ 
          left: player1Position.left, 
          top: player1Position.top, 
          width: 20, 
          height: 100 
        }} 
        player2Paddle={{ 
          left: player2Position.left, 
          top: player2Position.top, 
          width: 20, 
          height: 100 
        }} 
      />
      <Player position={player1Position} onPlayerMove={setPlayer1Position} />
      <AIOpponent 
        playerSide="player2" 
        courtHeight={courtHeight} 
        ballPosition={ballProps.position} 
        ballSpeed={ballProps.speed} 
        ballDirection={ballProps.direction} 
        onPlayerMove={setPlayer2Position} 
        courtWidth={courtWidth} 
      /> 
      {powerUps.map((powerUp, index) => (
        <PowerUp key={index} type={powerUp.type} position={powerUp.position} />
      ))}
    </CourtContainer>
  );
};

export default Court;
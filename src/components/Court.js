import React from 'react';
import Ball from './Ball';
import Paddle from './Paddle';
import styled from 'styled-components';

const Court = () => {
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 243;
  const netWidth = 2;
  const lineWidth = 2;

  const CourtContainer = styled.div`
    width: ${courtWidth}px;
    height: ${courtHeight}px;
    border: 2px solid black;
    position: relative;
    background-color: #f0f0f0; // Light gray court surface
  `;

  const Net = styled.div`
    width: ${netWidth}px;
    height: ${netHeight}px;
    background-color: black;
    position: absolute;
    left: ${courtWidth / 2}px;
    top: 0;
  `;

  const Line = styled.div`
    width: ${lineWidth}px;
    height: ${(props) => props.height}px;
    background-color: black;
    position: absolute;
    left: ${(props) => props.left}px;
    top: ${(props) => props.top}px;
  `;

  const NetPost = styled.div`
    width: 5px;
    height: 20px;
    background-color: black;
    position: absolute;
  `;

  const PlayerIcon = styled.div`
    width: 20px;
    height: 20px;
    background-color: blue;
    border-radius: 50%;
    position: absolute;
  `;

  return (
    <CourtContainer>
      <Net />
      <NetPost left={`${courtWidth / 2 - netWidth / 2 - 5}px`} top="0px" />
      <NetPost left={`${courtWidth / 2 + netWidth / 2}px`} top="0px" />
      <Line height={`${courtHeight}px`} left={`${courtWidth / 2}px`} />
      <Line height={`${lineWidth}px`} left="0px" top={`${courtHeight / 2}px`} />
      <Line height={`${lineWidth}px`} left={`${courtWidth - lineWidth}px`} top={`${courtHeight / 2}px`} />
      <Line height={`${lineWidth}px`} left={`${courtWidth / 4}px`} top="0px" />
      <Line height={`${lineWidth}px`} left={`${courtWidth / 4}px`} top={`${courtHeight - lineWidth}px`} />
      <Line height={`${lineWidth}px`} left={`${courtWidth / 6}px`} top="0px" />
      <Line height={`${lineWidth}px`} left={`${courtWidth / 6}px`} top={`${courtHeight - lineWidth}px`} />
      <Line height={`${lineWidth}px`} left={`${courtWidth * 5 / 6}px`} top="0px" />
      <Line height={`${lineWidth}px`} left={`${courtWidth * 5 / 6}px`} top={`${courtHeight - lineWidth}px`} />

      {/* Player icons */}
      <PlayerIcon left="20px" top="150px" />
      <PlayerIcon left={`${courtWidth - 40}px`} top="150px" />
      <Ball
        courtWidth={courtWidth}
        courtHeight={courtHeight}
        netHeight={netHeight}
        netWidth={netWidth}
        // Pass player paddle positions here
        player1Paddle={{ top: 100, left: 10, width: 20, height: 100 }}
        player2Paddle={{ top: 100, left: 780, width: 20, height: 100 }}
        // ... (other props for ball behavior)
      />
      <Paddle playerSide="player1" courtHeight={courtHeight} />
      <Paddle playerSide="player2" courtHeight={courtHeight} />
    </CourtContainer>
  );
};

export default Court;
import React from 'react';
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
    width: ${courtWidth}px;
    height: ${lineWidth}px;
    background-color: black;
    position: absolute;
  `;

  return (
    <CourtContainer>
      <Net />
      <Line top={`${courtHeight / 2}px`} />
      <Line left={`${courtWidth / 4}px`} top="0px" />
      <Line left={`${courtWidth / 4}px`} top={`${courtHeight - lineWidth}px`} />
      <Line left={`${courtWidth / 6}px`} top="0px" />
      <Line left={`${courtWidth / 6}px`} top={`${courtHeight - lineWidth}px`} />
    </CourtContainer>
  );
};

export default Court;
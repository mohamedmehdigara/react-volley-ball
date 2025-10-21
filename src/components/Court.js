// src/components/Court.js
import React from 'react';
import styled from 'styled-components';

const StyledCourt = styled.div`
  position: relative;
  width: ${(props) => props.courtWidth}px;
  height: ${(props) => props.courtHeight}px;
  /* Updated Background: Green turf/grass look */
  background: linear-gradient(to top, #65a110, #88c644);
  border: 5px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  /* Court markings (Center Line) */
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    width: 2px;
    height: 100%;
    background-color: white;
    transform: translateX(-50%);
  }
`;

const Court = ({ courtWidth, courtHeight, children }) => {
  return (
    <StyledCourt courtWidth={courtWidth} courtHeight={courtHeight}>
      {children}
    </StyledCourt>
  );
};

export default Court;
import React from 'react';
import styled from 'styled-components';

const StyledCourt = styled.div`
  position: relative;
  width: ${(props) => props.courtWidth}px;
  height: ${(props) => props.courtHeight}px;
  background: linear-gradient(to bottom, #77bfa2, #a8df9e); /* Grass/sand gradient for a court feel */
  border: 5px solid white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  /* Court markings (dividing line) */
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
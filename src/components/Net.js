import React from 'react';
import styled from 'styled-components';

const NetPole = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0; /* Start from the floor */
  width: ${(props) => props.netWidth}px;
  height: ${(props) => props.netHeight}px;
  background-color: #333;
`;

const NetRope = styled.div`
  position: absolute;
  left: 50%;
  top: ${(props) => props.top}px; /* Position the net's height */
  transform: translateX(-50%);
  width: 100%; /* Spans the width of the court for collision purposes */
  height: 5px; /* The thickness of the top rope */
  background-color: white;
  z-index: 10; 
`;

const Net = ({ courtWidth, netWidth, netHeight }) => {
  // A typical volleyball net is 2.43m for men, let's set a standard in pixels.
  // We'll visually represent the net as a pole and a top rope.
  const netTopPosition = 150; // Example height from the top of the 400px court

  return (
    <>
      {/* The main dividing line remains, now visually enhanced */}
      <NetPole netWidth={netWidth} netHeight={netHeight} />
      {/* The top rope is where the "net collision" logic will focus */}
      <NetRope top={netTopPosition} />
    </>
  );
};

export default Net;
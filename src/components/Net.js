// src/components/Net.js
import React from 'react';
import styled from 'styled-components';

const NetPole = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0; 
  width: 5px; 
  height: ${(props) => props.netHeight}px;
  background-color: #333;
`;

const NetRope = styled.div`
  position: absolute;
  left: 50%;
  top: ${(props) => props.netTop}px; /* Sets the collision height */
  transform: translateX(-50%);
  width: 100%; 
  height: 5px; 
  /* Simple dashed/mesh pattern */
  background: repeating-linear-gradient(90deg, #fff, #fff 10px, #333 10px, #333 20px); 
  z-index: 10; 
  opacity: 0.8;
`;

const Net = ({ courtWidth, netHeight, netTop }) => {
  return (
    <>
      <NetPole netHeight={netHeight} /> 
      <NetRope netTop={netTop} /> 
    </>
  );
};

export default Net;
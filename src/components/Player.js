import React from 'react';
import styled from 'styled-components';

const Paddle = styled.div`
  position: absolute;
  width: 20px;
  height: 100px;
  background-color: blue;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
`;

const Player = ({ position }) => {
  return <Paddle top={position.top} left={position.left} />;
};

export default Player;
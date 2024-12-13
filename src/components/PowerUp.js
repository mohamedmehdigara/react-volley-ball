import React from 'react';
import styled from 'styled-components';

const PowerUp = ({ type, position }) => {
  const powerUpStyles = {
    speedBoost: { backgroundColor: 'yellow' },
    slowMotion: { backgroundColor: 'blue' },
    // Add more power-up styles here
  };

  const PowerUpDiv = styled.div`
    position: absolute;
    top: ${position.top}px;
    left: ${position.left}px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: ${props => powerUpStyles[props.type].backgroundColor};
  `;

  return <PowerUpDiv type={type} />;
};

export default PowerUp;
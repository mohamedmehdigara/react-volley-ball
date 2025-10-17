import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const OpponentBody = styled.div`
  width: 30px;
  height: ${(props) => props.paddleHeight}px;
  background-color: ${(props) => (props.isFlashing ? '#f0f0f0' : '#4a148c')}; /* Player 2 color (e.g., Purple) */
  border-radius: 5px;
  position: absolute;
  /* Fixed horizontal position */
  right: 100px; 
  bottom: 0; /* Align to the bottom of the court (Baseline) */
  transition: background-color 0.05s ease-in-out, height 0.3s;
  
  /* Vertical movement will be managed via the 'top' style based on the 'position' prop */
  transform: translateY(${(props) => props.translateY}px);
`;

const AIOpponent = ({ courtHeight, ballPosition, onPlayerMove, paddleHeight, difficulty, position, isFlashing }) => {
  // ... (Difficulty logic remains the same)
  
  // Use the 'position' prop to determine the player's height/vertical position
  const translateY = position - (courtHeight - paddleHeight);

  useEffect(() => {
    // ... (AI movement logic remains the same, moving towards ball.top)
  }, [ballPosition, position, courtHeight, paddleHeight, difficulty, onPlayerMove]);

  return (
    <OpponentBody 
      top={position} 
      paddleHeight={paddleHeight} 
      isFlashing={isFlashing} 
      translateY={translateY}
    />
  );
};

export default AIOpponent;
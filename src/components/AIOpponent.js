import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Paddle = styled.div`
  width: 20px;
  height: 100px;
  background-color: blue;
  position: absolute;
  top: ${(props) => props.top}px;
  left: 750px;
`;

const AIOpponent = ({ courtHeight, ballPosition }) => {
  const [position, setPosition] = useState(courtHeight / 2 - 50);
  const paddleHeight = 100;
  const speed = 5;
  const aiDelay = 50; // Delay in milliseconds for a human-like reaction time

  useEffect(() => {
    const followBall = () => {
      if (ballPosition) {
        // Simple AI prediction: move towards the ball's y-position
        const targetPosition = ballPosition.top;

        if (targetPosition < position + paddleHeight / 2) {
          setPosition(prevPos => Math.max(0, prevPos - speed));
        } else if (targetPosition > position + paddleHeight / 2) {
          setPosition(prevPos => Math.min(courtHeight - paddleHeight, prevPos + speed));
        }
      }
    };
    
    const timeoutId = setTimeout(followBall, aiDelay);

    return () => clearTimeout(timeoutId);
  }, [ballPosition, position, courtHeight, paddleHeight, speed, aiDelay]);

  return <Paddle top={position} />;
};

export default AIOpponent;
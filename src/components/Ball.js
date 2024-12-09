import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Ball = ({
  initialPosition = { top: 200, left: 400 },
  initialSpeed = 5,
  initialDirection = { x: 1, y: 1 },
  courtWidth,
  courtHeight,
  netWidth,
  netHeight,
  onPlayerCollision,
  outOfBounds,
  player1Paddle,
  player2Paddle,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);

  const ballRadius = 10;

  const isPlayerCollision = (ballPosition, playerPaddle) => {
    const { top, left, width, height } = playerPaddle;

    return (
      ballPosition.top + ballRadius >= top &&
      ballPosition.top - ballRadius <= top + height &&
      ballPosition.left + ballRadius >= left &&
      ballPosition.left - ballRadius <= left + width
    );
  };

  const resetBall = () => {
    setPosition(initialPosition);
    setSpeed(initialSpeed);
    setDirection({ x: 1, y: 1 });
  };

  const Ball = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: red;
    position: absolute;
    top: ${(props) => props.top}px;
    left: ${(props) => props.left}px;
  `;

  const animationRef = useRef(null);
  useEffect(() => {
    const animateBall = () => {
      const newTop = position.top + speed * direction.y;
      const newLeft = position.left + speed * direction.x;

      // Check for collisions with court boundaries
      if (newTop - ballRadius <= 0 || newTop + ballRadius >= courtHeight) {
        setDirection({ ...direction, y: -direction.y });
      } else if (newLeft - ballRadius <= 0 || newLeft + ballRadius >= courtWidth) {
        outOfBounds(newLeft < courtWidth / 2 ? 'player2' : 'player1');
        resetBall();
      } else if (newLeft >= courtWidth / 2 - netWidth / 2 && newLeft <= courtWidth / 2 + netWidth / 2 && newTop >= 0 && newTop <= netHeight) {
        setDirection({ ...direction, y: -direction.y });
      }

      // Check for player collisions
      if (isPlayerCollision(position, player1Paddle)) {
        // Handle collision with player 1 paddle
        // ... (Implement basic collision logic)
      } else if (isPlayerCollision(position, player2Paddle)) {
        // Handle collision with player 2 paddle
        // ... (Implement basic collision logic)
      }

      setPosition({ top: newTop, left: newLeft });
      animationRef.current = requestAnimationFrame(animateBall);
    };

    animationRef.current = requestAnimationFrame(animateBall);

    return () => cancelAnimationFrame(animationRef.current);
  }, [position, speed, direction, courtWidth, courtHeight, netWidth, netHeight, onPlayerCollision, outOfBounds, player1Paddle, player2Paddle]);

  return <Ball top={position.top} left={position.left} />;
};

export default Ball;
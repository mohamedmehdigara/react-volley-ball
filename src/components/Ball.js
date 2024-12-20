import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { SAT } from 'sat'; // For advanced collision detection

const Ball = ({
  initialPosition = { top: 200, left: 400 },
  initialSpeed = 5,
  initialDirection = { x: 1, y: 1 },
  initialSpinX = 0,
  initialSpinY = 0,
  airResistance = 0.01,
  courtWidth,
  courtHeight,
  netWidth,
  netHeight,
  onPlayerCollision,
  outOfBounds,
  player1Paddle,
  player2Paddle,
  powerUps,
  setPowerUps,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);
  const [spinX, setSpinX] = useState(initialSpinX);
  const [spinY, setSpinY] = useState(initialSpinY);

  const ballRadius = 10;
  const ballMass = 1; // Adjust ball mass for different physics behaviors

  const isPlayerCollision = (ballPosition, ballVelocity, playerPaddle) => {
    const ballCircle = new SAT.Circle(ballPosition.x, ballPosition.y, ballRadius);
    const paddleRect = new SAT.Box(playerPaddle.left, playerPaddle.top, playerPaddle.width, playerPaddle.height);

    const response = SAT.testCirclePolygon(ballCircle, paddleRect);

    if (response.collided) {
      // Calculate new ball velocity and spin based on collision angle and paddle velocity
      // ... (Implement advanced collision physics using SAT.js)
      return true;
    }
    return false;
  };

  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

  const resetBall = () => {
    setPosition(initialPosition);
    setSpeed(initialSpeed);
    setDirection({ x: 1, y: 1 });
    setSpinX(0);
    setSpinY(0);
  };

  const isPowerUpActive = (powerUp, ballPosition) => {
    const distanceX = Math.abs(ballPosition.left - powerUp.x);
    const distanceY = Math.abs(ballPosition.top - powerUp.y);
    return distanceX < ballRadius && distanceY < ballRadius;
  };

  const applyPowerUpEffect = (powerUp) => {
    switch (powerUp.type) {
      case 'speedBoost':
        setSpeed(speed * 1.5);
        setTimeout(() => {
          setSpeed(speed / 1.5);
        }, powerUp.duration);
        break;
      // Add more power-up types and effects here
      default:
        break;
    }
    setPowerUps(powerUps.filter((p) => p !== powerUp));
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
      const newTop = position.top + speed * direction.y + spinY;
      const newLeft = position.left + speed * direction.x + spinX;

      // Apply air resistance and spin effects
      setSpeed(Math.max(speed - airResistance, 0));

      // Check for collisions with court boundaries, net, and paddles
      if (newTop - ballRadius <= 0 || newTop + ballRadius >= courtHeight) {
        setDirection({ ...direction, y: -direction.y });
        setSpinY(-spinY);
      } else if (newLeft - ballRadius <= 0 || newLeft + ballRadius >= courtWidth) {
        outOfBounds(newLeft < courtWidth / 2 ? 'player2' : 'player1');
        resetBall();
      } else if (newLeft >= courtWidth / 2 - netWidth / 2 && newLeft <= courtWidth / 2 + netWidth / 2 && newTop >= 0 && newTop <= netHeight) {
        setDirection({ ...direction, y: -direction.y });
        setSpinY(-spinY);
        setSpeed(speed * 0.8);
      }

      // Check for player collisions
      if (isPlayerCollision(position, { x: speed * direction.x, y: speed * direction.y }, player1Paddle)) {
        // Handle collision with player 1 paddle
        // ... (Implement advanced collision physics and spin effects)
      } else if (isPlayerCollision(position, { x: speed * direction.x, y: speed * direction.y }, player2Paddle)) {
        // Handle collision with player 2 paddle
        // ... (Implement advanced collision physics and spin effects)
      }

      // Apply power-ups if applicable
      if (powerUps.length > 0) {
        const currentPowerUp = powerUps[0];
        if (isPowerUpActive(currentPowerUp, position)) {
          applyPowerUpEffect(currentPowerUp);
          setPowerUps(powerUps.filter((p) => p !== currentPowerUp));
        }
      }

      setPosition({ top: newTop, left: newLeft });
      animationRef.current = requestAnimationFrame(animateBall);
    };

    animationRef.current = requestAnimationFrame(animateBall);

    return () => cancelAnimationFrame(animationRef.current);
  }, [
    position,
    speed,
    direction,
    spinX,
    spinY,
    airResistance,
    courtWidth,
    courtHeight,
    netWidth,
    netHeight,
    onPlayerCollision,
    outOfBounds,
    player1Paddle,
    player2Paddle,
    powerUps,
    setPowerUps,
  ]);

  return <Ball top={position.top} left={position.left} />;
};

export default Ball;
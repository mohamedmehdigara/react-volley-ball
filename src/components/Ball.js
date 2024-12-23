import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Circle, Polygon, Vector, Response, SAT } from 'sat';

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
  const ballMass = 1;

  const isPlayerCollision = (ballPosition, ballVelocity, playerPaddle) => {
    const ballCircle = new Circle(ballPosition.x, ballPosition.y, ballRadius);
    const paddleRect = new Polygon(
      new SAT.Vector(playerPaddle.left, playerPaddle.top),
      [
        new SAT.Vector(0, 0),
        new SAT.Vector(playerPaddle.width, 0),
        new SAT.Vector(playerPaddle.width, playerPaddle.height),
        new SAT.Vector(0, playerPaddle.height),
      ]
    );

    const response = new Response();
    const collided = SAT.testCirclePolygon(ballCircle, paddleRect, response);

    if (collided) {
      // Calculate new ball velocity based on collision response
      const newDirection = reflectBall(direction, response.normal);
      setDirection(newDirection);

      // Apply spin and friction effects based on collision angle
      const friction = Math.min(Math.abs(response.normal.x), Math.abs(response.normal.y));
      setSpinX(spinX * (1 - friction * 0.5));
      setSpinY(spinY * (1 - friction * 0.5));

      // Optional: Play a collision sound effect
      // ...

      return true;
    }
    return false;
  };

  const reflectBall = (direction, normal) => {
    // Reflect the ball's direction based on the collision normal vector
    const newX = direction.x - 2 * normal.x * direction.x;
    const newY = direction.y - 2 * normal.y * direction.y;
    return { x: newX, y: newY };
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
      case 'spinReverse':
        setSpinX(-spinX);
        setSpinY(-spinY);
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
      } else if (isPlayerCollision(position, { x: speed * direction.x, y: speed * direction.y }, player2Paddle)) {
        // Handle collision with player 2 paddle
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
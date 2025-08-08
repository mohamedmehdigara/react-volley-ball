import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import SAT from 'sat'; // Correctly import the SAT object

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
  onBallUpdate,
  paddleHeight,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(initialSpeed);
  const [direction, setDirection] = useState(initialDirection);
  const [spinX, setSpinX] = useState(0); 
  const [spinY, setSpinY] = useState(0);
  const [gravity, setGravity] = useState(0.5); 
  const [airResistance, setAirResistance] = useState(0.01);

  const ballRadius = 10;

  const isPlayerCollision = (ballPosition, ballVelocity, playerPaddle) => {
    const ballCircle = new SAT.Circle(new SAT.Vector(ballPosition.left, ballPosition.top), ballRadius);
    
    if (!playerPaddle) {
      return false;
    }

    const paddleRect = new SAT.Polygon(
      new SAT.Vector(playerPaddle.left, playerPaddle.top),
      [
        new SAT.Vector(0, 0),
        new SAT.Vector(playerPaddle.width, 0),
        new SAT.Vector(playerPaddle.width, playerPaddle.height),
        new SAT.Vector(0, playerPaddle.height),
      ]
    );

    const response = new SAT.Response();
    const collided = SAT.testCirclePolygon(ballCircle, paddleRect, response);

    if (collided) {
      const normal = response.overlapV.clone().normalize();
      const dot = ballVelocity.x * normal.x + ballVelocity.y * normal.y;
      
      const newDirection = {
        x: ballVelocity.x - 2 * dot * normal.x,
        y: ballVelocity.y - 2 * dot * normal.y,
      };

      const paddleCenter = playerPaddle.top + playerPaddle.height / 2;
      const hitPoint = ballPosition.top - paddleCenter;
      setSpinX(hitPoint / (paddleHeight / 2) * 2); 

      setDirection({
        x: newDirection.x,
        y: newDirection.y + gravity,
      });

      onPlayerCollision();
      return true;
    }
    return false;
  };

  const animateBall = () => {
    let newDirection = {
      x: direction.x,
      y: direction.y + gravity / 10,
    };
    
    let newSpeed = speed * (1 - airResistance);

    const newTop = position.top + newSpeed * newDirection.y + spinY;
    const newLeft = position.left + newSpeed * newDirection.x + spinX;

    if (newTop - ballRadius <= 0 || newTop + ballRadius >= courtHeight) {
      newDirection.y = -newDirection.y;
    } else if (newLeft - ballRadius <= 0 || newLeft + ballRadius >= courtWidth) {
      outOfBounds(newLeft < courtWidth / 2 ? 'player2' : 'player1');
      return;
    }

    if (isPlayerCollision(position, { x: newSpeed * newDirection.x, y: newSpeed * newDirection.y }, player1Paddle) || 
        isPlayerCollision(position, { x: newSpeed * newDirection.x, y: newSpeed * newDirection.y }, player2Paddle)) {
    }

    onBallUpdate({
      position: { top: newTop, left: newLeft },
      speed: newSpeed,
      direction: newDirection,
    });
    
    requestAnimationFrame(animateBall);
  };

  useEffect(() => {
    const animationFrame = requestAnimationFrame(animateBall);
    return () => cancelAnimationFrame(animationFrame);
  }, [position, speed, direction, spinX, spinY, courtWidth, courtHeight, netWidth, netHeight, paddleHeight]);

  const BallDiv = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: red;
    position: absolute;
    top: ${(props) => props.top}px;
    left: ${(props) => props.left}px;
  `;

  return <BallDiv top={position.top} left={position.left} />;
};

export default Ball;
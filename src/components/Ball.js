import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Circle, Polygon, Vector, Response, SAT } from 'sat'; 

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
  const [spinX, setSpinX] = useState(0); 
  const [spinY, setSpinY] = useState(0);

  const ballRadius = 10;

  const isPlayerCollision = (ballPosition, ballVelocity, playerPaddle) => {
    const ballCircle = new Circle(ballPosition.x, ballPosition.y, ballRadius);

    if (!playerPaddle) { 
      console.error("playerPaddle is undefined in isPlayerCollision");
      return false; 
    }

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
      const v = response.overlapV.clone().normalize(); 
      const newDirection = { x: v.x, y: v.y }; 
      setDirection(newDirection); 

      // Apply some simple spin (adjust as needed)
      const spinFactor = 0.5; // Adjust this value to control the amount of spin
      setSpinX(v.y * spinFactor);
      setSpinY(-v.x * spinFactor);

      onPlayerCollision(); 
      return true;
    }
    return false;
  };

  const animateBall = () => {
    const newTop = position.top + speed * direction.y + spinY; 
    const newLeft = position.left + speed * direction.x + spinX;

    // Check for collisions with court boundaries
    if (newTop - ballRadius <= 0 || newTop + ballRadius >= courtHeight) {
      setDirection({ ...direction, y: -direction.y }); 
      setSpinY(-spinY); // Reverse spin on wall collision
    } else if (newLeft - ballRadius <= 0 || newLeft + ballRadius >= courtWidth) { 
      outOfBounds(newLeft < courtWidth / 2 ? 'player2' : 'player1'); 
      return; // Stop animation on out of bounds
    }

    // Check for collisions with the net
    if (newLeft >= courtWidth / 2 - netWidth / 2 && newLeft <= courtWidth / 2 + netWidth / 2 && newTop >= 0 && newTop <= netHeight) {
      setDirection({ ...direction, x: -direction.x }); // Simple net collision handling
      setSpinX(-spinX); // Reverse spin on net collision
    }

    // Check for player collisions
    if (isPlayerCollision(position, { x: speed * direction.x, y: speed * direction.y }, player1Paddle)) {
      // Handle collision with player 1 paddle 
    } else if (isPlayerCollision(position, { x: speed * direction.x, y: speed * direction.y }, player2Paddle)) {
      // Handle collision with player 2 paddle
    }

    setPosition({ top: newTop, left: newLeft });

    requestAnimationFrame(animateBall);
  };

  useEffect(() => {
    const animationFrame = requestAnimationFrame(animateBall);
    return () => cancelAnimationFrame(animationFrame);
  }, [position, speed, direction, spinX, spinY, courtWidth, courtHeight, netWidth, netHeight]); 

  const Ball = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: red;
    position: absolute;
    top: ${(props) => props.top}px;
    left: ${(props) => props.left}px;
  `;

  return <Ball top={position.top} left={position.left} />;
};

export default Ball;
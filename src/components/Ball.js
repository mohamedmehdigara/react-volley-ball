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
        new SAT.Vector(0, playerPaddle.height) 
      ]
    );

    const response = new Response(); 
    const collided = SAT.testCirclePolygon(ballCircle, paddleRect, response); 

    if (collided) {
      // Calculate new ball velocity based on collision response
      const v = response.overlapV.clone().normalize(); 
      const newDirection = { x: v.x, y: v.y }; 
      setDirection(newDirection); 

      // Apply spin and friction effects based on collision angle and paddle velocity
      const friction = Math.min(Math.abs(response.normal.x), Math.abs(response.normal.y));
      setSpinX(spinX * (1 - friction * 0.5)); 
      setSpinY(spinY * (1 - friction * 0.5)); 

      return true;
    }
    return false;
  };

  // ... (rest of the Ball component)
};

export default Ball;
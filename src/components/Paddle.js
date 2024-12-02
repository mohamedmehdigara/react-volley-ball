import React, { useState } from 'react';
import styled from 'styled-components';



function Paddle({ initialTop = 100, playerSide }) {
    const Paddle = styled.div`
    width: 20px;
    height: 100px;
    background-color: blue;
    position: absolute;
    top: ${(props) => props.top}px;
    left: ${(props) => props.left}px;
  `;

  const [top, setTop] = useState(initialTop);
  const paddleSpeed = 5;

  const handleKeyUp = (event) => {
    if (event.key === 'w' && playerSide === 'player1') {
      setTop((prevTop) => Math.max(prevTop - paddleSpeed, 0));
    } else if (event.key === 's' && playerSide === 'player1') {
      setTop((prevTop) => Math.min(prevTop + paddleSpeed, courtHeight - paddleHeight));
    } else if (event.key === 'ArrowUp' && playerSide === 'player2') {
      setTop((prevTop) => Math.max(prevTop - paddleSpeed, 0));
    } else if (event.key === 'ArrowDown' && playerSide === 'player2') {
      setTop((prevTop) => Math.min(prevTop + paddleSpeed, courtHeight - paddleHeight));
    }
  };

  useEffect(() => {
    document.addEventListener('keyup', handleKeyUp);
    return () => document.removeEventListener('keyup', handleKeyUp);
  }, [handleKeyUp]); 1 

  const paddleHeight = 100;

  return (
    <Paddle top={top} left={playerSide === 'player1' ? 10 : courtWidth - 30}>
    </Paddle>
  );
}

export default Paddle;
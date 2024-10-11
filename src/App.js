import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import Court from './components/Court';
import Net from './components/Net';
import Ball from './components/Ball';
import Player from './components/Player';

const GameContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

function App() {
  const [ballPosition, setBallPosition] = useState({ top: 200, left: 400 });
  const [player1Position, setPlayer1Position] = useState({ top: 160, left: 50 });
  const [player2Position, setPlayer2Position] = useState({ top: 160, left: 750 });

  // ... game logic, controls, and styling ...

  return (
    <GameContainer>
      <Court>
        <Net />
        <Ball style={{ top: ballPosition.top, left: ballPosition.left }} />
        <Player style={{ top: player1Position.top, left: player1Position.left }} />
        <Player style={{ top: player2Position.top, left: player2Position.left }} />
      </Court>
    </GameContainer>
  );
}


export default App;

import React from 'react';
import styled from 'styled-components';

const Modal = styled.div`
  // ... (CSS for styling the modal)
`;

const GameOverModal = ({ isGameOver, winner, onRestart }) => {
  if (!isGameOver) {
    return null;
  }

  return (
    <Modal>
      <h2>Game Over!</h2>
      <p>Winner: {winner}</p>
      <button onClick={onRestart}>Play Again</button>
    </Modal>
  );
};

export default GameOverModal;
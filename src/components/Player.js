import React, { useEffect, useCallback } from 'react';

const Player = ({ 
  courtWidth, 
  onPlayerMoveX, 
  paddleHeight, 
  positionX, 
  positionY, 
  isFlashing, 
  onServe,
  isCpu = false 
}) => {
  const [isJumping, setIsJumping] = React.useState(false);

  const handleAction = useCallback(() => {
    if (isJumping) return;
    setIsJumping(true);
    if (onServe) onServe();
    // Reset jump state after the CSS transition duration (500ms)
    setTimeout(() => setIsJumping(false), 500);
  }, [isJumping, onServe]);

  useEffect(() => {
    if (isCpu) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') onPlayerMoveX(x => Math.max(0, x - 20));
      if (e.key === 'ArrowRight') onPlayerMoveX(x => Math.min(courtWidth / 2 - 45, x + 20));
      if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        handleAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [courtWidth, onPlayerMoveX, handleAction, isCpu]);

  return (
    <div style={{
      position: 'absolute',
      left: 0, top: 0,
      width: 40, height: paddleHeight,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transition: 'transform 0.1s linear, margin-top 0.25s ease-out',
      transform: `translate3d(${positionX}px, ${positionY}px, 0)`,
      marginTop: isJumping ? -100 : 0,
      zIndex: 10
    }}>
      {/* Head */}
      <div style={{ width: 22, height: 22, backgroundColor: '#ffdbac', borderRadius: '50%', border: '2px solid #333' }} />
      {/* Body */}
      <div style={{ 
        width: '100%', flex: 1, border: '2px solid #333', borderRadius: '6px 6px 2px 2px',
        backgroundColor: isFlashing ? '#fff' : (isCpu ? '#2196F3' : '#E91E63') 
      }} />
    </div>
  );
};

export default  Player;
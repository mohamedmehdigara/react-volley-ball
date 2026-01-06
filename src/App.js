import React, { useState, useEffect, useRef, useCallback } from 'react';
import Ball from './components/Ball';
import Net from './components/Net';
import Player from './components/Player';

// --- CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 80;
const BALL_RADIUS = 12;
const NET_WIDTH = 8;
const NET_HEIGHT = 140;
const GRAVITY = 0.25;

const App = () => {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState({ p1: 0, cpu: 0 });
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Physics Refs (Mutable state to avoid React render lag)
  const p1 = useRef({ x: 600, y: 340, vx: 0, vy: 0, isJumping: false, color: '#10b981' });
  const cpu = useRef({ x: 150, y: 340, vx: 0, vy: 0, isJumping: false, color: '#f43f5e', targetX: 150 });
  const ball = useRef({ x: 400, y: 100, vx: 0, vy: 0, rotation: 0 });
  const keys = useRef({});
  const requestRef = useRef();

  const resetBall = (scorer) => {
    ball.current = { x: scorer === 'p1' ? 200 : 600, y: 100, vx: 0, vy: 0, rotation: 0 };
  };

  const gameLoop = useCallback(() => {
    if (gameState === 'PLAYING') {
      // 1. Controls (P1)
      if (keys.current['ArrowLeft']) p1.current.vx -= 0.8;
      if (keys.current['ArrowRight']) p1.current.vx += 0.8;
      if (keys.current['ArrowUp'] && !p1.current.isJumping) {
        p1.current.vy = -10;
        p1.current.isJumping = true;
      }

      // 2. Simple AI
      let aiTarget = ball.current.x - PLAYER_WIDTH / 2;
      if (ball.current.x > CANVAS_WIDTH / 2) aiTarget = 150; // Return to base
      const diff = aiTarget - cpu.current.x;
      cpu.current.vx += Math.sign(diff) * 0.6;
      
      if (!cpu.current.isJumping && ball.current.x < CANVAS_WIDTH/2 && ball.current.y < 200) {
        cpu.current.vy = -9;
        cpu.current.isJumping = true;
      }

      // 3. Movement Physics
      [p1.current, cpu.current].forEach((p, idx) => {
        p.vx *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;

        // Ground collision
        if (p.y > CANVAS_HEIGHT - PLAYER_HEIGHT - 30) {
          p.y = CANVAS_HEIGHT - PLAYER_HEIGHT - 30;
          p.vy = 0;
          p.isJumping = false;
        }

        // Net/Wall boundaries
        const isP1 = idx === 0;
        const minX = isP1 ? CANVAS_WIDTH / 2 + NET_WIDTH : 30;
        const maxX = isP1 ? CANVAS_WIDTH - PLAYER_WIDTH - 30 : CANVAS_WIDTH / 2 - NET_WIDTH - PLAYER_WIDTH;
        p.x = Math.max(minX, Math.min(maxX, p.x));
      });

      // 4. Ball Physics
      ball.current.x += ball.current.vx;
      ball.current.y += ball.current.vy;
      ball.current.vy += GRAVITY;
      ball.current.rotation += ball.current.vx * 2;

      // Wall Bounce
      if (ball.current.x < BALL_RADIUS + 20 || ball.current.x > CANVAS_WIDTH - BALL_RADIUS - 20) {
        ball.current.vx *= -0.7;
        ball.current.x = ball.current.x < BALL_RADIUS + 20 ? BALL_RADIUS + 20 : CANVAS_WIDTH - BALL_RADIUS - 20;
      }

      // Net Collision
      if (ball.current.y > CANVAS_HEIGHT - NET_HEIGHT - 30 && Math.abs(ball.current.x - CANVAS_WIDTH / 2) < BALL_RADIUS + 5) {
        ball.current.vx *= -0.8;
      }

      // Player Collision
      [p1.current, cpu.current].forEach(p => {
        if (ball.current.x + BALL_RADIUS > p.x && ball.current.x - BALL_RADIUS < p.x + PLAYER_WIDTH &&
            ball.current.y + BALL_RADIUS > p.y && ball.current.y - BALL_RADIUS < p.y + PLAYER_HEIGHT) {
          ball.current.vy = -10;
          ball.current.vx = (ball.current.x - (p.x + PLAYER_WIDTH/2)) * 0.4 + p.vx * 0.5;
          ball.current.y = p.y - BALL_RADIUS - 2;
        }
      });

      // Scoring
      if (ball.current.y > CANVAS_HEIGHT - BALL_RADIUS - 30) {
        const scorer = ball.current.x > CANVAS_WIDTH / 2 ? 'cpu' : 'p1';
        setScore(s => ({ ...s, [scorer]: s[scorer] + 1 }));
        setGameState('SCORING');
        setTimeout(() => {
          resetBall(scorer);
          setGameState('PLAYING');
        }, 1000);
      }

      setRenderTrigger(prev => prev + 1);
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  useEffect(() => {
    const down = (e) => keys.current[e.key] = true;
    const up = (e) => keys.current[e.key] = false;
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  // --- STYLES ---
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: 'white',
    fontFamily: 'sans-serif'
  };

  const courtStyle = {
    position: 'relative',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    border: '4px solid #334155',
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', gap: '40px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#f43f5e' }}>CPU</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{score.cpu}</div>
        </div>
        <div style={{ fontSize: '24px', opacity: 0.3 }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#10b981' }}>PLAYER</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{score.p1}</div>
        </div>
      </div>

      <div style={courtStyle}>
        {/* Floor */}
        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '30px', backgroundColor: '#334155' }} />
        
        {/* Net */}
        <Net style={{ 
          position: 'absolute', 
          bottom: '30px', 
          left: '50%', 
          width: NET_WIDTH, 
          height: NET_HEIGHT, 
          backgroundColor: 'white', 
          transform: 'translateX(-50%)',
          borderRadius: '4px'
        }} />

        {/* Players */}
        {[p1.current, cpu.current].map((p, i) => (
          <Player key={i} style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            backgroundColor: p.color,
            borderRadius: '12px',
            transition: 'transform 0.1s'
          }}>
            <div style={{ width: '10px', height: '10px', background: 'white', borderRadius: '50%', margin: '10px auto' }} />
          </Player>
        ))}

        {/* Ball */}
        <Ball style={{
          position: 'absolute',
          left: ball.current.x - BALL_RADIUS,
          top: ball.current.y - BALL_RADIUS,
          width: BALL_RADIUS * 2,
          height: BALL_RADIUS * 2,
          backgroundColor: '#fbbf24',
          borderRadius: '50%',
          transform: `rotate(${ball.current.rotation}deg)`,
          border: '2px solid #b45309'
        }} />

        {/* Overlays */}
        {gameState !== 'PLAYING' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            {gameState === 'START' && (
              <button 
                onClick={() => setGameState('PLAYING')}
                style={{ padding: '15px 40px', fontSize: '20px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                START VOLLEYBALL
              </button>
            )}
            {gameState === 'SCORING' && <h1 style={{ fontSize: '64px', fontStyle: 'italic' }}>POINT!</h1>}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', color: '#64748b', fontSize: '14px' }}>
        USE ARROW KEYS TO MOVE AND JUMP
      </div>
    </div>
  );
};

export default App;
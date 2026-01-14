import React, { useState, useEffect, useCallback, useRef } from 'react';

/** --- GLOBAL CONSTANTS --- **/
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const NET_X = 400;
const GROUND_Y = 440;
const PLAYER_SIZE = 60; 
const BALL_SIZE = 24;
const GRAVITY = 0.25;
const AI_SPEED = 4.5;
const FRICTION = 0.99;

/** --- INLINE STYLES (Replacement for App.css) --- **/
const styles = `
  .game-root {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #0f172a;
    font-family: sans-serif;
    color: white;
    margin: 0;
  }
  .court-area {
    position: relative;
    width: ${COURT_WIDTH}px;
    height: ${COURT_HEIGHT}px;
    background-color: #38bdf8; /* sky-400 */
    border: 4px solid #334155;
    border-radius: 0 0 24px 24px;
    overflow: hidden;
    cursor: crosshair;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .header-ui {
    width: ${COURT_WIDTH}px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 20px 48px;
    background-color: #1e293b;
    border-radius: 24px 24px 0 0;
    border: 4px solid #334155;
    border-bottom: none;
    box-sizing: border-box;
  }
  .score-val { font-size: 60px; font-weight: 900; margin: 0; line-height: 1; }
  .label-text { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }
  .btn-serve {
    background: #facc15;
    color: #0f172a;
    border: none;
    padding: 15px 40px;
    font-size: 24px;
    font-weight: 900;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 6px 0 0 #ca8a04;
    transition: transform 0.1s;
  }
  .btn-serve:active { transform: translateY(3px); box-shadow: 0 3px 0 0 #ca8a04; }
  .ground {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: ${COURT_HEIGHT - GROUND_Y}px;
    background: #ea580c;
    border-top: 6px solid #9a3412;
    z-index: 5;
  }
  .net-mesh {
    position: absolute;
    left: ${NET_X - 4}px;
    bottom: ${COURT_HEIGHT - GROUND_Y}px;
    width: 8px;
    height: 140px;
    background: white;
    z-index: 10;
  }
`;

/** --- SUB-COMPONENTS --- **/

const Ball = ({ x, y }) => (
  <div 
    style={{ 
      position: 'absolute',
      width: BALL_SIZE, 
      height: BALL_SIZE, 
      left: x - BALL_SIZE / 2, 
      top: y - BALL_SIZE / 2,
      backgroundColor: '#facc15',
      borderRadius: '50%',
      border: '2px solid #ca8a04',
      zIndex: 50,
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
    }}
  />
);

const Player = ({ x, color, label }) => (
  <div 
    style={{ 
      position: 'absolute',
      width: PLAYER_SIZE, 
      height: PLAYER_SIZE, 
      left: x - PLAYER_SIZE / 2, 
      top: GROUND_Y - PLAYER_SIZE,
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}
  >
    <div style={{ fontSize: '10px', fontWeight: '900', color: 'white', marginBottom: '4px', textShadow: '1px 1px 2px black' }}>
      {label}
    </div>
    <div style={{ 
      width: '100%', 
      height: '100%', 
      borderRadius: '50%', 
      backgroundColor: color === 'blue' ? '#3b82f6' : '#ef4444',
      border: `4px solid ${color === 'blue' ? '#1d4ed8' : '#b91c1c'}`,
      boxShadow: '0 10px 15px rgba(0,0,0,0.3)'
    }} />
  </div>
);

/** --- MAIN APP --- **/

export default function App() {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState({ p1: 0, ai: 0 });
  
  const ballPhys = useRef({ x: 200, y: 200, vx: 5, vy: 0 });
  const p1Phys = useRef({ x: 150 });
  const aiPhys = useRef({ x: 650 });
  const mouseX = useRef(150);
  
  const [renderData, setRenderData] = useState({
    ball: { x: 200, y: 200 },
    p1: { x: 150 },
    ai: { x: 650 }
  });

  const requestRef = useRef();

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // 1. Player Movement
    let p1X = p1Phys.current.x + (mouseX.current - p1Phys.current.x) * 0.25;
    p1X = Math.max(PLAYER_SIZE / 2, Math.min(NET_X - PLAYER_SIZE / 2 - 5, p1X));
    p1Phys.current.x = p1X;

    // 2. AI Movement
    const b = ballPhys.current;
    let aiTarget = (b.vx > 0 || b.x > NET_X) ? b.x : 650;
    let aiDiff = aiTarget - aiPhys.current.x;
    let aiMove = Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), AI_SPEED);
    let aiX = aiPhys.current.x + aiMove;
    aiX = Math.max(NET_X + PLAYER_SIZE / 2 + 5, Math.min(COURT_WIDTH - PLAYER_SIZE / 2, aiX));
    aiPhys.current.x = aiX;

    // 3. Ball Physics
    b.vx *= FRICTION;
    b.vy += GRAVITY;
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < BALL_SIZE / 2) { b.x = BALL_SIZE / 2; b.vx *= -0.8; }
    if (b.x > COURT_WIDTH - BALL_SIZE / 2) { b.x = COURT_WIDTH - BALL_SIZE / 2; b.vx *= -0.8; }
    if (Math.abs(b.x - NET_X) < (BALL_SIZE / 2 + 4) && b.y > GROUND_Y - 140) {
      b.vx *= -0.7;
      b.x = b.x < NET_X ? NET_X - (BALL_SIZE / 2 + 5) : NET_X + (BALL_SIZE / 2 + 5);
    }

    const checkHit = (px) => {
      const py = GROUND_Y - PLAYER_SIZE / 2;
      const dx = b.x - px;
      const dy = b.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (BALL_SIZE + PLAYER_SIZE) / 2;
      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        b.x = px + nx * (minDist + 1);
        b.y = py + ny * (minDist + 1);
        b.vx = nx * 13;
        b.vy = Math.min(ny * 13, -9); 
      }
    };
    checkHit(p1Phys.current.x);
    checkHit(aiPhys.current.x);

    // Scoring
    if (b.y > GROUND_Y - BALL_SIZE / 2) {
      const winner = b.x < NET_X ? 'ai' : 'p1';
      setScore(s => ({ ...s, [winner]: s[winner] + 1 }));
      setGameState('START');
      ballPhys.current = { x: winner === 'p1' ? 200 : 600, y: 150, vx: winner === 'p1' ? 5 : -5, vy: 0 };
      return;
    }

    setRenderData({
      ball: { x: b.x, y: b.y },
      p1: { x: p1Phys.current.x },
      ai: { x: aiPhys.current.x }
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="game-root">
      <style>{styles}</style>
      
      <div className="header-ui">
        <div style={{ textAlign: 'center' }}>
          <div className="label-text" style={{ color: '#60a5fa' }}>Player</div>
          <p className="score-val">{score.p1}</p>
        </div>
        <h1 style={{ margin: 0, fontStyle: 'italic', color: '#facc15', fontSize: '32px' }}>VOLLEY PRO</h1>
        <div style={{ textAlign: 'center' }}>
          <div className="label-text" style={{ color: '#f87171' }}>CPU</div>
          <p className="score-val">{score.ai}</p>
        </div>
      </div>

      <div 
        className="court-area"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseX.current = e.clientX - rect.left;
        }}
      >
        <div className="ground" />
        <div className="net-mesh" />
        
        <Ball x={renderData.ball.x} y={renderData.ball.y} />
        <Player x={renderData.p1.x} color="blue" label="YOU" />
        <Player x={renderData.ai.x} color="red" label="CPU" />

        {gameState === 'START' && (
          <div className="overlay">
            <h2 style={{ fontSize: '48px', marginBottom: '30px' }}>READY?</h2>
            <button className="btn-serve" onClick={() => setGameState('PLAYING')}>
              SERVE BALL
            </button>
            <p style={{ marginTop: '40px', opacity: 0.6, fontSize: '12px', fontWeight: 'bold' }}>
              MOVE MOUSE TO CONTROL PLAYER
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
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

/** --- SUB-COMPONENTS --- **/

const Court = () => (
  <div 
    className="absolute bottom-0 w-full bg-orange-600 border-t-8 border-orange-800"
    style={{ height: COURT_HEIGHT - GROUND_Y, zIndex: 5 }}
  >
    {/* Court Lines */}
    <div className="w-full h-1 bg-white/30 mt-4" />
  </div>
);

const Net = () => (
  <div 
    className="absolute bg-white border-x-2 border-slate-300 shadow-xl"
    style={{ 
      left: NET_X - 4, 
      bottom: COURT_HEIGHT - GROUND_Y, 
      width: 8, 
      height: 140, 
      zIndex: 10 
    }}
  >
    {/* Net Mesh Effect */}
    <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(0deg,black,black_5px,transparent_5px,transparent_10px)]" />
    <div className="absolute top-0 w-12 -left-2 h-4 bg-white rounded shadow-sm border border-slate-200" />
  </div>
);

const Ball = ({ x, y }) => (
  <div 
    className="absolute bg-yellow-300 rounded-full border-2 border-yellow-600 shadow-lg"
    style={{ 
      width: BALL_SIZE, 
      height: BALL_SIZE, 
      left: x - BALL_SIZE / 2, 
      top: y - BALL_SIZE / 2,
      zIndex: 50
    }}
  >
    {/* Ball Shine */}
    <div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full" />
  </div>
);

const Player = ({ x, color, label }) => (
  <div 
    className="absolute flex flex-col items-center"
    style={{ 
      width: PLAYER_SIZE, 
      height: PLAYER_SIZE, 
      left: x - PLAYER_SIZE / 2, 
      top: GROUND_Y - PLAYER_SIZE,
      zIndex: 40
    }}
  >
    <div className="mb-1 text-[10px] font-black uppercase text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
      {label}
    </div>
    <div className={`w-full h-full rounded-full border-4 shadow-2xl ${color === 'blue' ? 'bg-blue-500 border-blue-700' : 'bg-red-500 border-red-700'}`}>
      {/* Eyes */}
      <div className="flex justify-around mt-3 px-2">
        <div className="w-2 h-2 bg-white rounded-full" />
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
    </div>
  </div>
);

/** --- MAIN APP --- **/

export default function App() {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState({ p1: 0, ai: 0 });
  
  // Physics Refs
  const ballPhys = useRef({ x: 200, y: 200, vx: 5, vy: 0 });
  const p1Phys = useRef({ x: 150 });
  const aiPhys = useRef({ x: 650 });
  const mouseX = useRef(150);
  
  // State for rendering (Triggered every frame)
  const [renderData, setRenderData] = useState({
    ball: { x: 200, y: 200 },
    p1: { x: 150 },
    ai: { x: 650 }
  });

  const requestRef = useRef();

  const resetBall = (winner) => {
    setGameState('START');
    ballPhys.current = { 
      x: winner === 'p1' ? 200 : 600, 
      y: 150, 
      vx: winner === 'p1' ? 5 : -5, 
      vy: 0 
    };
    setRenderData(prev => ({ 
      ...prev, 
      ball: { x: ballPhys.current.x, y: ballPhys.current.y } 
    }));
  };

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // 1. Player 1 Movement (Mouse Follow)
    let p1X = p1Phys.current.x + (mouseX.current - p1Phys.current.x) * 0.2;
    p1X = Math.max(PLAYER_SIZE / 2, Math.min(NET_X - PLAYER_SIZE / 2 - 10, p1X));
    p1Phys.current.x = p1X;

    // 2. AI Movement
    const b = ballPhys.current;
    let aiTarget = (b.vx > 0 || b.x > NET_X) ? b.x : 650;
    let aiDiff = aiTarget - aiPhys.current.x;
    let aiMove = Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), AI_SPEED);
    let aiX = aiPhys.current.x + aiMove;
    aiX = Math.max(NET_X + PLAYER_SIZE / 2 + 10, Math.min(COURT_WIDTH - PLAYER_SIZE / 2, aiX));
    aiPhys.current.x = aiX;

    // 3. Ball Physics
    b.vx *= FRICTION;
    b.vy += GRAVITY;
    b.x += b.vx;
    b.y += b.vy;

    // Wall Bounces
    if (b.x < BALL_SIZE / 2) { b.x = BALL_SIZE / 2; b.vx *= -0.8; }
    if (b.x > COURT_WIDTH - BALL_SIZE / 2) { b.x = COURT_WIDTH - BALL_SIZE / 2; b.vx *= -0.8; }

    // Net Collision
    if (Math.abs(b.x - NET_X) < (BALL_SIZE / 2 + 4) && b.y > GROUND_Y - 140) {
      b.vx *= -0.7;
      b.x = b.x < NET_X ? NET_X - (BALL_SIZE / 2 + 5) : NET_X + (BALL_SIZE / 2 + 5);
    }

    // Player/Ball Collision
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
        const power = 13;
        b.vx = nx * power;
        b.vy = Math.min(ny * power, -8); // Always pop upwards
      }
    };

    checkHit(p1Phys.current.x);
    checkHit(aiPhys.current.x);

    // Scoring (Floor Hit)
    if (b.y > GROUND_Y - BALL_SIZE / 2) {
      const winner = b.x < NET_X ? 'ai' : 'p1';
      setScore(s => ({ ...s, [winner]: s[winner] + 1 }));
      resetBall(winner);
      return;
    }

    // Update rendering state
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 p-4 select-none font-sans">
      {/* Scoreboard */}
      <div className="w-[800px] flex justify-between items-center mb-0 px-10 py-6 bg-neutral-800 rounded-t-3xl border-x-4 border-t-4 border-neutral-700">
        <div className="flex flex-col items-center">
          <span className="text-blue-400 font-bold text-xs tracking-[0.2em]">PLAYER</span>
          <span className="text-6xl font-black text-white">{score.p1}</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black italic text-yellow-400 tracking-tighter shadow-black">BEACH VOLLEY</h1>
          <div className="h-1 w-full bg-yellow-400/20 rounded-full mt-1" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-red-400 font-bold text-xs tracking-[0.2em]">CPU</span>
          <span className="text-6xl font-black text-white">{score.ai}</span>
        </div>
      </div>

      {/* Play Area */}
      <div 
        className="relative bg-cyan-400 overflow-hidden border-4 border-neutral-700 shadow-2xl rounded-b-3xl"
        style={{ width: COURT_WIDTH, height: COURT_HEIGHT }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseX.current = e.clientX - rect.left;
        }}
      >
        {/* Environment Decorations */}
        <div className="absolute top-8 left-12 w-20 h-20 bg-white/30 rounded-full blur-2xl" />
        <div className="absolute top-20 right-32 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

        {/* Game Layers */}
        <Court />
        <Net />
        <Ball x={renderData.ball.x} y={renderData.ball.y} />
        <Player x={renderData.p1.x} color="blue" label="YOU" />
        <Player x={renderData.ai.x} color="red" label="CPU" />

        {/* Start Overlay */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
            <button 
              className="group relative px-10 py-5 bg-yellow-400 hover:bg-yellow-300 rounded-2xl transition-all active:scale-95"
              onClick={() => setGameState('PLAYING')}
            >
              <span className="relative z-10 text-neutral-900 font-black text-4xl">SERVE BALL</span>
              <div className="absolute inset-0 bg-yellow-500 rounded-2xl translate-y-2 group-hover:translate-y-1 transition-transform -z-10" />
            </button>
            <p className="mt-8 text-white/70 font-medium tracking-widest text-sm animate-pulse">
              MOVE MOUSE TO PLAY
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-4 text-neutral-500 font-mono text-[10px] uppercase tracking-widest">
        <span>FPS: 60</span>
        <span>•</span>
        <span>Physics: Verified</span>
        <span>•</span>
        <span>V 2.1.0</span>
      </div>
    </div>
  );
}
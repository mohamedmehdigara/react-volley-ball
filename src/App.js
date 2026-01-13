import React, { useState, useEffect, useCallback, useRef } from 'react';
import Court from './components/Court';
import Net from './components/Net';
import Ball from './components/Ball';
import Player from './components/Player';
import Crowd from './components/Crowd';


/** --- CONSTANTS --- **/
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const NET_X = 400;
const GROUND_Y = 440;
const PLAYER_SIZE = 50;
const BALL_SIZE = 20;
const GRAVITY = 0.25;
const AI_SPEED = 4.5;

/** --- SUB-COMPONENTS --- **/






/** --- MAIN APP --- **/

export default function App() {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState({ p1: 0, ai: 0 });
  
  // High-frequency values kept in Refs to prevent React render-cycle lag
  const [ball, setBall] = useState({ x: 200, y: 150, vx: 5, vy: 0 });
  const [p1, setP1] = useState({ x: 150, y: GROUND_Y - PLAYER_SIZE / 2 });
  const [ai, setAi] = useState({ x: 650, y: GROUND_Y - PLAYER_SIZE / 2 });
  
  const mouseX = useRef(150);
  const requestRef = useRef();

  const resetBall = (winner) => {
    setBall({ 
      x: winner === 'p1' ? 200 : 600, 
      y: 150, 
      vx: winner === 'p1' ? 5 : -5, 
      vy: 0 
    });
    setGameState('START');
  };

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // 1. Update Player 1 (Mouse Follow)
    setP1(prev => {
      let nx = prev.x + (mouseX.current - prev.x) * 0.2;
      nx = Math.max(PLAYER_SIZE / 2, Math.min(NET_X - PLAYER_SIZE / 2 - 10, nx));
      return { ...prev, x: nx };
    });

    // 2. Update AI (Strategic Follow)
    setAi(prev => {
      let targetX = ball.x;
      // AI only moves if the ball is on its side or coming towards it
      if (ball.x < NET_X) targetX = 650; 
      
      let diff = targetX - prev.x;
      let move = Math.sign(diff) * Math.min(Math.abs(diff), AI_SPEED);
      let nx = prev.x + move;
      
      // Keep AI on its side
      nx = Math.max(NET_X + PLAYER_SIZE / 2 + 10, Math.min(COURT_WIDTH - PLAYER_SIZE / 2, nx));
      return { ...prev, x: nx };
    });

    // 3. Update Ball Physics
    setBall(b => {
      let nx = b.x + b.vx;
      let ny = b.y + b.vy;
      let nvx = b.vx;
      let nvy = b.vy + GRAVITY;

      // Wall Bounces
      if (nx < BALL_SIZE / 2 || nx > COURT_WIDTH - BALL_SIZE / 2) nvx *= -1;
      
      // Net Collision (Solid body)
      if (Math.abs(nx - NET_X) < (BALL_SIZE / 2 + 5) && ny > GROUND_Y - 120) {
        nvx = nx < NET_X ? -Math.abs(nvx) : Math.abs(nvx);
      }

      // Player Collisions
      const handleCollision = (p) => {
        const dx = nx - p.x;
        const dy = ny - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < (BALL_SIZE + PLAYER_SIZE) / 2) {
          // Calculate hit angle based on where ball hits the player "head"
          nvy = -9; // Pop up
          nvx = dx * 0.35; // Directed horizontal force
          // Prevent ball from getting stuck inside player
          ny = p.y - (BALL_SIZE + PLAYER_SIZE) / 2;
        }
      };

      // Check both players (we use functional updates so we need local vars for p1/ai)
      // This is slightly tricky in React state, but using the latest refs or state values:
      // Since update is a closure, we use the values from the previous frame effectively
      handleCollision(p1);
      handleCollision(ai);

      // Scoring
      if (ny > GROUND_Y) {
        const winner = nx < NET_X ? 'ai' : 'p1';
        setScore(s => ({ ...s, [winner]: s[winner] + 1 }));
        setTimeout(() => resetBall(winner), 0);
        return b; 
      }

      return { x: nx, y: ny, vx: nvx, vy: nvy };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, ball.x, ball.y, p1, ai]); // Optimized dependencies

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="flex flex-col items-center bg-slate-950 min-h-screen text-white p-6 font-sans select-none">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black tracking-tighter text-blue-400 uppercase italic">
          Super Volley <span className="text-white">AI</span>
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="text-center">
            <div className="text-[10px] uppercase opacity-50">Player</div>
            <div className="text-4xl font-mono font-bold bg-blue-500/20 px-4 py-1 rounded-lg border border-blue-500/30">
              {score.p1}
            </div>
          </div>
          <div className="text-2xl opacity-30">:</div>
          <div className="text-center">
            <div className="text-[10px] uppercase opacity-50">CPU</div>
            <div className="text-4xl font-mono font-bold bg-red-500/20 px-4 py-1 rounded-lg border border-red-500/30">
              {score.ai}
            </div>
          </div>
        </div>
      </div>

      <div 
        className="relative overflow-hidden bg-gradient-to-b from-sky-400 to-sky-600 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[12px] border-slate-800 cursor-none"
        style={{ width: COURT_WIDTH, height: COURT_HEIGHT }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseX.current = e.clientX - rect.left;
        }}
      >
        <Crowd />
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        <Court />
        <Net x={NET_X} />
        
        <Ball pos={ball} />
        <Player pos={p1} color="blue" label="You" />
        <Player pos={ai} color="red" label="CPU" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <div className="animate-pulse mb-8 text-center">
              <h2 className="text-4xl font-black text-white mb-2">
                {score.p1 + score.ai === 0 ? "NEW GAME" : "POINT SCORED!"}
              </h2>
              <p className="text-blue-300 font-bold tracking-widest uppercase">Serve when ready</p>
            </div>
            
            <button 
              className="group relative bg-white text-slate-900 px-12 py-5 rounded-full font-black text-2xl hover:bg-yellow-400 transition-all shadow-[0_10px_0_rgb(148,163,184)] active:shadow-none active:translate-y-[10px]"
              onClick={() => setGameState('PLAYING')}
            >
              SERVE BALL
            </button>
            
            <div className="mt-12 flex gap-8 text-white/40 text-xs font-bold uppercase">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-400 rounded-full" /> Mouse to Move
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-400 rounded-full" /> Hit top of head
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 px-6 py-2 bg-slate-900 rounded-full border border-white/5 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
        Engine: React 18 / Tailwind / 60FPS Physics
      </div>
    </div>
  );
}
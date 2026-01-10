import React, { useState, useEffect, useCallback, useRef } from 'react';
import Court from './components/Court';
import Net from './components/Net';
import AIOpponent from "./components/AIOpponent";
import Crowd from "./components/Crowd";
import Ball from './components/Ball';
import Player from './components/Player';
/** --- CONSTANTS --- **/
const COURT_WIDTH = 800;
const NET_X = 400;
const GROUND_Y = 440;
const PLAYER_SIZE = 50;
const BALL_SIZE = 20;

/** --- SUB-COMPONENTS (Consolidated to fix resolution errors) --- **/


/** --- MAIN APP --- **/

 function App() {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState({ p1: 0, ai: 0 });
  
  const [ball, setBall] = useState({ x: 200, y: 150, vx: 4, vy: 0 });
  const [p1, setP1] = useState({ x: 150, y: GROUND_Y - PLAYER_SIZE / 2, vy: 0 });
  const [ai, setAi] = useState({ x: 650, y: GROUND_Y - PLAYER_SIZE / 2, vy: 0 });
  
  const mouseX = useRef(150);
  const requestRef = useRef();

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    setBall(b => {
      let nx = b.x + b.vx;
      let ny = b.y + b.vy;
      let nvx = b.vx;
      let nvy = b.vy + 0.3;

      // Bounce off walls
      if (nx < BALL_SIZE / 2 || nx > COURT_WIDTH - BALL_SIZE / 2) nvx *= -1;
      
      // Net collision
      if (Math.abs(nx - NET_X) < 15 && ny > GROUND_Y - 150) nvx *= -1;

      // Player Collisions
      const checkHit = (p) => {
        const dist = Math.sqrt((nx - p.x) ** 2 + (ny - p.y) ** 2);
        if (dist < (BALL_SIZE + PLAYER_SIZE) / 2) {
          nvy = -8;
          nvx = (nx - p.x) * 0.2;
          return true;
        }
        return false;
      };

      checkHit(p1);
      checkHit(ai);

      // Floor Collision (Scoring)
      if (ny > GROUND_Y) {
        const winner = nx < NET_X ? 'ai' : 'p1';
        setScore(s => ({ ...s, [winner]: s[winner] + 1 }));
        setGameState('START');
        return { x: winner === 'p1' ? 200 : 600, y: 150, vx: winner === 'p1' ? 4 : -4, vy: 0 };
      }

      return { x: nx, y: ny, vx: nvx, vy: nvy };
    });

    setP1(p => {
      let nx = p.x + (mouseX.current - p.x) * 0.15;
      nx = Math.max(PLAYER_SIZE / 2, Math.min(NET_X - PLAYER_SIZE / 2, nx));
      return { ...p, x: nx };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, p1.x, ai.x]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="flex flex-col items-center bg-slate-950 min-h-screen text-white p-6 font-sans">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-black tracking-tighter text-blue-400 uppercase">Volley Championship</h1>
        <div className="text-5xl font-mono font-bold mt-2 bg-slate-900 px-6 py-2 rounded-xl border border-white/10">
          {score.p1} : {score.ai}
        </div>
      </div>

      <div 
        className="relative overflow-hidden bg-gradient-to-b from-blue-500 to-blue-700 rounded-xl shadow-2xl border-4 border-slate-800"
        style={{ width: COURT_WIDTH, height: 500 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseX.current = e.clientX - rect.left;
        }}
      >
        <Crowd />
        <Court />
        <Net x={NET_X} />
        
        <Ball pos={ball} />
        <Player pos={p1} color="blue" />
        <AIOpponent pos={ai} ballPos={ball} setAi={setAi} />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
            <button 
              className="bg-white text-slate-900 px-10 py-4 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl"
              onClick={() => setGameState('PLAYING')}
            >
              READY? SERVE!
            </button>
            <p className="mt-4 text-white/70 font-medium">Move mouse to play</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-slate-500 text-sm uppercase tracking-widest font-bold">
        First to 15 points wins
      </div>
    </div>
  );
}
export default App;
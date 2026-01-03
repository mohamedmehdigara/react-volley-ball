import React, { useState, useEffect, useRef } from 'react';

// Game Constants
const WIDTH = 800;
const HEIGHT = 450;
const PLAYER_WIDTH = 25;
const PLAYER_HEIGHT = 70;
const BALL_SIZE = 20;
const GRAVITY = 0.15;
const JUMP_POWER = -6;
const MOVE_SPEED = 7;
const AI_SPEED = 5;

// Inline SVG Icons to avoid dependency issues
const TrophyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V18"/><path d="M14 22V18"/><path d="M18 4H6v7a6 6 0 0 0 12 0V4Z"/></svg>
);

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

const CpuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
);

const App = () => {
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [score, setScore] = useState({ player: 0, ai: 0 });
  
  // Player 1 State
  const [p1, setP1] = useState({ x: 600, y: HEIGHT - PLAYER_HEIGHT, vy: 0, isJumping: false });
  // AI State
  const [ai, setAi] = useState({ x: 150, y: HEIGHT - PLAYER_HEIGHT, vy: 0, isJumping: false });
  // Ball State
  const [ball, setBall] = useState({ x: WIDTH / 2, y: 100, vx: 3, vy: 0 });
  
  const requestRef = useRef();
  const keys = useRef({});

  const update = () => {
    if (gameState !== 'PLAYING') return;

    // --- Ball Physics ---
    setBall(prevBall => {
      let nextBall = { ...prevBall };
      nextBall.x += nextBall.vx;
      nextBall.y += nextBall.vy;
      nextBall.vy += GRAVITY;

      if (nextBall.x <= 0 || nextBall.x >= WIDTH - BALL_SIZE) {
        nextBall.vx *= -0.9;
        nextBall.x = nextBall.x <= 0 ? 0 : WIDTH - BALL_SIZE;
      }

      if (nextBall.y >= HEIGHT - BALL_SIZE) {
        const pointForAi = nextBall.x > WIDTH / 2;
        handleScore(pointForAi);
        return { x: WIDTH / 2, y: 100, vx: pointForAi ? 4 : -4, vy: 0 };
      }

      const netX = WIDTH / 2 - 5;
      const netHeight = 150;
      if (
        nextBall.y > HEIGHT - netHeight &&
        nextBall.x + BALL_SIZE > netX &&
        nextBall.x < netX + 10
      ) {
        nextBall.vx *= -0.8;
      }

      return nextBall;
    });

    // --- Player Movement & Input ---
    setP1(prevP1 => {
      let nextP1 = { ...prevP1 };
      if (keys.current['ArrowLeft']) nextP1.x -= MOVE_SPEED;
      if (keys.current['ArrowRight']) nextP1.x += MOVE_SPEED;
      if (keys.current['ArrowUp'] && !nextP1.isJumping) {
        nextP1.vy = JUMP_POWER;
        nextP1.isJumping = true;
      }

      nextP1.y += nextP1.vy;
      nextP1.vy += GRAVITY;

      if (nextP1.y >= HEIGHT - PLAYER_HEIGHT) {
        nextP1.y = HEIGHT - PLAYER_HEIGHT;
        nextP1.vy = 0;
        nextP1.isJumping = false;
      }

      nextP1.x = Math.max(WIDTH / 2 + 10, Math.min(WIDTH - PLAYER_WIDTH, nextP1.x));
      return nextP1;
    });

    // --- AI Logic ---
    setAi(prevAi => {
      let nextAi = { ...prevAi };
      const ballPos = ball.x + BALL_SIZE / 2;
      const aiCenter = nextAi.x + PLAYER_WIDTH / 2;

      if (ball.x < WIDTH / 2 + 50) {
        if (aiCenter < ballPos - 10) nextAi.x += AI_SPEED;
        else if (aiCenter > ballPos + 10) nextAi.x -= AI_SPEED;
        
        if (ball.y < HEIGHT - 150 && ball.x < WIDTH / 4 && !nextAi.isJumping) {
          nextAi.vy = JUMP_POWER;
          nextAi.isJumping = true;
        }
      } else {
        if (aiCenter < 150) nextAi.x += AI_SPEED / 2;
        else if (aiCenter > 170) nextAi.x -= AI_SPEED / 2;
      }

      nextAi.y += nextAi.vy;
      nextAi.vy += GRAVITY;

      if (nextAi.y >= HEIGHT - PLAYER_HEIGHT) {
        nextAi.y = HEIGHT - PLAYER_HEIGHT;
        nextAi.vy = 0;
        nextAi.isJumping = false;
      }

      nextAi.x = Math.max(0, Math.min(WIDTH / 2 - PLAYER_WIDTH - 10, nextAi.x));
      return nextAi;
    });

    checkCollision(p1, true);
    checkCollision(ai, false);

    requestRef.current = requestAnimationFrame(update);
  };

  const checkCollision = (character, isPlayer) => {
    if (
      ball.x < character.x + PLAYER_WIDTH &&
      ball.x + BALL_SIZE > character.x &&
      ball.y < character.y + PLAYER_HEIGHT &&
      ball.y + BALL_SIZE > character.y
    ) {
      const hitDiff = (ball.x + BALL_SIZE/2) - (character.x + PLAYER_WIDTH/2);
      setBall(b => ({
        ...b,
        vy: -7,
        vx: hitDiff * 0.4 + (isPlayer ? -2 : 2)
      }));
    }
  };

  const handleScore = (isAiPoint) => {
    setScore(prev => {
      const newScore = isAiPoint 
        ? { ...prev, ai: prev.ai + 1 } 
        : { ...prev, player: prev.player + 1 };
      
      if (newScore.ai >= 11 || newScore.player >= 11) {
        setGameState('GAMEOVER');
      }
      return newScore;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => (keys.current[e.key] = true);
    const handleKeyUp = (e) => (keys.current[e.key] = false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    requestRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, ball, p1, ai]);

  const startGame = () => {
    setScore({ player: 0, ai: 0 });
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-sans text-slate-100 p-4">
      <div className="w-full max-w-3xl flex items-center justify-between mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-2 rounded-lg border border-red-500/30">
            <CpuIcon />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">CPU Enemy</p>
            <p className="text-2xl font-black text-white leading-none">{score.ai}</p>
          </div>
        </div>

        <div className="text-center px-6">
          <div className="text-sky-500 flex justify-center mb-1 animate-pulse">
            <ActivityIcon />
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">First to 11</p>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pro Player</p>
            <p className="text-2xl font-black text-white leading-none">{score.player}</p>
          </div>
          <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
            <TrophyIcon />
          </div>
        </div>
      </div>

      <div className="relative">
        <div 
          className="relative bg-gradient-to-b from-sky-400 to-sky-600 rounded-xl overflow-hidden border-4 border-white/20 shadow-2xl"
          style={{ width: WIDTH, height: HEIGHT }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-10 left-10 w-20 h-8 bg-white/20 rounded-full blur-xl" />
          <div className="absolute top-20 right-20 w-32 h-10 bg-white/20 rounded-full blur-xl" />
          <div className="absolute bottom-0 w-full h-12 bg-emerald-700/30" />

          {/* Net */}
          <div className="absolute left-1/2 bottom-0 w-[10px] h-[150px] bg-slate-100/40 border-x border-white/50 -translate-x-1/2 backdrop-blur-sm z-10" />

          {/* Characters and Ball */}
          <div 
            className="absolute bg-red-500 rounded-t-2xl shadow-lg border-b-4 border-red-700 z-20"
            style={{ width: PLAYER_WIDTH, height: PLAYER_HEIGHT, left: ai.x, top: ai.y }}
          >
            <div className="w-full h-1/3 bg-white/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-black rounded-full mx-0.5" />
              <div className="w-1.5 h-1.5 bg-black rounded-full mx-0.5" />
            </div>
          </div>

          <div 
            className="absolute bg-emerald-500 rounded-t-2xl shadow-lg border-b-4 border-emerald-700 z-20"
            style={{ width: PLAYER_WIDTH, height: PLAYER_HEIGHT, left: p1.x, top: p1.y }}
          >
            <div className="w-full h-1/3 bg-white/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-black rounded-full mx-0.5" />
              <div className="w-1.5 h-1.5 bg-black rounded-full mx-0.5" />
            </div>
          </div>

          <div 
            className="absolute bg-yellow-400 rounded-full shadow-md z-30 transition-transform"
            style={{ 
              width: BALL_SIZE, height: BALL_SIZE, left: ball.x, top: ball.y,
              boxShadow: 'inset -4px -4px 0 rgba(0,0,0,0.1)'
            }}
          />

          {/* Menu Overlay */}
          {gameState !== 'PLAYING' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 text-center">
              {gameState === 'GAMEOVER' && (
                <div className="mb-6">
                  <h2 className="text-4xl font-black mb-2 text-white italic">
                    {score.player > score.ai ? 'YOU WIN!' : 'CPU WINS!'}
                  </h2>
                  <p className="text-slate-400">Final Score: {score.ai} - {score.player}</p>
                </div>
              )}
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-8 italic tracking-tighter">
                VOLLEY PRO
              </h1>
              <button 
                onClick={startGame}
                className="px-12 py-4 bg-white text-slate-950 font-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl uppercase tracking-widest"
              >
                {gameState === 'START' ? 'Start Match' : 'Play Again'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-12 text-slate-500 font-bold uppercase tracking-wider text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 px-2 py-1 rounded text-white">← →</span>
          <span>Move</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 px-2 py-1 rounded text-white">↑</span>
          <span>Jump</span>
        </div>
      </div>
    </div>
  );
};

export default App;
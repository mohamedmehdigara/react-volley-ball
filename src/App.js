import React, { useState, useCallback, useRef, useEffect } from 'react';

/** --- ICONS (SVG Replacements for Lucide) --- */
const IconTrophy = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const IconPlay = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m7 3 14 9-14 9V3z"/></svg>
);
const IconRotate = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

/** --- CONSTANTS --- */
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 30;
const BALL_RADIUS = 10;
const G_EFFECTIVE = 0.15; 
const WALL_FRICTION = 0.95;
const AIR_DAMPING = 0.995;
const JUMP_HEIGHT = 80;
const JUMP_DURATION_MS = 500;
const WINNING_SCORE = 5;

/** --- COMPONENT: TrainingOverlay --- */
const TrainingOverlay = ({ onDismiss }) => {
  const tips = [
    { key: '← →', action: 'Lateral Move', desc: 'Position yourself under the ball trajectory.' },
    { key: 'Space / ↑', action: 'Jump & Spike', desc: 'Hit the ball at the apex for maximum power.' },
    { key: 'Score', action: 'Objective', desc: 'First to 5 points wins the championship.' }
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6 rounded-lg">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            Pro Circuit Training
          </div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter">MASTER THE COURT</h2>
        </div>

        <div className="space-y-4 mb-10">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl group hover:border-blue-500/50 transition-colors">
              <div className="flex-shrink-0 w-20 h-12 bg-slate-800 rounded-lg flex items-center justify-center font-mono text-blue-400 font-bold border border-slate-700 shadow-inner group-hover:scale-105 transition-transform text-xs">
                {tip.key}
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                  {tip.action}
                </div>
                <div className="text-slate-400 text-xs">{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onDismiss}
          className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all active:scale-95 shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2"
        >
          <IconPlay /> Initialize Match
        </button>
      </div>
    </div>
  );
};

/** --- COMPONENT: MatchResultOverlay --- */
const MatchResultOverlay = ({ winner, stats, onRestart }) => {
  const isPlayerWin = winner === 'p1';
  return (
    <div className="absolute inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-lg">
      <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4">
        <div className={`text-6xl font-black mb-2 italic tracking-tighter ${isPlayerWin ? 'text-blue-400' : 'text-rose-500'}`}>
          {isPlayerWin ? 'VICTORY' : 'DEFEAT'}
        </div>
        <p className="text-slate-400 uppercase text-xs tracking-[0.3em] mb-8">Match Concluded</p>
        
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <span className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Final Score</span>
            <span className="text-white font-mono text-2xl">{stats.score.ai} - {stats.score.p1}</span>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <span className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Max Combo</span>
            <span className="text-amber-400 font-mono text-2xl">{stats.maxCombo}x</span>
          </div>
        </div>

        <button onClick={onRestart} className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl hover:bg-blue-400 hover:text-white transition-all transform active:scale-95 shadow-xl uppercase tracking-widest flex items-center justify-center gap-2">
          <IconRotate /> Rematch
        </button>
      </div>
    </div>
  );
};

/** --- MAIN APP --- */
export default function App() {
  const [score, setScore] = useState({ p1: 0, ai: 0 });
  const [gameStatus, setGameStatus] = useState('idle');
  const [winner, setWinner] = useState(null);
  const [stats, setStats] = useState({ maxCombo: 0, totalHits: 0 });
  const [lastCollision, setLastCollision] = useState(null);
  const [isServed, setIsServed] = useState(false);
  const [isP1Jumping, setIsP1Jumping] = useState(false);
  const [isAIJumping, setIsAIJumping] = useState(false);
  const [particles, setParticles] = useState([]);

  const [ball, setBall] = useState({
    pos: { top: 150, left: COURT_WIDTH * 0.75 },
    speed: 0, dir: { x: 0, y: 0 }, rotation: 0
  });

  const [p1, setP1] = useState({ x: COURT_WIDTH * 0.7, y: COURT_HEIGHT - PADDLE_HEIGHT });
  const [ai, setAi] = useState({ x: COURT_WIDTH * 0.2, y: COURT_HEIGHT - PADDLE_HEIGHT });

  const physicsRef = useRef({ ball, p1, ai, particles: [], currentCombo: 0 });

  useEffect(() => {
    physicsRef.current.p1 = p1;
    physicsRef.current.ai = ai;
    physicsRef.current.ball = ball;
  }, [p1, ai, ball]);

  const spawnParticles = useCallback((x, y, color) => {
    const newParticles = Array.from({ length: 12 }).map(() => ({
      id: Math.random(),
      x, y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      size: Math.random() * 5 + 2,
      color, life: 1.0,
    }));
    physicsRef.current.particles = [...physicsRef.current.particles, ...newParticles];
  }, []);

  const resetMatch = () => {
    setScore({ p1: 0, ai: 0 });
    setStats({ maxCombo: 0, totalHits: 0 });
    setGameStatus('playing');
    setWinner(null);
    setIsServed(false);
    physicsRef.current.currentCombo = 0;
    setBall({
      pos: { top: 150, left: COURT_WIDTH * 0.75 },
      speed: 0, dir: { x: 0, y: 0 }, rotation: 0
    });
  };

  const handleJump = useCallback((side) => {
    if (side === 'p1' && !isP1Jumping) {
      setIsP1Jumping(true);
      setTimeout(() => setIsP1Jumping(false), JUMP_DURATION_MS);
    } else if (side === 'ai' && !isAIJumping) {
      setIsAIJumping(true);
      setTimeout(() => setIsAIJumping(false), JUMP_DURATION_MS);
    }
  }, [isP1Jumping, isAIJumping]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'playing') return;
      
      if (!isServed && (e.code === 'Space' || e.code === 'ArrowUp')) {
        setIsServed(true);
        setBall(prev => ({ ...prev, speed: 7, dir: { x: -1, y: -0.4 } }));
        return;
      }

      const moveSpeed = 30;
      if (e.key === 'ArrowLeft') setP1(prev => ({ ...prev, x: Math.max(COURT_WIDTH / 2 + 15, prev.x - moveSpeed) }));
      if (e.key === 'ArrowRight') setP1(prev => ({ ...prev, x: Math.min(COURT_WIDTH - PADDLE_WIDTH, prev.x + moveSpeed) }));
      if (e.key === 'ArrowUp' || e.code === 'Space') handleJump('p1');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isServed, handleJump, gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const aiInterval = setInterval(() => {
      const { ball: b, ai: currentAi } = physicsRef.current;
      const targetX = b.pos.left - PADDLE_WIDTH / 2;
      const limitedTargetX = Math.max(10, Math.min(COURT_WIDTH / 2 - PADDLE_WIDTH - 15, targetX));
      const diff = limitedTargetX - currentAi.x;
      const moveStep = Math.abs(diff) < 7 ? diff : Math.sign(diff) * 7;
      setAi(prev => ({ ...prev, x: prev.x + moveStep }));

      if (b.pos.left < COURT_WIDTH / 2 && b.pos.top < COURT_HEIGHT * 0.5 && Math.random() > 0.97) {
        handleJump('ai');
      }
    }, 16);
    return () => clearInterval(aiInterval);
  }, [handleJump, gameStatus]);

  useEffect(() => {
    if (!isServed || gameStatus !== 'playing') return;
    let rafId;

    const update = () => {
      const { ball: b, p1: p, ai: a, particles: parts } = physicsRef.current;
      
      const nextParticles = parts.map(pt => ({
        ...pt, 
        x: pt.x + pt.vx, 
        y: pt.y + pt.vy, 
        life: pt.life - 0.02 
      })).filter(pt => pt.life > 0);
      physicsRef.current.particles = nextParticles;
      setParticles(nextParticles);

      const p1RealY = isP1Jumping ? COURT_HEIGHT - PADDLE_HEIGHT - JUMP_HEIGHT : COURT_HEIGHT - PADDLE_HEIGHT;
      const aiRealY = isAIJumping ? COURT_HEIGHT - PADDLE_HEIGHT - JUMP_HEIGHT : COURT_HEIGHT - PADDLE_HEIGHT;

      let nTop = b.pos.top + b.dir.y * b.speed;
      let nLeft = b.pos.left + b.dir.x * b.speed;
      let nDir = { ...b.dir };
      let nSpd = b.speed * AIR_DAMPING;
      
      nDir.y += G_EFFECTIVE;

      if (nLeft <= 0 || nLeft + BALL_RADIUS * 2 >= COURT_WIDTH) {
        nDir.x *= -1;
        nLeft = nLeft <= 0 ? 0 : COURT_WIDTH - BALL_RADIUS * 2;
        nSpd *= WALL_FRICTION;
      }

      if (nLeft + BALL_RADIUS * 2 > COURT_WIDTH / 2 - 5 && nLeft < COURT_WIDTH / 2 + 5 && nTop > COURT_HEIGHT * 0.4) {
        nDir.x *= -1;
        nSpd *= 0.7;
      }

      if (nTop + BALL_RADIUS * 2 >= COURT_HEIGHT) {
        const winnerSide = nLeft > COURT_WIDTH / 2 ? 'ai' : 'p1';
        setScore(prev => {
          const next = { ...prev, [winnerSide]: prev[winnerSide] + 1 };
          if (next[winnerSide] >= WINNING_SCORE) {
            setWinner(winnerSide);
            setGameStatus('ended');
          }
          return next;
        });
        setIsServed(false);
        physicsRef.current.currentCombo = 0;
        setBall({
          pos: { top: 150, left: winnerSide === 'p1' ? COURT_WIDTH * 0.25 : COURT_WIDTH * 0.75 },
          speed: 0, dir: { x: 0, y: 0 }, rotation: 0
        });
        return;
      }

      const checkCollision = (charX, charY, side) => {
        if (nLeft + BALL_RADIUS * 2 > charX && nLeft < charX + PADDLE_WIDTH &&
            nTop + BALL_RADIUS * 2 > charY && nTop < charY + PADDLE_HEIGHT) {
            nDir.x = side === 'p1' ? -Math.abs(nDir.x) - 0.1 : Math.abs(nDir.x) + 0.1;
            nDir.y = -1.2; 
            nSpd = Math.min(nSpd + 0.5, 16);
            physicsRef.current.currentCombo++;
            setStats(prev => ({ 
              totalHits: prev.totalHits + 1, 
              maxCombo: Math.max(prev.maxCombo, physicsRef.current.currentCombo) 
            }));
            setLastCollision({ side, id: Date.now() });
            spawnParticles(nLeft + BALL_RADIUS, nTop + BALL_RADIUS, side === 'p1' ? '#3b82f6' : '#f43f5e');
        }
      };

      checkCollision(p.x, p1RealY, 'p1');
      checkCollision(a.x, aiRealY, 'ai');

      setBall({ 
        pos: { top: nTop, left: nLeft }, 
        speed: nSpd, 
        dir: nDir, 
        rotation: b.rotation + nSpd * 5 
      });
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [isServed, isP1Jumping, isAIJumping, spawnParticles, gameStatus]);

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      <div className="mb-8 flex items-center gap-12 text-white">
        <div className={`flex flex-col items-center transition-opacity ${gameStatus === 'playing' ? 'opacity-100' : 'opacity-40'}`}>
          <span className="text-[10px] uppercase text-rose-500 font-black tracking-[0.2em] mb-1">CPU Rival</span>
          <span className="text-6xl font-black font-mono italic">{score.ai}</span>
        </div>
        <div className="h-12 w-[2px] bg-slate-800 rotate-[20deg]" />
        <div className={`flex flex-col items-center transition-opacity ${gameStatus === 'playing' ? 'opacity-100' : 'opacity-40'}`}>
          <span className="text-[10px] uppercase text-blue-400 font-black tracking-[0.2em] mb-1">Player 1</span>
          <span className="text-6xl font-black font-mono italic">{score.p1}</span>
        </div>
      </div>

      <div className="relative p-3 bg-slate-800 rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-700">
        <div style={{
          width: COURT_WIDTH, height: COURT_HEIGHT, backgroundColor: '#e2e8f0',
          backgroundImage: 'linear-gradient(to bottom, #cbd5e1, #94a3b8)',
          position: 'relative', overflow: 'hidden', borderRadius: '4px'
        }}>
          <div className="absolute inset-0 flex justify-center opacity-30">
            <div className="w-[80%] border-x-2 border-white" />
          </div>
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white opacity-20" />

          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-2 h-[60%] bg-slate-700 z-10">
             <div className="absolute top-0 left-[-200px] w-[400px] h-full opacity-20" 
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 5px, transparent 5px, transparent 10px)' }} />
             <div className="absolute top-0 left-[-200px] w-[400px] h-2 bg-white/50" />
          </div>

          <div style={{
            position: 'absolute', left: ai.x, 
            top: isAIJumping ? COURT_HEIGHT - PADDLE_HEIGHT - JUMP_HEIGHT : COURT_HEIGHT - PADDLE_HEIGHT,
            width: PADDLE_WIDTH, height: PADDLE_HEIGHT, backgroundColor: '#f43f5e',
            borderRadius: '6px', zIndex: 15, transition: 'top 0.1s ease-out',
            boxShadow: lastCollision?.side === 'ai' ? '0 0 30px #f43f5e' : '0 4px 10px rgba(0,0,0,0.3)'
          }} />

          <div style={{
            position: 'absolute', left: p1.x, 
            top: isP1Jumping ? COURT_HEIGHT - PADDLE_HEIGHT - JUMP_HEIGHT : COURT_HEIGHT - PADDLE_HEIGHT,
            width: PADDLE_WIDTH, height: PADDLE_HEIGHT, backgroundColor: '#3b82f6',
            borderRadius: '6px', zIndex: 15, transition: 'top 0.1s ease-out',
            boxShadow: lastCollision?.side === 'p1' ? '0 0 30px #3b82f6' : '0 4px 10px rgba(0,0,0,0.3)'
          }} />

          <div style={{
            position: 'absolute', left: ball.pos.left, top: ball.pos.top,
            width: BALL_RADIUS * 2, height: BALL_RADIUS * 2, borderRadius: '50%',
            backgroundColor: '#fff', transform: `rotate(${ball.rotation}deg)`,
            boxShadow: '0 0 20px rgba(255,255,255,0.6)', zIndex: 20, border: '2px solid #94a3b8'
          }}>
            <div className="absolute top-1/2 w-full h-[1px] bg-slate-300" />
            <div className="absolute left-1/2 h-full w-[1px] bg-slate-300" />
          </div>

          {particles.map(p => (
            <div key={p.id} style={{
              position: 'absolute', left: p.x, top: p.y, width: p.size, height: p.size,
              backgroundColor: p.color, borderRadius: '50%', opacity: p.life,
              transform: `scale(${p.life})`, pointerEvents: 'none'
            }} />
          ))}

          {gameStatus === 'idle' && (
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50">
               <div className="bg-slate-900 p-10 rounded-3xl border border-white/10 shadow-2xl text-center max-w-xs">
                 <h1 className="text-4xl font-black italic text-white mb-2 tracking-tighter">VOLLEY PRO</h1>
                 <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.3em] mb-8">Next Gen Arcade</p>
                 <div className="space-y-3">
                   <button onClick={() => setGameStatus('playing')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                     <IconPlay /> Start Match
                   </button>
                   <button onClick={() => setGameStatus('training')} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-3 rounded-2xl transition-all uppercase tracking-widest text-xs">
                     How to Play
                   </button>
                 </div>
               </div>
             </div>
          )}

          {gameStatus === 'training' && <TrainingOverlay onDismiss={() => setGameStatus('playing')} />}
          {gameStatus === 'ended' && <MatchResultOverlay winner={winner} stats={{ ...stats, score }} onRestart={resetMatch} />}
        </div>
      </div>

      <div className="mt-8 h-12 flex items-center">
        {gameStatus === 'playing' && !isServed && (
          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-widest animate-bounce">
            Press Space to Serve
          </div>
        )}
        {gameStatus === 'playing' && isServed && physicsRef.current.currentCombo > 1 && (
          <div className="text-amber-500 font-black italic text-3xl animate-pulse">
            {physicsRef.current.currentCombo}x COMBO
          </div>
        )}
      </div>
    </div>
  );
}
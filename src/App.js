import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/** --- CONSTANTS --- **/
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const GROUND_Y = 440;
const NET_X = 400;
const PLAYER_SIZE = 55;
const BALL_SIZE = 24;
const GRAVITY = 0.32;
const JUMP_FORCE = -10;
const MOVE_SPEED = 8.5;

/** --- COURT THEMES --- **/
const COURT_STYLES = {
  indoor: {
    background: 'linear-gradient(to bottom, #e5c08a, #bc8f4f)',
    texture: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 60px, rgba(255,255,255,0.01) 61px)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(40, 20, 0, 0.4)',
    accentColor: '#3b82f6',
    particles: 'rgba(255,255,255,0.1)',
    scuffs: true
  },
  gym: {
    background: 'linear-gradient(to bottom, #1e3a8a, #172554)',
    texture: 'none',
    lineColor: '#fbbf24',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    accentColor: '#f87171',
    particles: 'rgba(147, 197, 253, 0.2)',
    scuffs: false
  },
  beach: {
    background: 'linear-gradient(to bottom, #fef3c7, #f59e0b)',
    texture: 'radial-gradient(circle, #d97706 0.2px, transparent 0)',
    lineColor: '#f8fafc',
    shadowColor: 'rgba(120, 53, 15, 0.15)',
    accentColor: '#10b981',
    particles: 'rgba(251, 191, 36, 0.4)',
    scuffs: false
  }
};

/** --- SUB-COMPONENTS (From Court.js) --- **/
const Atmosphere = ({ color }) => {
  const particles = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 5 + Math.random() * 10,
    delay: Math.random() * 5,
    size: 1 + Math.random() * 3
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            filter: 'blur(1px)',
            animation: `float ${p.duration}s infinite linear`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </div>
  );
};

const StadiumLights = () => (
  <div className="absolute -top-32 inset-x-0 flex justify-between px-12 pointer-events-none z-[60]">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="relative">
        <div className="w-20 h-10 bg-slate-900 rounded-t-xl border-b-4 border-blue-400/50 shadow-lg" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-56 h-[700px] bg-gradient-to-b from-blue-400/10 to-transparent blur-[80px] opacity-30 origin-top rotate-[8deg]" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-56 h-[700px] bg-gradient-to-b from-blue-400/10 to-transparent blur-[80px] opacity-30 origin-top -rotate-[8deg]" />
      </div>
    ))}
  </div>
);

const CrowdArea = React.memo(({ side, lastHitTime }) => {
  const [mood, setMood] = useState('idle');
  useEffect(() => {
    if (lastHitTime > 0) {
      setMood('cheering');
      const timer = setTimeout(() => setMood('idle'), 600);
      return () => clearTimeout(timer);
    }
  }, [lastHitTime]);

  return (
    <div style={{ position: 'absolute', [side]: '-130px', top: '0%', height: '100%', width: '100px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', perspective: '1000px', filter: 'blur(0.5px)' }}>
      {[...Array(27)].map((_, i) => (
        <div key={i} className={`transition-all duration-[400ms] ${mood === 'cheering' ? '-translate-y-4 scale-110' : 'translate-y-0'}`}
          style={{ width: '18px', height: '24px', borderRadius: '40% 40% 6px 6px', backgroundColor: i % 4 === 0 ? '#0f172a' : '#334155', transitionDelay: `${(i % 5) * 40}ms` }} 
        />
      ))}
    </div>
  );
});

const Jumbotron = ({ score, gameStatus }) => (
  <div className="relative group mb-12 transform hover:scale-[1.02] transition-transform duration-500">
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 rounded-2xl blur opacity-20" />
    <div className="relative flex flex-col items-center bg-slate-950/90 backdrop-blur-md px-12 py-6 rounded-xl border border-white/10 shadow-2xl">
      <div className="flex items-center gap-16">
        <div className="text-center">
          <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.4em] mb-2">Home</div>
          <div className="text-7xl font-black text-white tabular-nums">{score.p1.toString().padStart(2, '0')}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-900">
            <div className={`text-xs font-black italic ${gameStatus === 'PLAYING' ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
              {gameStatus === 'PLAYING' ? 'LIVE' : 'PAUSE'}
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-rose-400 font-black uppercase tracking-[0.4em] mb-2">Visitor</div>
          <div className="text-7xl font-black text-white tabular-nums">{score.ai.toString().padStart(2, '0')}</div>
        </div>
      </div>
    </div>
  </div>
);

const NetSystem = React.memo(({ netX, accentColor, isShaking }) => (
  <div className={`absolute left-1/2 -translate-x-1/2 w-[6px] z-40 ${isShaking ? 'animate-wiggle' : ''}`}
    style={{
      bottom: 0,
      height: 160,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(255,255,255,0.2) 12px, rgba(255,255,255,0.2) 13px)`,
      borderLeft: '2px solid #fff',
      borderRight: '2px solid #fff',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full" style={{ borderTop: `12px solid #fff` }} />
  </div>
));

/** --- GAME COMPONENTS --- **/
const Ball = ({ pos, rotation, spike }) => (
  <div 
    className="absolute z-50 rounded-full border-2 border-amber-500 shadow-xl"
    style={{
      left: pos.x - BALL_SIZE/2,
      top: pos.y - BALL_SIZE/2,
      width: BALL_SIZE,
      height: BALL_SIZE,
      backgroundColor: spike ? '#f59e0b' : '#fef3c7',
      transform: `rotate(${rotation}deg) scale(${spike ? 1.2 : 1})`,
      boxShadow: spike ? '0 0 30px rgba(245, 158, 11, 0.8)' : 'none'
    }}
  />
);

const Player = ({ pos, isP1, jumping }) => (
  <div 
    className="absolute z-40 flex flex-col items-center"
    style={{
      left: pos.x - PLAYER_SIZE/2,
      top: pos.y - PLAYER_SIZE/2,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      transform: `scale(${jumping ? '0.8, 1.2' : '1, 1'})`
    }}
  >
    <div className={`w-full h-full rounded-2xl border-4 border-white shadow-xl ${isP1 ? 'bg-blue-600' : 'bg-rose-600'}`}>
        <div className="w-full h-1/2 bg-white/10 rounded-t-xl flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-white/80" />
            <div className="w-2 h-2 rounded-full bg-white/80" />
        </div>
    </div>
  </div>
);

/** --- MAIN APP --- **/
export default function App() {
  const [gameState, setGameState] = useState('START');
  const [courtType, setCourtType] = useState('indoor');
  const [score, setScore] = useState({ p1: 0, ai: 0 });
  const [lastHitTime, setLastHitTime] = useState(0);
  const [rotation, setRotation] = useState({ x: 15, y: 0 });
  
  // Game Physics
  const [ball, setBall] = useState({ x: 200, y: 150, vx: 4, vy: 0, rotation: 0, spike: false });
  const [p1, setP1] = useState({ x: 150, y: GROUND_Y - PLAYER_SIZE/2, vy: 0, isJumping: false });
  const [ai, setAi] = useState({ x: 650, y: GROUND_Y - PLAYER_SIZE/2, vy: 0, isJumping: false });
  const [targetX, setTargetX] = useState(150);

  const requestRef = useRef();
  const currentStyle = COURT_STYLES[courtType];

  const handleMouseMove = useCallback((e, rect) => {
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: 15 - y * 4, y: x * 4 });
    setTargetX(e.clientX - rect.left);
  }, []);

  const resetBall = (winner) => {
    setBall({ x: winner === 'p1' ? 200 : 600, y: 150, vx: winner === 'p1' ? 4 : -4, vy: 0, rotation: 0, spike: false });
  };

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    setBall(b => {
      let nx = b.x + b.vx;
      let ny = b.y + b.vy;
      let nvx = b.vx;
      let nvy = b.vy + GRAVITY;

      if (nx < BALL_SIZE/2 || nx > COURT_WIDTH - BALL_SIZE/2) { nvx *= -0.8; nx = b.x; }
      if (Math.abs(nx - NET_X) < 15 && ny > GROUND_Y - 140) { nvx *= -0.7; nx = b.x; setLastHitTime(Date.now()); }

      if (ny > GROUND_Y - BALL_SIZE/2) {
        const winner = nx < NET_X ? 'ai' : 'p1';
        setScore(s => {
          const newScore = { ...s, [winner]: s[winner] + 1 };
          if (newScore.p1 >= 15 || newScore.ai >= 15) setGameState('GAMEOVER');
          return newScore;
        });
        resetBall(winner);
        return b;
      }

      const checkHit = (player) => {
        const dx = nx - player.x;
        const dy = ny - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < (BALL_SIZE + PLAYER_SIZE) / 2) {
          nvy = player.isJumping ? -12 : -9;
          nvx = (dx / 5) * 3;
          setLastHitTime(Date.now());
          return true;
        }
        return false;
      };

      const hit = checkHit(p1) || checkHit(ai);
      return { x: nx, y: ny, vx: nvx, vy: nvy, rotation: b.rotation + nvx * 5, spike: hit ? nvy < -11 : b.spike };
    });

    setP1(prev => {
      let nx = prev.x + (targetX - prev.x) * 0.2;
      nx = Math.max(PLAYER_SIZE/2 + 20, Math.min(NET_X - 40, nx));
      let nvy = prev.vy + GRAVITY;
      let ny = prev.y + nvy;
      if (ny >= GROUND_Y - PLAYER_SIZE/2) { ny = GROUND_Y - PLAYER_SIZE/2; nvy = 0; }
      return { x: nx, y: ny, vy: nvy, isJumping: ny < GROUND_Y - PLAYER_SIZE/2 };
    });

    setAi(prev => {
      let nx = prev.x;
      if (ball.x > NET_X - 50) nx += (ball.x - prev.x) * 0.1;
      else nx += (650 - prev.x) * 0.05;
      nx = Math.max(NET_X + 40, Math.min(COURT_WIDTH - PLAYER_SIZE/2 - 20, nx));
      let nvy = prev.vy + GRAVITY;
      if (ball.x > NET_X && ball.y < 300 && !prev.isJumping && Math.abs(ball.x - prev.x) < 30) nvy = JUMP_FORCE;
      let ny = prev.y + nvy;
      if (ny >= GROUND_Y - PLAYER_SIZE/2) { ny = GROUND_Y - PLAYER_SIZE/2; nvy = 0; }
      return { x: nx, y: ny, vy: nvy, isJumping: ny < GROUND_Y - PLAYER_SIZE/2 };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, ball, p1, ai, targetX]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 select-none overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.5; } 100% { transform: translateY(-100px) translateX(20px); opacity: 0; } }
        @keyframes wiggle { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-4px); } 75% { transform: translateY(4px); } }
        .animate-wiggle { animation: wiggle 0.08s infinite; }
      `}} />

      <Atmosphere color={currentStyle.particles} />
      <Jumbotron score={score} gameStatus={gameState} />

      {/* Theme Switcher */}
      <div className="flex gap-4 mb-8 z-[100]">
        {Object.keys(COURT_STYLES).map(type => (
          <button 
            key={type}
            onClick={() => setCourtType(type)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${courtType === type ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="relative">
        <StadiumLights />
        <CrowdArea side="left" lastHitTime={lastHitTime} />
        <CrowdArea side="right" lastHitTime={lastHitTime} />

        <div 
          className="relative transition-transform duration-500 ease-out cursor-none"
          style={{
            width: COURT_WIDTH,
            height: COURT_HEIGHT,
            background: currentStyle.background,
            backgroundImage: `${currentStyle.texture ? currentStyle.texture + ', ' : ''}${currentStyle.background}`,
            borderRadius: '24px',
            border: '12px solid #0f172a',
            boxShadow: `0 60px 120px -30px rgba(0,0,0,0.9), inset 0 0 100px ${currentStyle.shadowColor}`,
            transform: `perspective(1500px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
          onMouseMove={(e) => handleMouseMove(e, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setRotation({ x: 15, y: 0 })}
          onClick={() => { if (gameState === 'PLAYING' && !p1.isJumping) setP1(p => ({ ...p, vy: JUMP_FORCE })); }}
        >
          {/* Lines */}
          <div className="absolute inset-4 border-[4px] pointer-events-none opacity-40" style={{ borderColor: currentStyle.lineColor }} />
          <NetSystem netX={NET_X} accentColor={currentStyle.accentColor} isShaking={lastHitTime > Date.now() - 150} />

          {/* Gameplay Elements */}
          <Ball pos={ball} rotation={ball.rotation} spike={ball.spike} />
          <Player pos={p1} isP1={true} jumping={p1.isJumping} />
          <Player pos={ai} isP1={false} jumping={ai.isJumping} />

          {/* UI Overlays */}
          {gameState === 'START' && (
            <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
              <h1 className="text-6xl font-black italic mb-6">PRO VOLLEY</h1>
              <button 
                onClick={() => setGameState('PLAYING')}
                className="bg-blue-600 px-8 py-4 rounded-xl font-black hover:bg-blue-500 transition-all shadow-xl"
              >
                START MATCH
              </button>
            </div>
          )}
          
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 z-[100] bg-slate-950/90 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-4xl font-black mb-4">MATCH COMPLETE</h2>
              <p className="text-xl mb-8 font-bold">{score.p1 > score.ai ? 'YOU WIN!' : 'CPU WINS'}</p>
              <button 
                onClick={() => { setScore({ p1: 0, ai: 0 }); setGameState('PLAYING'); }}
                className="bg-white text-black px-8 py-4 rounded-xl font-black"
              >
                REPLAY
              </button>
            </div>
          )}
        </div>
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[115%] h-32 bg-black/60 blur-[80px] rounded-[50%] -z-10" />
      </div>
    </div>
  );
}
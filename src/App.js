import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- CONSTANTS ---
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const PLAYER_WIDTH = 45;
const PLAYER_HEIGHT = 80;
const BALL_RADIUS = 15;
const NET_WIDTH = 10;
const NET_HEIGHT = 160;
const GRAVITY = 0.28;
const FRICTION = 0.99; // Air resistance
const BOUNCE_DAMPING = 0.75;

const App = () => {
  // Game State
  const [gameState, setGameState] = useState('START'); // START, PLAYING, SCORING, GAMEOVER
  const [score, setScore] = useState({ p1: 0, cpu: 0 });
  const [screenShake, setScreenShake] = useState(0);
  const [particles, setParticles] = useState([]);

  // Refs for high-performance physics (bypass React render cycle)
  const p1 = useRef({ 
    x: 650, y: 0, vx: 0, vy: 0, 
    isJumping: false, color: '#10b981', 
    name: 'STRIKER' 
  });
  const cpu = useRef({ 
    x: 200, y: 0, vx: 0, vy: 0, 
    isJumping: false, color: '#f43f5e', 
    name: 'GHOST-AI',
    targetX: 200,
    reactionTimer: 0
  });
  const ball = useRef({ 
    x: 450, y: 150, vx: 0, vy: 0, 
    stretch: 1, lastHit: null, rotation: 0 
  });
  const trail = useRef([]);
  const keys = useRef({});
  const requestRef = useRef();

  // --- VISUAL EFFECTS ---
  const triggerShake = (intensity = 10) => {
    setScreenShake(intensity);
    setTimeout(() => setScreenShake(0), 150);
  };

  const createParticles = (x, y, color) => {
    const newParticles = Array.from({ length: 8 }).map(() => ({
      id: Math.random(),
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1.0,
      color
    }));
    setParticles(prev => [...prev, ...newParticles].slice(-40));
  };

  const updateParticles = useCallback(() => {
    setParticles(prev => prev
      .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
      .filter(p => p.life > 0)
    );
  }, []);

  // --- CORE LOGIC ---
  const resetBall = (scorer) => {
    ball.current = { 
      x: scorer === 'p1' ? 250 : 650, 
      y: 100, vx: 0, vy: 0, 
      stretch: 1, lastHit: null, rotation: 0 
    };
    trail.current = [];
  };

  const gameLoop = () => {
    if (gameState === 'PLAYING') {
      // 1. Player 1 Movement (Arrows)
      if (keys.current['ArrowLeft']) p1.current.vx -= 1.1;
      if (keys.current['ArrowRight']) p1.current.vx += 1.1;
      if (keys.current['ArrowUp'] && !p1.current.isJumping) {
        p1.current.vy = -10.5;
        p1.current.isJumping = true;
      }

      // 2. CPU AI Logic (Predictive)
      cpu.current.reactionTimer++;
      if (cpu.current.reactionTimer > 5) {
        // Only react to ball if it's on CPU's side or coming fast
        if (ball.current.x < CANVAS_WIDTH / 2 + 100) {
          cpu.current.targetX = ball.current.x - PLAYER_WIDTH / 2;
        } else {
          cpu.current.targetX = 150; // Return to base
        }
        cpu.current.reactionTimer = 0;
      }

      const cpuSpeed = 0.85;
      if (cpu.current.x < cpu.current.targetX) cpu.current.vx += cpuSpeed;
      else if (cpu.current.x > cpu.current.targetX) cpu.current.vx -= cpuSpeed;

      // CPU Jump Logic
      if (!cpu.current.isJumping && ball.current.x < 300 && ball.current.y < 250 && ball.current.vy > 0) {
        cpu.current.vy = -10;
        cpu.current.isJumping = true;
      }

      // 3. Physics Processing
      [p1.current, cpu.current].forEach((p, idx) => {
        p.vx *= 0.85; // Friction
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;

        // Ground Floor
        if (p.y > CANVAS_HEIGHT - PLAYER_HEIGHT - 30) {
          p.y = CANVAS_HEIGHT - PLAYER_HEIGHT - 30;
          p.vy = 0;
          p.isJumping = false;
        }

        // Net & Wall Constraints
        const isP1 = idx === 0;
        const minX = isP1 ? CANVAS_WIDTH / 2 + NET_WIDTH : 30;
        const maxX = isP1 ? CANVAS_WIDTH - PLAYER_WIDTH - 30 : CANVAS_WIDTH / 2 - NET_WIDTH - PLAYER_WIDTH;
        p.x = Math.max(minX, Math.min(maxX, p.x));
      });

      // 4. Ball Physics
      ball.current.vx *= FRICTION;
      ball.current.x += ball.current.vx;
      ball.current.y += ball.current.vy;
      ball.current.vy += GRAVITY;
      ball.current.rotation += ball.current.vx * 2;
      
      // Squash and Stretch calculation
      const speed = Math.sqrt(ball.current.vx**2 + ball.current.vy**2);
      ball.current.stretch = 1 + (speed / 35);

      // 5. Trail Update
      trail.current.push({ x: ball.current.x, y: ball.current.y });
      if (trail.current.length > 10) trail.current.shift();

      // 6. Wall/Net Collisions
      if (ball.current.x < BALL_RADIUS + 20 || ball.current.x > CANVAS_WIDTH - BALL_RADIUS - 20) {
        ball.current.vx *= -0.7;
        ball.current.x = ball.current.x < BALL_RADIUS + 20 ? BALL_RADIUS + 20 : CANVAS_WIDTH - BALL_RADIUS - 20;
        triggerShake(5);
      }

      // Net Collision
      if (ball.current.y > CANVAS_HEIGHT - NET_HEIGHT - 30) {
        if (Math.abs(ball.current.x - CANVAS_WIDTH / 2) < BALL_RADIUS + NET_WIDTH / 2) {
          ball.current.vx *= -0.5;
          ball.current.x = ball.current.x < CANVAS_WIDTH / 2 ? CANVAS_WIDTH/2 - 20 : CANVAS_WIDTH/2 + 20;
          triggerShake(8);
        }
      }

      // 7. Player-Ball Collisions
      [p1.current, cpu.current].forEach(p => {
        const dx = ball.current.x - (p.x + PLAYER_WIDTH / 2);
        const dy = ball.current.y - (p.y + PLAYER_HEIGHT / 2);
        const dist = Math.sqrt(dx*dx + dy*dy);

        // AABB check for simplicity but with added "kick" based on offset
        if (ball.current.x + BALL_RADIUS > p.x && 
            ball.current.x - BALL_RADIUS < p.x + PLAYER_WIDTH &&
            ball.current.y + BALL_RADIUS > p.y && 
            ball.current.y - BALL_RADIUS < p.y + PLAYER_HEIGHT) {
          
          const hitPower = 11;
          const hitDir = (ball.current.x - (p.x + PLAYER_WIDTH / 2)) / (PLAYER_WIDTH / 2);
          
          ball.current.vx = hitDir * 8 + p.vx * 0.6;
          ball.current.vy = -hitPower - Math.abs(p.vx * 0.2);
          ball.current.y = p.y - BALL_RADIUS - 5;
          
          triggerShake(12);
          createParticles(ball.current.x, ball.current.y, p.color);
        }
      });

      // 8. Scoring Logic
      if (ball.current.y > CANVAS_HEIGHT - BALL_RADIUS - 30) {
        const scorer = ball.current.x > CANVAS_WIDTH / 2 ? 'cpu' : 'p1';
        setScore(prev => {
          const next = { ...prev, [scorer]: prev[scorer] + 1 };
          if (next.p1 >= 11 || next.cpu >= 11) {
            setGameState('GAMEOVER');
          } else {
            setGameState('SCORING');
            setTimeout(() => {
              resetBall(scorer);
              setGameState('PLAYING');
            }, 1200);
          }
          return next;
        });
        triggerShake(20);
        createParticles(ball.current.x, ball.current.y, '#fff');
      }

      updateParticles();
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const handleKeyDown = (e) => keys.current[e.key] = true;
    const handleKeyUp = (e) => keys.current[e.key] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, updateParticles]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-slate-100 p-4 font-sans selection:bg-rose-500 overflow-hidden">
      
      {/* HUD - Scoreboard */}
      <div className="flex items-center gap-16 mb-10 z-10">
        <div className="text-right">
          <div className="text-[10px] tracking-[0.5em] text-rose-500 font-black mb-2 opacity-50">GUEST AI</div>
          <div className="text-8xl font-black italic tabular-nums leading-none drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            {score.cpu.toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-[1px] bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
          <div className="px-3 py-1 bg-slate-800 rounded text-[9px] font-bold tracking-widest text-slate-500 border border-slate-700">SET 1</div>
        </div>

        <div className="text-left">
          <div className="text-[10px] tracking-[0.5em] text-emerald-400 font-black mb-2 opacity-50">STRIKER-01</div>
          <div className="text-8xl font-black italic tabular-nums leading-none drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            {score.p1.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Main Stadium Container */}
      <div 
        className="relative p-3 bg-slate-900/50 rounded-[48px] border border-slate-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] transition-transform duration-75"
        style={{ transform: `translate(${Math.random() * screenShake}px, ${Math.random() * screenShake}px)` }}
      >
        <div 
          className="relative bg-slate-950 rounded-[40px] overflow-hidden shadow-inner"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          {/* Ambient Lighting */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-slate-950" />
          <div className="absolute top-0 left-1/4 w-1/2 h-full bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

          {/* Court Markings */}
          <div className="absolute inset-x-12 bottom-8 top-1/2 border-2 border-white/5 rounded-3xl bg-gradient-to-t from-white/5 to-transparent" />
          <div className="absolute left-1/2 bottom-8 h-[70%] w-[1px] bg-white/10 -translate-x-1/2" />
          
          {/* Particle Layer */}
          {particles.map(p => (
            <div 
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{ left: p.x, top: p.y, width: 4, height: 4, backgroundColor: p.color, opacity: p.life }}
            />
          ))}

          {/* Ball Shadow */}
          <div 
            className="absolute bottom-[35px] bg-black/50 blur-xl rounded-full transition-transform"
            style={{ 
              left: ball.current.x - 20, 
              width: 40, 
              height: 10, 
              transform: `scale(${Math.max(0.2, 1 - ball.current.y/CANVAS_HEIGHT)})` 
            }} 
          />

          {/* Ball Trail */}
          {trail.current.map((t, i) => (
            <div 
              key={i} 
              className="absolute bg-white/10 rounded-full pointer-events-none"
              style={{ 
                left: t.x - 8, top: t.y - 8, 
                width: 16, height: 16, 
                opacity: i / 15,
                transform: `scale(${i / 10})` 
              }} 
            />
          ))}

          {/* The Net */}
          <div className="absolute left-1/2 bottom-8 w-[10px] h-[160px] -translate-x-1/2 z-20">
            <div className="w-full h-full bg-slate-200 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] border-x border-slate-400" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-rose-500 rounded-full blur-sm animate-pulse" />
          </div>

          {/* CPU Player */}
          <div 
            className="absolute rounded-2xl flex flex-col items-center border-t-4 border-white/20 shadow-2xl transition-all"
            style={{ 
              width: PLAYER_WIDTH, height: PLAYER_HEIGHT, 
              left: cpu.current.x, top: cpu.current.y, 
              backgroundColor: cpu.current.color,
              transform: `skewX(${cpu.current.vx * 0.5}deg)`
            }}
          >
            <div className="mt-2 w-7 h-7 bg-slate-900 rounded-full border-2 border-white/10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            </div>
            <div className="mt-1 w-1/2 h-1 bg-black/20 rounded-full" />
          </div>

          {/* Player 1 */}
          <div 
            className="absolute rounded-2xl flex flex-col items-center border-t-4 border-white/20 shadow-2xl transition-all"
            style={{ 
              width: PLAYER_WIDTH, height: PLAYER_HEIGHT, 
              left: p1.current.x, top: p1.current.y, 
              backgroundColor: p1.current.color,
              transform: `skewX(${p1.current.vx * 0.5}deg)`
            }}
          >
            <div className="mt-2 w-7 h-7 bg-slate-900 rounded-full border-2 border-white/10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>
            <div className="mt-1 w-1/2 h-1 bg-black/20 rounded-full" />
          </div>

          {/* The Ball */}
          <div 
            className="absolute rounded-full z-30 shadow-[0_10px_20px_rgba(0,0,0,0.5)] border-2 border-white/20"
            style={{ 
              width: BALL_RADIUS * 2, height: BALL_RADIUS * 2, 
              left: ball.current.x - BALL_RADIUS, top: ball.current.y - BALL_RADIUS,
              background: 'radial-gradient(circle at 30% 30%, #fff 0%, #fbbf24 60%, #b45309 100%)',
              transform: `scaleX(${2 - ball.current.stretch}) scaleY(${ball.current.stretch}) rotate(${ball.current.rotation}deg)`
            }} 
          />

          {/* OVERLAYS */}
          {gameState !== 'PLAYING' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-12 text-center">
              {gameState === 'START' && (
                <div className="animate-in fade-in zoom-in duration-500">
                  <h1 className="text-8xl font-black italic tracking-tighter mb-2 bg-gradient-to-r from-white via-white to-slate-500 bg-clip-text text-transparent">
                    VOLLEY<span className="text-emerald-500">PRO</span>
                  </h1>
                  <p className="text-slate-500 uppercase tracking-[0.6em] text-[10px] font-bold mb-12">Universal Simulator v2.5</p>
                  <button 
                    onClick={() => setGameState('PLAYING')}
                    className="group relative px-20 py-5 bg-white text-slate-950 font-black uppercase rounded-full overflow-hidden transition-all hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.15)]"
                  >
                    <span className="relative z-10">Start Simulation</span>
                    <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>
                </div>
              )}

              {gameState === 'SCORING' && (
                <div className="animate-bounce">
                  <h2 className="text-9xl font-black italic text-white/5 tracking-widest">POINT</h2>
                  <div className="h-2 w-48 bg-emerald-500 mx-auto rounded-full mt-4" />
                </div>
              )}

              {gameState === 'GAMEOVER' && (
                <div className="animate-in slide-in-from-bottom duration-500">
                  <h2 className="text-6xl font-black italic mb-2">SEQUENCE COMPLETE</h2>
                  <p className="text-slate-500 mb-10 tracking-widest uppercase text-xs">Winner: {score.p1 >= 11 ? 'Striker-01' : 'Ghost-AI'}</p>
                  <button 
                    onClick={() => { setScore({p1: 0, cpu: 0}); setGameState('PLAYING'); }}
                    className="px-12 py-4 bg-emerald-500 text-slate-950 rounded-full font-black uppercase hover:bg-white transition-colors"
                  >
                    Reboot Match
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Controls Info */}
      <div className="mt-12 flex gap-12 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
        <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Move with Arrows</div>
        <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 11 Points to Win</div>
        <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> AI: Active</div>
      </div>
    </div>
  );
};

export default App;
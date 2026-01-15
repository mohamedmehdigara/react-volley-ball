import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/** --- GLOBAL CONSTANTS --- **/
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const NET_X = 400;
const GROUND_Y = 440;
const PLAYER_SIZE = 72;
const BALL_SIZE = 24;
const GRAVITY = 0.45;
const FRICTION = 0.994; // Slightly less friction for better flow
const WINNING_SCORE = 11;
const POWER_MAX = 100;
const TERMINAL_VELOCITY = 35;

/** --- STYLES --- **/
const styleSheet = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@500&display=swap');

  @keyframes energy-flow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes shake-ui {
    0%, 100% { transform: translate(0,0); }
    25% { transform: translate(-2px, 2px); }
    75% { transform: translate(2px, -2px); }
  }
  @keyframes floating {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }
  @keyframes text-reveal {
    from { opacity: 0; transform: translateY(20px) scale(0.9); filter: blur(10px); }
    to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  
  .game-root {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; background: #020617; font-family: 'Outfit', sans-serif;
    color: white; margin: 0; overflow: hidden; user-select: none;
    background-image: 
      radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%),
      url("https://www.transparenttextures.com/patterns/carbon-fibre.png");
  }
  .arena-viewport {
    perspective: 1200px; padding: 20px;
  }
  .court-frame {
    position: relative; padding: 12px; background: #1e293b; border-radius: 42px;
    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 40px rgba(255,255,255,0.02);
    transform-style: preserve-3d; transition: transform 0.1s ease-out;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .court-surface {
    position: relative; width: ${COURT_WIDTH}px; height: ${COURT_HEIGHT}px;
    background: #000; border-radius: 32px; overflow: hidden; cursor: none;
    border: 2px solid rgba(255,255,255,0.05);
  }
  .court-surface.super-active {
    box-shadow: inset 0 0 80px rgba(244, 63, 94, 0.5);
  }
  .grid-overlay {
    position: absolute; inset: 0;
    background-image: 
      linear-gradient(rgba(34, 211, 238, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34, 211, 238, 0.08) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
    mask-image: radial-gradient(circle at center, black, transparent 85%);
  }
  .score-card {
    position: relative; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1);
    padding: 18px 28px; border-radius: 24px; min-width: 140px; text-align: center;
    backdrop-filter: blur(20px); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .score-card.overload {
    animation: shake-ui 0.15s infinite;
    border-color: #facc15; box-shadow: 0 0 40px rgba(250, 204, 21, 0.2);
  }
  .energy-bar {
    width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 10px;
    margin-top: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);
  }
  .energy-fill {
    height: 100%; transition: width 0.3s ease-out;
  }
  .energy-fill.charged {
    background: linear-gradient(90deg, #fff, #facc15, #fff);
    background-size: 200% 100%; animation: energy-flow 1s linear infinite;
  }
  .shockwave {
    position: absolute; border: 2px solid white; border-radius: 50%;
    pointer-events: none; animation: shock-out 0.6s cubic-bezier(0.1, 0, 0, 1) forwards;
  }
  @keyframes shock-out {
    0% { transform: scale(0); opacity: 1; border-width: 20px; }
    100% { transform: scale(15); opacity: 0; border-width: 0px; }
  }
  .overlay {
    position: absolute; inset: 0; background: rgba(2, 6, 23, 0.9);
    backdrop-filter: blur(20px); z-index: 300; display: flex; 
    flex-direction: column; align-items: center; justify-content: center;
  }
  .btn-mega {
    background: #fff; color: #000; border: none; padding: 20px 60px;
    font-size: 22px; font-weight: 900; border-radius: 18px; cursor: pointer;
    text-transform: uppercase; letter-spacing: 6px; transition: all 0.2s;
    box-shadow: 0 15px 40px rgba(255,255,255,0.1);
  }
  .btn-mega:hover { transform: translateY(-5px) scale(1.02); background: #facc15; }
  .btn-mega:active { transform: translateY(0) scale(0.98); }
  .scanlines {
    position: absolute; inset: 0; pointer-events: none; z-index: 500;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
    background-size: 100% 4px; opacity: 0.2;
  }
  .chromatic-aberration {
    position: absolute; inset: 0; pointer-events: none; z-index: 490;
    mix-blend-mode: screen; opacity: 0; transition: opacity 0.2s;
    background: radial-gradient(circle, transparent, rgba(244, 63, 94, 0.15));
  }
  .chromatic-aberration.active { opacity: 1; }
  .rally-number {
    position: absolute; top: 12%; left: 50%; transform: translateX(-50%);
    font-size: 160px; font-weight: 900; opacity: 0.05; color: white;
    font-style: italic; pointer-events: none; z-index: 1; transition: transform 0.1s;
  }
`;

/** --- AUDIO ENGINE --- **/
const useAudio = () => {
  const audioCtx = useRef(null);
  
  const playSound = (freq, type = 'sine', duration = 0.1, vol = 0.1, slide = 10) => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(slide, audioCtx.current.currentTime + duration);
      gain.gain.setValueAtTime(vol, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.start();
      osc.stop(audioCtx.current.currentTime + duration);
    } catch(e) { }
  };

  return useMemo(() => ({ 
    hit: () => playSound(440, 'triangle', 0.1, 0.06, 220),
    score: () => {
      playSound(80, 'sawtooth', 0.6, 0.1, 20);
      playSound(1200, 'sine', 0.4, 0.08, 800);
    },
    superHit: () => {
        playSound(50, 'square', 0.8, 0.3, 10);
        playSound(2000, 'sine', 0.5, 0.15, 100);
    },
    click: () => playSound(1000, 'sine', 0.05, 0.04, 500)
  }), []);
};

/** --- SUB-COMPONENTS --- **/

const Player = ({ x, color, label, hitting, energy, ballPos }) => {
  const isCharged = energy >= POWER_MAX;
  const eyeX = Math.max(-8, Math.min(8, (ballPos.x - x) * 0.08));
  const eyeY = Math.max(-8, Math.min(8, (ballPos.y - (GROUND_Y - PLAYER_SIZE)) * 0.1));

  return (
    <div style={{ 
      position: 'absolute', left: x - PLAYER_SIZE / 2, top: GROUND_Y - PLAYER_SIZE,
      width: PLAYER_SIZE, height: PLAYER_SIZE, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: hitting ? 'scale(1.3, 0.7) translateY(10px)' : 'scale(1)',
      transition: 'transform 0.06s ease-out'
    }}>
      <div style={{ 
        fontSize: '10px', fontWeight: '900', color, marginBottom: '6px', 
        fontFamily: 'JetBrains Mono', letterSpacing: '2px', opacity: 0.8
      }}>
        {label}
      </div>
      <div style={{ 
        width: '100%', height: '100%', borderRadius: '22px',
        background: isCharged 
            ? `linear-gradient(135deg, ${color}, #fff, ${color})` 
            : `linear-gradient(135deg, ${color} 0%, #020617 100%)`,
        boxShadow: isCharged 
            ? `0 0 50px ${color}, inset 0 0 20px rgba(255,255,255,0.8)` 
            : `0 20px 40px rgba(0,0,0,0.5), inset 0 2px 8px rgba(255,255,255,0.1)`,
        border: `2px solid ${isCharged ? '#fff' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', justifyContent: 'center', gap: '10px', paddingTop: '16px',
        animation: isCharged ? 'shake-ui 0.1s infinite' : 'none',
        overflow: 'hidden'
      }}>
        <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '7px', height: '7px', background: '#000', borderRadius: '50%', left: 3.5 + eyeX, top: 3.5 + eyeY }} />
        </div>
        <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '7px', height: '7px', background: '#000', borderRadius: '50%', left: 3.5 + eyeX, top: 3.5 + eyeY }} />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState({ p1: 0, ai: 0 });
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('novaStrikeHigh')) || 0);
  const [rally, setRally] = useState(0);
  const [energy, setEnergy] = useState({ p1: 0, ai: 0 });
  const [isSuper, setIsSuper] = useState(false);
  const [shake, setShake] = useState(0);
  const [hitting, setHitting] = useState({ p1: false, ai: false });
  const [fx, setFx] = useState([]); 
  const [shocks, setShocks] = useState([]); 
  const [flash, setFlash] = useState(false);
  const sounds = useAudio();

  // Physics Refs
  const ball = useRef({ x: 200, y: 150, vx: 8, vy: 0, trail: [] });
  const p1 = useRef({ x: 150, prevX: 150 });
  const ai = useRef({ x: 650, prevX: 650, targetX: 650 });
  const mousePos = useRef(150);
  const requestRef = useRef();
  const timeScale = useRef(1.0);

  // Render state for smooth sync
  const [render, setRender] = useState({
    ball: { x: 200, y: 150, vy: 0, vx: 0, trail: [] },
    p1: 150, ai: 650
  });

  const handleAction = useCallback(() => {
    if (gameState === 'START' || gameState === 'GAME_OVER') {
      sounds.click();
      setScore({ p1: 0, ai: 0 });
      setEnergy({ p1: 0, ai: 0 });
      setRally(0);
      ball.current = { x: 200, y: 150, vx: 9, vy: 0, trail: [] };
      setGameState('PLAYING');
    }
  }, [gameState, sounds]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  const triggerImpact = useCallback((x, y, type = 'normal', intensity = 1) => {
    const isPower = type === 'super';
    if (isPower) sounds.superHit(); else sounds.hit();
    
    const sid = Math.random();
    setShocks(s => [...s, { id: sid, x, y, color: isPower ? '#f43f5e' : '#fff' }]);
    setTimeout(() => setShocks(s => s.filter(item => item.id !== sid)), 600);

    const pCount = isPower ? 70 : 15;
    const newParticles = Array.from({ length: pCount }).map(() => ({
      id: Math.random(), x, y,
      vx: (Math.random() - 0.5) * (isPower ? 60 : 25) * intensity,
      vy: (Math.random() - 0.8) * (isPower ? 60 : 25) * intensity,
      life: 1.0,
      size: Math.random() * (isPower ? 8 : 4) + 2,
      color: isPower ? '#f43f5e' : (Math.random() > 0.5 ? '#22d3ee' : '#facc15')
    }));
    setFx(prev => [...prev, ...newParticles].slice(-300));

    setShake(isPower ? 40 : 12 * intensity);
    if (isPower) {
      setFlash(true);
      timeScale.current = 0.25;
      setTimeout(() => {
        setFlash(false);
        timeScale.current = 1.0;
      }, 150);
    }
    setTimeout(() => setShake(0), 180);
  }, [sounds]);

  const update = useCallback((time) => {
    if (gameState !== 'PLAYING') {
        requestRef.current = requestAnimationFrame(update);
        return;
    }

    const ts = timeScale.current;
    const b = ball.current;
    
    // Sub-stepping for high speed collision accuracy
    const steps = isSuper ? 2 : 1;
    for(let s = 0; s < steps; s++) {
      const substepTs = ts / steps;
      
      // Paddle Update
      p1.current.prevX = p1.current.x;
      p1.current.x += (mousePos.current - p1.current.x) * 0.45;
      p1.current.x = Math.max(70, Math.min(NET_X - 60, p1.current.x));
      const p1Speed = (p1.current.x - p1.current.prevX) / substepTs;

      // AI Logic
      if (b.vx > 0) {
        const distToAI = ai.current.x - b.x;
        const timeToReach = distToAI / Math.max(1, b.vx);
        const predY = b.y + (b.vy * timeToReach) + (0.5 * GRAVITY * timeToReach * timeToReach);
        const error = (Math.sin(time/400) * 20) * (1 - Math.min(1, rally/20));
        ai.current.targetX = b.x + (b.vx * 12) + error; 
      } else {
        ai.current.targetX = 650 + Math.sin(time / 800) * 80; 
      }

      ai.current.prevX = ai.current.x;
      const aiEase = (0.2 + (rally * 0.015));
      ai.current.x += (ai.current.targetX - ai.current.x) * Math.min(0.5, aiEase) * substepTs;
      ai.current.x = Math.max(NET_X + 60, Math.min(COURT_WIDTH - 70, ai.current.x));
      const aiSpeed = (ai.current.x - ai.current.prevX) / substepTs;

      // Physics
      b.vy += GRAVITY * substepTs;
      b.x += b.vx * substepTs;
      b.y += b.vy * substepTs;
      b.vx *= Math.pow(FRICTION, substepTs);
      
      const vel = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
      if (vel > TERMINAL_VELOCITY) {
        b.vx = (b.vx / vel) * TERMINAL_VELOCITY;
        b.vy = (b.vy / vel) * TERMINAL_VELOCITY;
      }

      // Walls
      if (b.x < BALL_SIZE/2 || b.x > COURT_WIDTH - BALL_SIZE/2) {
        b.vx *= -0.9;
        b.x = b.x < BALL_SIZE/2 ? BALL_SIZE/2 : COURT_WIDTH - BALL_SIZE/2;
        triggerImpact(b.x, b.y, 'normal', 0.5);
      }
      if (b.y < BALL_SIZE/2) {
          b.vy *= -0.8;
          b.y = BALL_SIZE/2;
          triggerImpact(b.x, b.y, 'normal', 0.5);
      }

      // Net
      if (Math.abs(b.x - NET_X) < (BALL_SIZE/2 + 10) && b.y > GROUND_Y - 150) {
        b.vx *= -0.7;
        b.x = b.x < NET_X ? NET_X - 25 : NET_X + 25;
        triggerImpact(b.x, b.y, 'normal', 0.7);
      }

      // Hit Resolution
      const resolvePaddleHit = (px, side, paddleSpeed) => {
        const py = GROUND_Y - PLAYER_SIZE/2;
        const dx = b.x - px;
        const dy = b.y - py;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < (BALL_SIZE + PLAYER_SIZE)/2 + 5) {
          let launch = 18 + (rally * 0.4);
          const spin = paddleSpeed * 0.2;
          
          setEnergy(prev => {
            if (prev[side] >= POWER_MAX) {
              launch *= 1.8;
              setIsSuper(true);
              triggerImpact(b.x, b.y, 'super');
              return { ...prev, [side]: 0 };
            } else {
              setIsSuper(false);
              triggerImpact(b.x, b.y, 'normal', 1.1);
              return { ...prev, [side]: Math.min(POWER_MAX, prev[side] + 20) };
            }
          });

          const angle = Math.atan2(dy, dx);
          b.vx = Math.cos(angle) * launch + spin;
          b.vy = Math.min(Math.sin(angle) * launch, -14); 

          const offset = (BALL_SIZE + PLAYER_SIZE)/2 + 15;
          b.x = px + Math.cos(angle) * offset;
          b.y = py + Math.sin(angle) * offset;

          setRally(r => r + 1);
          setHitting(h => ({ ...h, [side]: true }));
          setTimeout(() => setHitting(h => ({ ...h, [side]: false })), 80);
        }
      };

      resolvePaddleHit(p1.current.x, 'p1', p1Speed);
      resolvePaddleHit(ai.current.x, 'ai', aiSpeed);
    }

    // Scoring
    if (b.y > GROUND_Y - BALL_SIZE/2) {
      sounds.score();
      const p1Win = b.x > NET_X;
      const winner = p1Win ? 'p1' : 'ai';
      
      setScore(old => {
        const next = { ...old, [winner]: old[winner] + 1 };
        if (next[winner] >= WINNING_SCORE) {
          if (next.p1 > highScore) {
              setHighScore(next.p1);
              localStorage.setItem('novaStrikeHigh', next.p1);
          }
          setGameState('GAME_OVER');
        } else {
          setGameState('ROUND_END');
          setTimeout(() => {
            ball.current = { x: p1Win ? 200 : 600, y: 150, vx: p1Win ? 9 : -9, vy: 0, trail: [] };
            setGameState('PLAYING');
          }, 1500);
        }
        return next;
      });

      setRally(0);
      setEnergy({ p1: 0, ai: 0 });
      setIsSuper(false);
      triggerImpact(b.x, b.y, 'super');
      return;
    }

    // VFX Update
    setFx(prev => prev.map(p => ({ 
      ...p, 
      x: p.x + p.vx * ts, 
      y: p.y + p.vy * ts, 
      vy: p.vy + 0.5 * ts, 
      life: p.life - 0.03 * ts 
    })).filter(p => p.life > 0));

    // Trail logic
    b.trail.unshift({ x: b.x, y: b.y });
    if (b.trail.length > 20) b.trail.pop();

    setRender({
      ball: { x: b.x, y: b.y, vy: b.vy, vx: b.vx, trail: [...b.trail] },
      p1: p1.current.x, ai: ai.current.x
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, rally, sounds, highScore, triggerImpact, isSuper]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="game-root">
      <style>{styleSheet}</style>
      <div className="scanlines" />
      <div className={`chromatic-aberration ${isSuper ? 'active' : ''}`} />
      
      <div className="rally-number" style={{ transform: `translateX(-50%) scale(${1 + rally * 0.02})` }}>
        {rally > 0 ? rally : ''}
      </div>

      {/* HUD SECTION */}
      <div style={{ display: 'flex', gap: '50px', marginBottom: '20px', alignItems: 'center', zIndex: 10 }}>
        <div className={`score-card ${energy.p1 >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '10px', color: '#22d3ee', fontWeight: '900', letterSpacing: '3px', fontFamily: 'JetBrains Mono' }}>PILOT.NODE</div>
          <div style={{ fontSize: '72px', fontWeight: '900', color: '#fff', fontStyle: 'italic', margin: '4px 0' }}>{score.p1}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.p1 >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.p1}%`, background: '#22d3ee' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '240px' }}>
          <h1 style={{ 
            margin: 0, fontStyle: 'italic', fontSize: '52px', fontWeight: 900, 
            color: '#facc15', textShadow: '0 0 30px rgba(250,204,21,0.5)', 
            letterSpacing: '-2px'
          }}>NOVA STRIKE</h1>
          <div style={{ 
            fontSize: '11px', opacity: 0.8, letterSpacing: '6px', fontWeight: 'bold', 
            color: isSuper ? '#f43f5e' : '#64748b', marginTop: '6px', textTransform: 'uppercase' 
          }}>
            {isSuper ? 'OVERDRIVE ACTIVE' : `Rally: ${rally}`}
          </div>
        </div>

        <div className={`score-card ${energy.ai >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: '900', letterSpacing: '3px', fontFamily: 'JetBrains Mono' }}>AI.CORE</div>
          <div style={{ fontSize: '72px', fontWeight: '900', color: '#fff', fontStyle: 'italic', margin: '4px 0' }}>{score.ai}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.ai >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.ai}%`, background: '#f43f5e' }} />
          </div>
        </div>
      </div>

      {/* ARENA SECTION */}
      <div className="arena-viewport">
        <div className={`court-frame ${isSuper ? 'super-active' : ''}`} style={{ 
          transform: `rotateX(20deg) rotateY(${(render.p1 - 400) * 0.02}deg) translate(${Math.random()*shake}px, ${Math.random()*shake}px)` 
        }}>
          <div className="court-surface" onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            mousePos.current = e.clientX - rect.left;
          }}>
            <div className="grid-overlay" />
            
            {/* Impact Flash */}
            <div style={{ 
                position: 'absolute', inset: 0, background: '#fff', zIndex: 200, 
                opacity: flash ? 0.8 : 0, transition: 'opacity 0.05s', pointerEvents: 'none' 
            }} />

            {/* Dynamic Ambient Light */}
            <div style={{ 
                position: 'absolute', 
                left: render.ball.x - 300, top: render.ball.y - 300, 
                width: 600, height: 600, borderRadius: '50%', 
                background: `radial-gradient(circle, ${isSuper ? 'rgba(244,63,94,0.3)' : 'rgba(34,211,238,0.15)'} 0%, transparent 70%)`, 
                pointerEvents: 'none', zIndex: 10 
            }} />
            
            {/* Ground Line */}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: 60, background: 'linear-gradient(to bottom, #111827, #020617)', borderTop: '2px solid rgba(255,255,255,0.1)' }} />
            
            {/* Net */}
            <div style={{ 
                position: 'absolute', left: NET_X - 5, bottom: 60, width: 10, height: 140, 
                background: 'linear-gradient(to top, #334155, #facc15)', 
                boxShadow: '0 0 30px rgba(250,204,21,0.3)', 
                display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '8px 0', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {[...Array(8)].map((_, i) => <div key={i} style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.3)' }} />)}
            </div>

            {/* Effects */}
            {shocks.map(s => <div key={s.id} className="shockwave" style={{ left: s.x - 50, top: s.y - 50, width: 100, height: 100, borderColor: s.color }} />)}
            {fx.map(p => (
                <div key={p.id} style={{ 
                    position: 'absolute', left: p.x, top: p.y, 
                    width: p.size, height: p.size, 
                    background: p.color, borderRadius: '2px', 
                    opacity: p.life, pointerEvents: 'none', zIndex: 60, 
                    transform: `scale(${p.life * 2}) rotate(${p.life * 360}deg)`, 
                    boxShadow: `0 0 15px ${p.color}` 
                }} />
            ))}
            
            {/* Ball Trail */}
            {render.ball.trail.map((t, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: BALL_SIZE * (1.1 - i / 20),
                height: BALL_SIZE * (1.1 - i / 20),
                left: t.x - (BALL_SIZE * (1.1 - i / 20)) / 2,
                top: t.y - (BALL_SIZE * (1.1 - i / 20)) / 2,
                background: isSuper ? `rgba(244, 63, 94, ${0.8 - i/20})` : `rgba(34, 211, 238, ${0.6 - i/20})`,
                borderRadius: '50%', filter: `blur(${isSuper ? 8 : 4}px)`, opacity: 1 - i/20, pointerEvents: 'none'
              }} />
            ))}
            
            {/* Ball */}
            <div style={{ 
                position: 'absolute', 
                left: render.ball.x - BALL_SIZE/2, 
                top: render.ball.y - BALL_SIZE/2, 
                width: BALL_SIZE, height: BALL_SIZE, 
                borderRadius: '50%', zIndex: 100, 
                background: isSuper ? '#fff' : '#facc15', 
                boxShadow: isSuper 
                    ? '0 0 50px #f43f5e, 0 0 100px rgba(244,63,94,0.5)' 
                    : '0 0 30px rgba(250, 204, 21, 0.8), inset 0 -4px 8px rgba(0,0,0,0.3)', 
                border: `2px solid ${isSuper ? '#fff' : '#78350f'}`, 
                transform: `scale(${1 + Math.abs(render.ball.vx)*0.03}, ${1 - Math.abs(render.ball.vy)*0.02}) rotate(${render.ball.x * 2}deg)`
            }}>
              <div style={{ position: 'absolute', top: '15%', left: '15%', width: '40%', height: '40%', background: 'rgba(255,255,255,0.7)', borderRadius: '50%', filter: 'blur(2px)' }} />
            </div>

            {/* Players */}
            <Player x={render.p1} color="#22d3ee" label="PILOT" hitting={hitting.p1} energy={energy.p1} ballPos={render.ball} />
            <Player x={render.ai} color="#f43f5e" label="CORE" hitting={hitting.ai} energy={energy.ai} ballPos={render.ball} />

            {/* Overlays */}
            {gameState === 'START' && (
              <div className="overlay">
                <div style={{ marginBottom: '40px', textAlign: 'center', animation: 'floating 4s ease-in-out infinite' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '12px', opacity: 0.7, color: '#22d3ee', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>SYSTEM READY</div>
                  <h2 style={{ 
                    fontSize: '100px', fontWeight: '900', letterSpacing: '-5px', fontStyle: 'italic', 
                    margin: '15px 0', textShadow: '0 0 60px rgba(255,255,255,0.2)',
                    animation: 'text-reveal 0.8s ease-out'
                  }}>NOVA STRIKE</h2>
                  <div style={{ height: '4px', background: 'linear-gradient(90deg, transparent, #facc15, transparent)', width: '100%' }} />
                </div>
                <button className="btn-mega" onClick={handleAction}> Establish Link </button>
                <div style={{ marginTop: '40px', opacity: 0.5, fontSize: '11px', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 30px', borderRadius: '40px', letterSpacing: '3px', fontWeight: '900' }}>
                  PEAK PERFORMANCE: {highScore}
                </div>
              </div>
            )}

            {gameState === 'ROUND_END' && (
              <div className="overlay" style={{ background: 'rgba(2,6,23,0.3)', backdropFilter: 'blur(5px)' }}>
                <h2 style={{ 
                  fontSize: '140px', fontWeight: '900', color: '#facc15', 
                  textShadow: '0 0 100px #facc15', fontStyle: 'italic', 
                  transform: 'rotate(-3deg)', animation: 'shake-ui 0.1s infinite' 
                }}>GOAL</h2>
              </div>
            )}

            {gameState === 'GAME_OVER' && (
              <div className="overlay">
                <h1 style={{ 
                  fontSize: '24px', letterSpacing: '15px', 
                  color: score.p1 > score.ai ? '#22d3ee' : '#f43f5e', 
                  fontWeight: 900, marginBottom: '20px'
                }}>
                  {score.p1 > score.ai ? 'MISSION SUCCESS' : 'SYSTEM FAILURE'}
                </h1>
                <div style={{ fontSize: '160px', fontWeight: '900', margin: '-20px 0', fontStyle: 'italic' }}>
                  {score.p1}:{score.ai}
                </div>
                <button className="btn-mega" onClick={handleAction} style={{ marginTop: '40px' }}> Reboot </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ opacity: 0.6, fontSize: '11px', letterSpacing: '6px', fontWeight: '900', color: '#facc15', fontFamily: 'JetBrains Mono' }}>
          NOVA STRIKE // v5.2.0 // STABLE BUILD
        </div>
        <div style={{ display: 'flex', gap: '30px', opacity: 0.4, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700 }}>
          <span>MOUSE TO MOVE</span>
          <span>SPACE TO START</span>
        </div>
      </div>
    </div>
  );
}
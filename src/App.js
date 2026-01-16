import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/** --- GLOBAL CONSTANTS --- **/
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const NET_X = 400;
const GROUND_Y = 440;
const PLAYER_SIZE = 72;
const BALL_SIZE = 24;
const GRAVITY = 0.48;
const FRICTION = 0.996; // Slightly less friction for faster gameplay
const WINNING_SCORE = 11;
const POWER_MAX = 100;
const TERMINAL_VELOCITY = 38;

/** --- STYLES --- **/
const styleSheet = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@500;800&display=swap');

  @keyframes energy-flow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes shake-ui {
    0%, 100% { transform: translate(0,0); }
    25% { transform: translate(-3px, 3px); }
    75% { transform: translate(3px, -3px); }
  }
  @keyframes floating {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  @keyframes text-reveal {
    from { opacity: 0; transform: translateY(30px) scale(0.8); filter: blur(15px); }
    to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
  
  .game-root {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; background: #020617; font-family: 'Outfit', sans-serif;
    color: white; margin: 0; overflow: hidden; user-select: none;
    background-image: 
      radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%);
  }
  .arena-viewport {
    perspective: 1200px; padding: 20px;
  }
  .court-frame {
    position: relative; padding: 12px; background: #1e293b; border-radius: 42px;
    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.9), inset 0 0 40px rgba(255,255,255,0.03);
    transform-style: preserve-3d; transition: transform 0.1s ease-out;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .court-surface {
    position: relative; width: ${COURT_WIDTH}px; height: ${COURT_HEIGHT}px;
    background: #000; border-radius: 32px; overflow: hidden; cursor: none;
    border: 2px solid rgba(255,255,255,0.08);
  }
  .grid-overlay {
    position: absolute; inset: 0;
    background-image: 
      linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px);
    background-size: 50px 50px; pointer-events: none;
    mask-image: radial-gradient(circle at center, black, transparent 90%);
  }
  .score-card {
    position: relative; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15);
    padding: 16px 24px; border-radius: 20px; min-width: 150px; text-align: center;
    backdrop-filter: blur(20px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .score-card.overload {
    animation: shake-ui 0.12s infinite;
    border-color: #facc15; box-shadow: 0 0 50px rgba(250, 204, 21, 0.4);
  }
  .energy-bar {
    width: 100%; height: 8px; background: rgba(0,0,0,0.6); border-radius: 10px;
    margin-top: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);
  }
  .energy-fill {
    height: 100%; transition: width 0.2s ease-out;
  }
  .energy-fill.charged {
    background: linear-gradient(90deg, #fff, #facc15, #fff);
    background-size: 200% 100%; animation: energy-flow 0.8s linear infinite;
  }
  .shockwave {
    position: absolute; border: 3px solid white; border-radius: 50%;
    pointer-events: none; animation: shock-out 0.7s cubic-bezier(0, 0, 0.2, 1) forwards;
  }
  @keyframes shock-out {
    0% { transform: scale(0); opacity: 1; border-width: 30px; }
    100% { transform: scale(18); opacity: 0; border-width: 0px; }
  }
  .overlay {
    position: absolute; inset: 0; background: rgba(2, 6, 23, 0.92);
    backdrop-filter: blur(25px); z-index: 300; display: flex; 
    flex-direction: column; align-items: center; justify-content: center;
    padding: 20px; text-align: center;
  }
  .btn-mega {
    background: #fff; color: #000; border: none; padding: 22px 64px;
    font-size: 24px; font-weight: 900; border-radius: 20px; cursor: pointer;
    text-transform: uppercase; letter-spacing: 8px; transition: all 0.3s;
    box-shadow: 0 20px 50px rgba(255,255,255,0.15);
    font-family: 'JetBrains Mono', monospace;
  }
  .btn-mega:hover { transform: translateY(-8px) scale(1.05); background: #facc15; box-shadow: 0 30px 60px rgba(250, 204, 21, 0.3); }
  .btn-mega:active { transform: translateY(-2px) scale(0.98); }
  .scanlines {
    position: absolute; inset: 0; pointer-events: none; z-index: 500;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
    background-size: 100% 4px; opacity: 0.3;
  }
  .chromatic-aberration {
    position: absolute; inset: 0; pointer-events: none; z-index: 490;
    mix-blend-mode: screen; opacity: 0; transition: opacity 0.3s;
    background: radial-gradient(circle, transparent, rgba(244, 63, 94, 0.2));
  }
  .chromatic-aberration.active { opacity: 1; }
  .rally-number {
    position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
    font-size: 180px; font-weight: 900; opacity: 0.08; color: white;
    font-style: italic; pointer-events: none; z-index: 1; transition: transform 0.15s;
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
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.current.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.start();
      osc.stop(audioCtx.current.currentTime + duration);
    } catch(e) { }
  };

  return useMemo(() => ({ 
    hit: () => playSound(440, 'triangle', 0.12, 0.08, 180),
    score: () => {
      playSound(60, 'sawtooth', 0.8, 0.15, 10);
      playSound(800, 'sine', 0.5, 0.1, 400);
    },
    superHit: () => {
        playSound(40, 'square', 1.0, 0.4, 5);
        playSound(2200, 'sine', 0.6, 0.2, 50);
    },
    click: () => playSound(1200, 'sine', 0.08, 0.05, 600)
  }), []);
};

/** --- SUB-COMPONENTS --- **/

const Player = ({ x, color, label, hitting, energy, ballPos }) => {
  const isCharged = energy >= POWER_MAX;
  const eyeX = Math.max(-10, Math.min(10, (ballPos.x - x) * 0.12));
  const eyeY = Math.max(-10, Math.min(10, (ballPos.y - (GROUND_Y - PLAYER_SIZE)) * 0.15));

  return (
    <div style={{ 
      position: 'absolute', left: x - PLAYER_SIZE / 2, top: GROUND_Y - PLAYER_SIZE,
      width: PLAYER_SIZE, height: PLAYER_SIZE, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: hitting ? 'scale(1.35, 0.65) translateY(12px)' : 'scale(1)',
      transition: 'transform 0.05s ease-out'
    }}>
      <div style={{ 
        fontSize: '11px', fontWeight: '900', color, marginBottom: '8px', 
        fontFamily: 'JetBrains Mono', letterSpacing: '3px', opacity: 0.9,
        textShadow: `0 0 10px ${color}`
      }}>
        {label}
      </div>
      <div style={{ 
        width: '100%', height: '100%', borderRadius: '24px',
        background: isCharged 
            ? `linear-gradient(135deg, ${color}, #fff, ${color})` 
            : `linear-gradient(135deg, ${color} 0%, #020617 100%)`,
        boxShadow: isCharged 
            ? `0 0 60px ${color}, inset 0 0 30px rgba(255,255,255,0.9)` 
            : `0 25px 50px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.15)`,
        border: `3px solid ${isCharged ? '#fff' : 'rgba(255,255,255,0.15)'}`,
        display: 'flex', justifyContent: 'center', gap: '12px', paddingTop: '18px',
        animation: isCharged ? 'shake-ui 0.08s infinite' : 'none',
        overflow: 'hidden', position: 'relative'
      }}>
        {/* Glow effect inside body */}
        {isCharged && <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: 0.2, animation: 'pulse-glow 1s infinite' }} />}
        
        <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#000', borderRadius: '50%', left: 4 + eyeX, top: 4 + eyeY }} />
        </div>
        <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#000', borderRadius: '50%', left: 4 + eyeX, top: 4 + eyeY }} />
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
  const comboRef = useRef(1);

  // Render state
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
      comboRef.current = 1;
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
    setTimeout(() => setShocks(s => s.filter(item => item.id !== sid)), 700);

    const pCount = isPower ? 80 : 20;
    const newParticles = Array.from({ length: pCount }).map(() => ({
      id: Math.random(), x, y,
      vx: (Math.random() - 0.5) * (isPower ? 70 : 30) * intensity,
      vy: (Math.random() - 0.8) * (isPower ? 70 : 30) * intensity,
      life: 1.0,
      size: Math.random() * (isPower ? 10 : 5) + 2,
      color: isPower ? '#f43f5e' : (Math.random() > 0.5 ? '#22d3ee' : '#facc15')
    }));
    setFx(prev => [...prev, ...newParticles].slice(-400));

    setShake(isPower ? 50 : 15 * intensity);
    if (isPower) {
      setFlash(true);
      timeScale.current = 0.2;
      setTimeout(() => {
        setFlash(false);
        timeScale.current = 1.0;
      }, 200);
    }
    setTimeout(() => setShake(0), 200);
  }, [sounds]);

  const update = useCallback((time) => {
    if (gameState !== 'PLAYING') {
        requestRef.current = requestAnimationFrame(update);
        return;
    }

    const ts = timeScale.current;
    const b = ball.current;
    
    // Sub-stepping for ultra-high speed collision accuracy
    const steps = isSuper ? 3 : 2;
    for(let s = 0; s < steps; s++) {
      const substepTs = ts / steps;
      
      // Paddle Update
      p1.current.prevX = p1.current.x;
      p1.current.x += (mousePos.current - p1.current.x) * 0.48;
      p1.current.x = Math.max(70, Math.min(NET_X - 65, p1.current.x));
      const p1Speed = (p1.current.x - p1.current.prevX) / substepTs;

      // AI Logic - Dynamic Adaptation
      if (b.vx > 0) {
        const distToAI = ai.current.x - b.x;
        const timeToReach = distToAI / Math.max(1, b.vx);
        // Prediction with slight randomness that decreases with rally
        const errorReduction = Math.max(0, 1 - rally / 18);
        const predictionError = (Math.sin(time / 250) * 50) * errorReduction;
        ai.current.targetX = b.x + (b.vx * 12) + predictionError; 
      } else {
        // Idle behavior
        ai.current.targetX = 650 + Math.sin(time / 600) * 100; 
      }

      ai.current.prevX = ai.current.x;
      const aiEase = 0.25 + (rally * 0.025); // AI gets faster as rally goes up
      ai.current.x += (ai.current.targetX - ai.current.x) * Math.min(0.7, aiEase) * substepTs;
      ai.current.x = Math.max(NET_X + 65, Math.min(COURT_WIDTH - 70, ai.current.x));
      const aiSpeed = (ai.current.x - ai.current.prevX) / substepTs;

      // Physics Calculation
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
        b.vx *= -0.98;
        b.x = b.x < BALL_SIZE/2 ? BALL_SIZE/2 : COURT_WIDTH - BALL_SIZE/2;
        triggerImpact(b.x, b.y, 'normal', 0.6);
      }
      if (b.y < BALL_SIZE/2) {
          b.vy *= -0.9;
          b.y = BALL_SIZE/2;
          triggerImpact(b.x, b.y, 'normal', 0.6);
      }

      // Net Collision
      if (Math.abs(b.x - NET_X) < (BALL_SIZE/2 + 12) && b.y > GROUND_Y - 150) {
        b.vx *= -0.75;
        b.x = b.x < NET_X ? NET_X - 28 : NET_X + 28;
        triggerImpact(b.x, b.y, 'normal', 0.8);
      }

      // Hit Resolution
      const resolvePaddleHit = (px, side, paddleSpeed) => {
        const py = GROUND_Y - PLAYER_SIZE/2;
        const dx = b.x - px;
        const dy = b.y - py;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < (BALL_SIZE + PLAYER_SIZE)/2 + 6) {
          let launch = 19 + (rally * 0.6);
          const spin = paddleSpeed * 0.3; // Momentum transfer
          
          setEnergy(prev => {
            if (prev[side] >= POWER_MAX) {
              launch *= 2.0;
              setIsSuper(true);
              triggerImpact(b.x, b.y, 'super');
              return { ...prev, [side]: 0 };
            } else {
              setIsSuper(false);
              triggerImpact(b.x, b.y, 'normal', 1.2);
              return { ...prev, [side]: Math.min(POWER_MAX, prev[side] + 25) };
            }
          });

          const angle = Math.atan2(dy, dx);
          b.vx = Math.cos(angle) * launch + spin;
          b.vy = Math.min(Math.sin(angle) * launch, -16); 

          const offset = (BALL_SIZE + PLAYER_SIZE)/2 + 18;
          b.x = px + Math.cos(angle) * offset;
          b.y = py + Math.sin(angle) * offset;

          setRally(r => r + 1);
          setHitting(h => ({ ...h, [side]: true }));
          setTimeout(() => setHitting(h => ({ ...h, [side]: false })), 100);
        }
      };

      resolvePaddleHit(p1.current.x, 'p1', p1Speed);
      resolvePaddleHit(ai.current.x, 'ai', aiSpeed);
    }

    // Scoring (Ground collision)
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
            ball.current = { x: p1Win ? 200 : 600, y: 150, vx: p1Win ? 10 : -10, vy: 0, trail: [] };
            setGameState('PLAYING');
          }, 1600);
        }
        return next;
      });

      setRally(0);
      setEnergy({ p1: 0, ai: 0 });
      setIsSuper(false);
      triggerImpact(b.x, b.y, 'super');
      return;
    }

    // VFX Particles Update
    setFx(prev => prev.map(p => ({ 
      ...p, 
      x: p.x + p.vx * ts, 
      y: p.y + p.vy * ts, 
      vy: p.vy + 0.6 * ts, 
      life: p.life - 0.035 * ts 
    })).filter(p => p.life > 0));

    // Trail logic
    b.trail.unshift({ x: b.x, y: b.y });
    if (b.trail.length > 25) b.trail.pop();

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
      
      <div className="rally-number" style={{ 
        transform: `translateX(-50%) scale(${1 + rally * 0.03})`,
        opacity: Math.min(0.2, rally * 0.02)
      }}>
        {rally > 0 ? rally : ''}
      </div>

      {/* HUD SECTION */}
      <div style={{ display: 'flex', gap: '60px', marginBottom: '25px', alignItems: 'center', zIndex: 10 }}>
        <div className={`score-card ${energy.p1 >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: '900', letterSpacing: '4px', fontFamily: 'JetBrains Mono' }}>PILOT.NODE</div>
          <div style={{ fontSize: '78px', fontWeight: '900', color: '#fff', fontStyle: 'italic', margin: '4px 0', lineHeight: 1 }}>{score.p1}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.p1 >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.p1}%`, background: '#22d3ee' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '260px' }}>
          <h1 style={{ 
            margin: 0, fontStyle: 'italic', fontSize: '58px', fontWeight: 900, 
            color: '#facc15', textShadow: '0 0 40px rgba(250,204,21,0.6)', 
            letterSpacing: '-3px'
          }}>NOVA STRIKE</h1>
          <div style={{ 
            fontSize: '12px', opacity: 0.9, letterSpacing: '8px', fontWeight: '800', 
            color: isSuper ? '#f43f5e' : '#94a3b8', marginTop: '8px', textTransform: 'uppercase' 
          }}>
            {isSuper ? '!! OVERDRIVE !!' : `RALLY CHAIN: ${rally}`}
          </div>
        </div>

        <div className={`score-card ${energy.ai >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: '900', letterSpacing: '4px', fontFamily: 'JetBrains Mono' }}>AI.CORE</div>
          <div style={{ fontSize: '78px', fontWeight: '900', color: '#fff', fontStyle: 'italic', margin: '4px 0', lineHeight: 1 }}>{score.ai}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.ai >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.ai}%`, background: '#f43f5e' }} />
          </div>
        </div>
      </div>

      {/* ARENA SECTION */}
      <div className="arena-viewport">
        <div className={`court-frame`} style={{ 
          transform: `rotateX(20deg) rotateY(${(render.p1 - 400) * 0.04}deg) translate(${Math.random()*shake}px, ${Math.random()*shake}px)` 
        }}>
          <div className="court-surface" onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            mousePos.current = e.clientX - rect.left;
          }}>
            <div className="grid-overlay" />
            
            {/* Impact Flash */}
            <div style={{ 
                position: 'absolute', inset: 0, background: '#fff', zIndex: 200, 
                opacity: flash ? 0.9 : 0, transition: 'opacity 0.05s', pointerEvents: 'none' 
            }} />

            {/* Dynamic Light Follow */}
            <div style={{ 
                position: 'absolute', 
                left: render.ball.x - 350, top: render.ball.y - 350, 
                width: 700, height: 700, borderRadius: '50%', 
                background: `radial-gradient(circle, ${isSuper ? 'rgba(244,63,94,0.4)' : 'rgba(34,211,238,0.2)'} 0%, transparent 75%)`, 
                pointerEvents: 'none', zIndex: 10 
            }} />
            
            {/* Field Boundary */}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: 60, background: 'linear-gradient(to bottom, #0f172a, #020617)', borderTop: '3px solid rgba(255,255,255,0.15)' }} />
            
            {/* The Net */}
            <div style={{ 
                position: 'absolute', left: NET_X - 6, bottom: 60, width: 12, height: 150, 
                background: 'linear-gradient(to top, #475569, #facc15)', 
                boxShadow: '0 0 40px rgba(250,204,21,0.4)', 
                display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '10px 0', border: '1px solid rgba(255,255,255,0.3)'
            }}>
              {[...Array(10)].map((_, i) => <div key={i} style={{ width: '100%', height: 1.5, background: 'rgba(255,255,255,0.4)' }} />)}
            </div>

            {/* Effects Layers */}
            {shocks.map(s => <div key={s.id} className="shockwave" style={{ left: s.x - 60, top: s.y - 60, width: 120, height: 120, borderColor: s.color }} />)}
            {fx.map(p => (
                <div key={p.id} style={{ 
                    position: 'absolute', left: p.x, top: p.y, 
                    width: p.size, height: p.size, 
                    background: p.color, borderRadius: '2px', 
                    opacity: p.life, pointerEvents: 'none', zIndex: 60, 
                    transform: `scale(${p.life * 2.5}) rotate(${p.life * 720}deg)`, 
                    boxShadow: `0 0 20px ${p.color}` 
                }} />
            ))}
            
            {/* Trail */}
            {render.ball.trail.map((t, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: BALL_SIZE * (1.2 - i / 25),
                height: BALL_SIZE * (1.2 - i / 25),
                left: t.x - (BALL_SIZE * (1.2 - i / 25)) / 2,
                top: t.y - (BALL_SIZE * (1.2 - i / 25)) / 2,
                background: isSuper ? `rgba(244, 63, 94, ${0.9 - i/25})` : `rgba(34, 211, 238, ${0.7 - i/25})`,
                borderRadius: '50%', filter: `blur(${isSuper ? 10 : 5}px)`, opacity: 1 - i/25, pointerEvents: 'none'
              }} />
            ))}
            
            {/* The Ball */}
            <div style={{ 
                position: 'absolute', 
                left: render.ball.x - BALL_SIZE/2, 
                top: render.ball.y - BALL_SIZE/2, 
                width: BALL_SIZE, height: BALL_SIZE, 
                borderRadius: '50%', zIndex: 100, 
                background: isSuper ? '#fff' : '#facc15', 
                boxShadow: isSuper 
                    ? '0 0 60px #f43f5e, 0 0 120px rgba(244,63,94,0.6)' 
                    : '0 0 35px rgba(250, 204, 21, 0.9), inset 0 -5px 10px rgba(0,0,0,0.4)', 
                border: `2px solid ${isSuper ? '#fff' : '#78350f'}`, 
                transform: `scale(${1 + Math.abs(render.ball.vx)*0.035}, ${1 - Math.abs(render.ball.vy)*0.025}) rotate(${render.ball.x * 2.5}deg)`
            }}>
              <div style={{ position: 'absolute', top: '15%', left: '15%', width: '45%', height: '45%', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', filter: 'blur(3px)' }} />
            </div>

            {/* Players */}
            <Player x={render.p1} color="#22d3ee" label="PILOT" hitting={hitting.p1} energy={energy.p1} ballPos={render.ball} />
            <Player x={render.ai} color="#f43f5e" label="CORE" hitting={hitting.ai} energy={energy.ai} ballPos={render.ball} />

            {/* Overlays */}
            {gameState === 'START' && (
              <div className="overlay">
                <div style={{ marginBottom: '50px', textAlign: 'center', animation: 'floating 4s ease-in-out infinite' }}>
                  <div style={{ fontSize: '13px', letterSpacing: '14px', opacity: 0.8, color: '#22d3ee', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>CONNECTION STABLE</div>
                  <h2 style={{ 
                    fontSize: '110px', fontWeight: '900', letterSpacing: '-6px', fontStyle: 'italic', 
                    margin: '15px 0', textShadow: '0 0 70px rgba(255,255,255,0.25)',
                    animation: 'text-reveal 0.9s ease-out'
                  }}>NOVA STRIKE</h2>
                  <div style={{ height: '6px', background: 'linear-gradient(90deg, transparent, #facc15, transparent)', width: '100%' }} />
                </div>
                <button className="btn-mega" onClick={handleAction}> INITIATE LINK </button>
                <div style={{ marginTop: '50px', opacity: 0.6, fontSize: '12px', border: '1px solid rgba(255,255,255,0.25)', padding: '14px 35px', borderRadius: '50px', letterSpacing: '4px', fontWeight: '900', color: '#facc15' }}>
                  PEAK VOLTAGE: {highScore}
                </div>
              </div>
            )}

            {gameState === 'ROUND_END' && (
              <div className="overlay" style={{ background: 'rgba(2,6,23,0.4)', backdropFilter: 'blur(8px)' }}>
                <h2 style={{ 
                  fontSize: '160px', fontWeight: '900', color: '#facc15', 
                  textShadow: '0 0 120px #facc15', fontStyle: 'italic', 
                  transform: 'rotate(-4deg)', animation: 'shake-ui 0.1s infinite' 
                }}>GOAL</h2>
              </div>
            )}

            {gameState === 'GAME_OVER' && (
              <div className="overlay">
                <h1 style={{ 
                  fontSize: '26px', letterSpacing: '18px', 
                  color: score.p1 > score.ai ? '#22d3ee' : '#f43f5e', 
                  fontWeight: 900, marginBottom: '30px'
                }}>
                  {score.p1 > score.ai ? 'MISSION SUCCESS' : 'SYSTEM OFFLINE'}
                </h1>
                <div style={{ fontSize: '180px', fontWeight: '900', margin: '-30px 0', fontStyle: 'italic', color: '#fff' }}>
                  {score.p1}:{score.ai}
                </div>
                <button className="btn-mega" onClick={handleAction} style={{ marginTop: '50px' }}> REBOOT SYSTEM </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div style={{ marginTop: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
        <div style={{ opacity: 0.8, fontSize: '12px', letterSpacing: '8px', fontWeight: '900', color: '#facc15', fontFamily: 'JetBrains Mono' }}>
          NOVA STRIKE // v6.0.0 // QUANTUM BUILD
        </div>
        <div style={{ display: 'flex', gap: '40px', opacity: 0.5, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 800 }}>
          <span>MOUSE TO STRIKE</span>
          <span>SPACE TO START</span>
          <span>REACH 11 TO WIN</span>
        </div>
      </div>
    </div>
  );
}
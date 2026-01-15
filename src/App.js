import React, { useState, useEffect, useCallback, useRef } from 'react';

/** --- GLOBAL CONSTANTS --- **/
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const NET_X = 400;
const GROUND_Y = 440;
const PLAYER_SIZE = 72;
const BALL_SIZE = 24;
const GRAVITY = 0.45;
const FRICTION = 0.992;
const WINNING_SCORE = 11;
const POWER_MAX = 100;
const TERMINAL_VELOCITY = 32;

/** --- STYLES --- **/
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@500&display=swap');

  @keyframes energy-flow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes shake-ui {
    0%, 100% { transform: translate(0,0); }
    25% { transform: translate(-3px, 3px); }
    75% { transform: translate(3px, -3px); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.2; transform: scale(1); filter: blur(10px); }
    50% { opacity: 0.5; transform: scale(1.3); filter: blur(18px); }
  }
  @keyframes floating {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  @keyframes text-reveal {
    from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
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
    perspective: 1500px; padding: 20px;
  }
  .court-frame {
    position: relative; padding: 16px; background: #0f172a; border-radius: 48px;
    box-shadow: 0 50px 120px -30px rgba(0,0,0,1), inset 0 0 60px rgba(255,255,255,0.03);
    transform-style: preserve-3d; transition: transform 0.15s cubic-bezier(0.2, 0, 0, 1);
    border: 1px solid rgba(255,255,255,0.05);
  }
  .court-surface {
    position: relative; width: ${COURT_WIDTH}px; height: ${COURT_HEIGHT}px;
    background: #000;
    border-radius: 38px; overflow: hidden; cursor: none;
    border: 2px solid rgba(255,255,255,0.03);
  }
  .court-surface.super-active {
    box-shadow: inset 0 0 100px rgba(244, 63, 94, 0.4);
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
    position: relative; background: rgba(2, 6, 23, 0.85); border: 2px solid #1e293b;
    padding: 20px 32px; border-radius: 28px; min-width: 160px; text-align: center;
    backdrop-filter: blur(25px); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  .score-card.overload {
    animation: shake-ui 0.1s infinite;
    border-color: #facc15; box-shadow: 0 0 60px rgba(250, 204, 21, 0.25);
  }
  .energy-bar {
    width: 100%; height: 8px; background: rgba(0,0,0,0.8); border-radius: 20px;
    margin-top: 15px; overflow: hidden; position: relative;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .energy-fill {
    height: 100%; transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .energy-fill.charged {
    background: linear-gradient(90deg, #fff, #facc15, #fff);
    background-size: 200% 100%; animation: energy-flow 0.8s linear infinite;
  }
  .shockwave {
    position: absolute; border: 4px solid white; border-radius: 50%;
    pointer-events: none; animation: shock-out 0.9s cubic-bezier(0.1, 0, 0, 1) forwards;
  }
  @keyframes shock-out {
    0% { transform: scale(0); opacity: 1; border-width: 40px; }
    100% { transform: scale(18); opacity: 0; border-width: 0px; }
  }
  .impact-flash {
    position: absolute; inset: 0; background: white; z-index: 200;
    pointer-events: none; opacity: 0; mix-blend-mode: overlay; transition: opacity 0.05s;
  }
  .impact-flash.active { opacity: 0.95; }
  .overlay {
    position: absolute; inset: 0; background: rgba(2, 6, 23, 0.94);
    backdrop-filter: blur(30px); z-index: 300; display: flex; 
    flex-direction: column; align-items: center; justify-content: center;
  }
  .btn-mega {
    background: #fff; color: #000; border: none; padding: 24px 72px;
    font-size: 26px; font-weight: 900; border-radius: 24px; cursor: pointer;
    text-transform: uppercase; letter-spacing: 8px; transition: all 0.3s;
    box-shadow: 0 20px 60px rgba(255,255,255,0.1);
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .btn-mega:hover { transform: translateY(-8px) scale(1.03); background: #facc15; box-shadow: 0 25px 70px rgba(250,204,21,0.4); }
  .btn-mega:active { transform: translateY(0) scale(0.95); }
  .scanlines {
    position: absolute; inset: 0; pointer-events: none; z-index: 500;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%),
                linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
    background-size: 100% 4px, 4px 100%;
    opacity: 0.35;
  }
  .vignette {
    position: absolute; inset: 0; pointer-events: none; z-index: 495;
    background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%);
  }
  .chromatic-aberration {
    position: absolute; inset: 0; pointer-events: none; z-index: 490;
    mix-blend-mode: screen; opacity: 0; transition: opacity 0.3s;
    background: radial-gradient(circle, transparent, rgba(244, 63, 94, 0.25));
  }
  .chromatic-aberration.active { opacity: 1; }
  .rally-number {
    position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
    font-size: 140px; font-weight: 900; opacity: 0.03; color: white;
    font-style: italic; pointer-events: none; z-index: 1;
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

  return { 
    hit: () => playSound(440, 'triangle', 0.12, 0.08, 200),
    score: () => {
      playSound(100, 'sawtooth', 0.8, 0.15, 20);
      playSound(800, 'sine', 0.5, 0.1, 1000);
    },
    superHit: () => {
        playSound(40, 'square', 1.0, 0.4, 5);
        playSound(1800, 'sine', 0.6, 0.2, 50);
        playSound(200, 'sawtooth', 0.3, 0.1, 400);
    },
    click: () => playSound(1200, 'sine', 0.08, 0.05, 400)
  };
};

/** --- HELPER COMPONENTS --- **/

const BallTrail = ({ trail, isSuper }) => (
  <>
    {trail.map((t, i) => (
      <div key={i} style={{
        position: 'absolute',
        width: BALL_SIZE * (1.3 - i / trail.length),
        height: BALL_SIZE * (1.3 - i / trail.length),
        left: t.x - (BALL_SIZE * (1.3 - i / trail.length)) / 2,
        top: t.y - (BALL_SIZE * (1.3 - i / trail.length)) / 2,
        background: isSuper ? `rgba(244, 63, 94, ${0.9 - i / trail.length})` : `rgba(34, 211, 238, ${0.7 - i / trail.length})`,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 45,
        filter: `blur(${isSuper ? 10 : 4}px)`,
        opacity: (1 - i / trail.length) * 0.9,
        transform: `scale(${1 - i/trail.length})`
      }} />
    ))}
  </>
);

const Player = ({ x, color, label, hitting, energy, ballPos }) => {
  const isCharged = energy >= POWER_MAX;
  const eyeX = Math.max(-10, Math.min(10, (ballPos.x - x) * 0.1));
  const eyeY = Math.max(-10, Math.min(10, (ballPos.y - (GROUND_Y - PLAYER_SIZE)) * 0.12));

  return (
    <div style={{ 
      position: 'absolute', left: x - PLAYER_SIZE / 2, top: GROUND_Y - PLAYER_SIZE,
      width: PLAYER_SIZE, height: PLAYER_SIZE, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: hitting ? 'scale(1.4, 0.6) translateY(12px)' : 'scale(1)',
      transition: 'transform 0.08s cubic-bezier(0.1, 0.8, 0.2, 1.3)'
    }}>
      <div style={{ 
        fontSize: '11px', fontWeight: '900', color, marginBottom: '8px', 
        fontFamily: 'JetBrains Mono', letterSpacing: '3px', textShadow: isCharged ? `0 0 15px ${color}` : 'none',
        opacity: 0.9, whiteSpace: 'nowrap'
      }}>
        {label}
      </div>
      <div style={{ 
        width: '100%', height: '100%', borderRadius: '26px',
        background: isCharged 
            ? `linear-gradient(135deg, ${color}, #fff, ${color})` 
            : `linear-gradient(135deg, ${color} 0%, #020617 100%)`,
        boxShadow: isCharged 
            ? `0 0 70px ${color}, inset 0 0 25px rgba(255,255,255,0.9)` 
            : `0 25px 50px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.15)`,
        border: `3px solid ${isCharged ? '#fff' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', justifyContent: 'center', gap: '12px', paddingTop: '18px',
        animation: isCharged ? 'shake-ui 0.1s infinite' : 'none',
        overflow: 'hidden'
      }}>
        <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '9px', height: '9px', background: '#000', borderRadius: '50%', left: 3.5 + eyeX, top: 3.5 + eyeY }} />
        </div>
        <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '9px', height: '9px', background: '#000', borderRadius: '50%', left: 3.5 + eyeX, top: 3.5 + eyeY }} />
        </div>
      </div>
    </div>
  );
};

/** --- MAIN GAME --- **/

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

  const ball = useRef({ x: 200, y: 150, vx: 8, vy: 0, trail: [] });
  const p1 = useRef({ x: 150, prevX: 150 });
  const ai = useRef({ x: 650, prevX: 650, targetX: 650 });
  const mousePos = useRef(150);
  const requestRef = useRef();
  const timeScale = useRef(1.0);

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
      ball.current = { x: 200, y: 150, vx: 9.5, vy: 0, trail: [] };
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

  const triggerImpact = (x, y, type = 'normal', intensity = 1) => {
    const isPower = type === 'super';
    if (isPower) sounds.superHit(); else sounds.hit();
    
    const newShock = { id: Math.random(), x, y, color: isPower ? '#f43f5e' : '#fff' };
    setShocks(s => [...s, newShock]);
    setTimeout(() => setShocks(s => s.filter(item => item.id !== newShock.id)), 900);

    const pCount = isPower ? 90 : 20;
    const newParticles = Array.from({ length: pCount }).map(() => ({
      id: Math.random(), x, y,
      vx: (Math.random() - 0.5) * (isPower ? 70 : 30) * intensity,
      vy: (Math.random() - 0.8) * (isPower ? 70 : 30) * intensity,
      life: 1.0,
      size: Math.random() * (isPower ? 10 : 5) + 3,
      color: isPower ? '#f43f5e' : (Math.random() > 0.6 ? '#22d3ee' : '#facc15')
    }));
    setFx(prev => [...prev, ...newParticles].slice(-400));

    setShake(isPower ? 60 : 15 * intensity);
    if (isPower) {
      setFlash(true);
      timeScale.current = 0.3; // Slow mo effect
      setTimeout(() => {
        setFlash(false);
        timeScale.current = 1.0;
      }, 200);
    }
    setTimeout(() => setShake(0), 200);
  };

  const update = useCallback((time) => {
    if (gameState !== 'PLAYING') {
        requestRef.current = requestAnimationFrame(update);
        return;
    }

    const ts = timeScale.current;
    const b = ball.current;
    
    // Player Input
    p1.current.prevX = p1.current.x;
    p1.current.x += (mousePos.current - p1.current.x) * 0.48;
    p1.current.x = Math.max(75, Math.min(NET_X - 65, p1.current.x));
    const p1Speed = p1.current.x - p1.current.prevX;

    // AI Prediction Logic
    if (b.vx > 0) {
      const distToAI = ai.current.x - b.x;
      const timeToReach = Math.max(0.1, distToAI / Math.max(0.1, b.vx));
      // Heuristic prediction of landing zone
      const predictedY = b.y + (b.vy * timeToReach) + (0.5 * GRAVITY * timeToReach * timeToReach);
      
      const difficulty = Math.min(0.95, 0.45 + (rally * 0.025));
      // AI adds a bit of randomness to humanize it
      const error = (Math.sin(time/200) * 15) * (1 - difficulty);
      ai.current.targetX = b.x + (b.vx * (25 - difficulty * 15)) + error; 
    } else {
      ai.current.targetX = 660 + Math.sin(time / 600) * 90; 
    }

    ai.current.prevX = ai.current.x;
    const aiEase = (0.28 + (rally * 0.01)) * ts;
    ai.current.x += (ai.current.targetX - ai.current.x) * Math.min(0.6, aiEase);
    ai.current.x = Math.max(NET_X + 65, Math.min(COURT_WIDTH - 75, ai.current.x));
    const aiSpeed = ai.current.x - ai.current.prevX;

    // Physics Loop with Time Scaling
    b.vy += GRAVITY * ts;
    b.x += b.vx * ts;
    b.y += b.vy * ts;
    b.vx *= Math.pow(FRICTION, ts);
    
    const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
    if (speed > TERMINAL_VELOCITY) {
      b.vx = (b.vx / speed) * TERMINAL_VELOCITY;
      b.vy = (b.vy / speed) * TERMINAL_VELOCITY;
    }

    b.trail.unshift({ x: b.x, y: b.y });
    if (b.trail.length > 25) b.trail.pop();

    // Boundary Physics
    if (b.x < BALL_SIZE/2 || b.x > COURT_WIDTH - BALL_SIZE/2) {
      b.vx *= -0.92;
      b.x = b.x < BALL_SIZE/2 ? BALL_SIZE/2 : COURT_WIDTH - BALL_SIZE/2;
      triggerImpact(b.x, b.y, 'normal', 0.6);
    }
    if (b.y < BALL_SIZE/2) {
        b.vy *= -0.88;
        b.y = BALL_SIZE/2;
        triggerImpact(b.x, b.y, 'normal', 0.6);
    }

    // Net Interaction
    if (Math.abs(b.x - NET_X) < (BALL_SIZE/2 + 12) && b.y > GROUND_Y - 150) {
      b.vx *= -0.85;
      b.x = b.x < NET_X ? NET_X - 28 : NET_X + 28;
      triggerImpact(b.x, b.y, 'normal', 0.8);
    }

    // Paddle Physics
    const resolvePaddleHit = (px, side, paddleSpeed) => {
      const py = GROUND_Y - PLAYER_SIZE/2;
      const dx = b.x - px;
      const dy = b.y - py;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < (BALL_SIZE + PLAYER_SIZE)/2 + 6) {
        let launchForce = 19 + (rally * 0.45);
        const spinEffect = paddleSpeed * 0.6;
        
        setEnergy(prev => {
          const currentEnergy = prev[side];
          if (currentEnergy >= POWER_MAX) {
            launchForce *= 2.0;
            setIsSuper(true);
            triggerImpact(b.x, b.y, 'super');
            return { ...prev, [side]: 0 };
          } else {
            setIsSuper(false);
            triggerImpact(b.x, b.y, 'normal', 1.3);
            return { ...prev, [side]: Math.min(POWER_MAX, currentEnergy + 25) };
          }
        });

        const angle = Math.atan2(dy, dx);
        b.vx = Math.cos(angle) * launchForce + spinEffect;
        b.vy = Math.min(Math.sin(angle) * launchForce, -15); 

        // Reposition to prevent overlap
        const correction = (BALL_SIZE + PLAYER_SIZE)/2 + 18;
        b.x = px + Math.cos(angle) * correction;
        b.y = py + Math.sin(angle) * correction;

        setRally(r => r + 1);
        setHitting(h => ({ ...h, [side]: true }));
        setTimeout(() => setHitting(h => ({ ...h, [side]: false })), 100);
      }
    };

    resolvePaddleHit(p1.current.x, 'p1', p1Speed);
    resolvePaddleHit(ai.current.x, 'ai', aiSpeed);

    // Goal Trigger
    if (b.y > GROUND_Y - BALL_SIZE/2) {
      sounds.score();
      const p1Scored = b.x > NET_X;
      const winner = p1Scored ? 'p1' : 'ai';
      
      setScore(oldScore => {
        const newScore = { ...oldScore, [winner]: oldScore[winner] + 1 };
        
        if (newScore[winner] >= WINNING_SCORE) {
          if (newScore.p1 > highScore) {
              setHighScore(newScore.p1);
              localStorage.setItem('novaStrikeHigh', newScore.p1);
          }
          setGameState('GAME_OVER');
        } else {
          setGameState('ROUND_END');
          setTimeout(() => {
            ball.current = { x: p1Scored ? 200 : 600, y: 150, vx: p1Scored ? 10 : -10, vy: 0, trail: [] };
            setGameState('PLAYING');
          }, 1800);
        }
        return newScore;
      });

      setRally(0);
      setEnergy({ p1: 0, ai: 0 });
      setIsSuper(false);
      triggerImpact(b.x, b.y, 'super');
      return;
    }

    // Particle Logic
    setFx(prev => prev.map(p => ({ 
      ...p, 
      x: p.x + p.vx * ts, 
      y: p.y + p.vy * ts, 
      vy: p.vy + 0.65 * ts, 
      life: p.life - 0.04 * ts 
    })).filter(p => p.life > 0));

    setRender({
      ball: { x: b.x, y: b.y, vy: b.vy, vx: b.vx, trail: [...b.trail] },
      p1: p1.current.x, ai: ai.current.x
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, rally, sounds, highScore]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="game-root">
      <style>{styles}</style>
      <div className="scanlines" />
      <div className="vignette" />
      <div className={`chromatic-aberration ${isSuper ? 'active' : ''}`} />
      
      <div className="rally-number">{rally > 0 ? rally : ''}</div>

      {/* HUD */}
      <div style={{ display: 'flex', gap: '60px', marginBottom: '30px', alignItems: 'center', zIndex: 10 }}>
        <div className={`score-card ${energy.p1 >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: '900', letterSpacing: '4px', fontFamily: 'JetBrains Mono' }}>PILOT.NODE</div>
          <div style={{ fontSize: '84px', fontWeight: '900', lineHeight: 1, margin: '8px 0', color: '#fff', fontStyle: 'italic' }}>{score.p1}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.p1 >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.p1}%`, background: '#22d3ee', boxShadow: energy.p1 >= POWER_MAX ? '0 0 20px #22d3ee' : 'none' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '280px' }}>
          <h1 style={{ 
            margin: 0, fontStyle: 'italic', fontSize: '64px', fontWeight: 900, 
            color: '#facc15', textShadow: '0 0 40px rgba(250,204,21,0.6)', 
            letterSpacing: '-3px', lineHeight: 1 
          }}>NOVA STRIKE</h1>
          <div style={{ 
            fontSize: '13px', opacity: 0.9, letterSpacing: '8px', fontWeight: 'bold', 
            color: isSuper ? '#f43f5e' : '#64748b', marginTop: '10px', textTransform: 'uppercase' 
          }}>
            {isSuper ? '!! OVERDRIVE CALIBRATED !!' : `Rally Chain: ${rally}`}
          </div>
        </div>

        <div className={`score-card ${energy.ai >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: '900', letterSpacing: '4px', fontFamily: 'JetBrains Mono' }}>TITAN.CORE</div>
          <div style={{ fontSize: '84px', fontWeight: '900', lineHeight: 1, margin: '8px 0', color: '#fff', fontStyle: 'italic' }}>{score.ai}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.ai >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.ai}%`, background: '#f43f5e', boxShadow: energy.ai >= POWER_MAX ? '0 0 20px #f43f5e' : 'none' }} />
          </div>
        </div>
      </div>

      <div className="arena-viewport">
        <div className={`court-frame ${isSuper ? 'super-active' : ''}`} style={{ 
          transform: `rotateX(18deg) rotateY(${(render.p1 - 400) * 0.03}deg) translate(${Math.random()*shake}px, ${Math.random()*shake}px)` 
        }}>
          <div className="court-surface" onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            mousePos.current = e.clientX - rect.left;
          }}>
            <div className={`impact-flash ${flash ? 'active' : ''}`} />
            <div className="grid-overlay" />
            
            {/* Dynamic Light Casting */}
            <div style={{ 
                position: 'absolute', 
                left: render.ball.x - 400, 
                top: render.ball.y - 400, 
                width: 800, height: 800, 
                borderRadius: '50%', 
                background: `radial-gradient(circle, ${isSuper ? 'rgba(244,63,94,0.4)' : 'rgba(34,211,238,0.25)'} 0%, transparent 75%)`, 
                pointerEvents: 'none', zIndex: 10 
            }} />
            
            {/* Ground / Floor */}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: 60, background: 'linear-gradient(to bottom, #0f172a, #020617)', borderTop: '3px solid rgba(34, 211, 238, 0.3)' }}>
               <div style={{ position: 'absolute', top: 0, width: '100%', height: '100%', opacity: 0.05, background: 'repeating-linear-gradient(90deg, #fff, #fff 50px, transparent 50px, transparent 100px)' }} />
            </div>
            
            {/* Net */}
            <div style={{ 
                position: 'absolute', left: NET_X - 6, bottom: 60, width: 12, height: 160, 
                background: 'linear-gradient(to top, #1e293b, #facc15)', 
                boxShadow: '0 0 40px rgba(250,204,21,0.4)', 
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 0',
                border: '1px solid rgba(255,255,255,0.15)'
            }}>
              {[...Array(10)].map((_, i) => <div key={i} style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.4)' }} />)}
            </div>

            {/* Effects */}
            {shocks.map(s => <div key={s.id} className="shockwave" style={{ left: s.x - 60, top: s.y - 60, width: 120, height: 120, borderColor: s.color }} />)}
            {fx.map(p => (
                <div key={p.id} style={{ 
                    position: 'absolute', left: p.x, top: p.y, 
                    width: p.size, height: p.size, 
                    background: p.color, borderRadius: '3px', 
                    opacity: p.life, pointerEvents: 'none', zIndex: 60, 
                    transform: `scale(${p.life * 3}) rotate(${p.life * 720}deg)`, 
                    boxShadow: `0 0 20px ${p.color}` 
                }} />
            ))}
            
            {/* Shadow */}
            <div style={{ 
                position: 'absolute', width: 70, height: 15, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', bottom: 54, pointerEvents: 'none', filter: 'blur(10px)',
                left: render.ball.x - 35, 
                opacity: Math.max(0, 0.95 * (1 - (render.ball.y / GROUND_Y))), 
                transform: `scale(${0.3 + (render.ball.y/GROUND_Y)})` 
            }} />
            
            <BallTrail trail={render.ball.trail} isSuper={isSuper} />
            
            {/* Ball */}
            <div style={{ 
                position: 'absolute', 
                left: render.ball.x - BALL_SIZE/2, 
                top: render.ball.y - BALL_SIZE/2, 
                width: BALL_SIZE, height: BALL_SIZE, 
                borderRadius: '50%', 
                zIndex: 100, 
                background: isSuper ? '#fff' : '#facc15', 
                boxShadow: isSuper 
                    ? '0 0 60px #f43f5e, 0 0 120px rgba(244,63,94,0.7)' 
                    : '0 0 40px rgba(250, 204, 21, 0.9), inset 0 -5px 10px rgba(0,0,0,0.4)', 
                border: `2px solid ${isSuper ? '#fff' : '#78350f'}`, 
                transform: `
                    scale(${1 + Math.abs(render.ball.vx)*0.04}, ${1 - Math.abs(render.ball.vy)*0.03}) 
                    rotate(${render.ball.x * 3.5}deg)
                `, 
                transition: 'transform 0.04s linear' 
            }}>
              <div style={{ position: 'absolute', top: '10%', left: '15%', width: '45%', height: '45%', background: 'rgba(255,255,255,0.85)', borderRadius: '50%', filter: 'blur(3px)' }} />
            </div>

            {/* Players */}
            <Player x={render.p1} color="#22d3ee" label="P1.PILOT" hitting={hitting.p1} energy={energy.p1} ballPos={render.ball} />
            <Player x={render.ai} color="#f43f5e" label="AI.CORE" hitting={hitting.ai} energy={energy.ai} ballPos={render.ball} />

            {/* Overlays */}
            {gameState === 'START' && (
              <div className="overlay">
                <div style={{ marginBottom: '60px', textAlign: 'center', animation: 'floating 5s ease-in-out infinite' }}>
                  <div style={{ fontSize: '14px', letterSpacing: '16px', opacity: 0.8, color: '#22d3ee', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>NEURAL INTERFACE ACTIVE</div>
                  <h2 style={{ 
                    fontSize: '124px', fontWeight: '900', letterSpacing: '-8px', fontStyle: 'italic', 
                    margin: '20px 0', textShadow: '0 0 80px rgba(255,255,255,0.2)',
                    animation: 'text-reveal 1s ease-out'
                  }}>NOVA STRIKE</h2>
                  <div style={{ height: '6px', background: 'linear-gradient(90deg, transparent, #facc15, transparent)', width: '100%' }} />
                </div>
                <button className="btn-mega" onClick={handleAction}>
                  Establish Link
                  <span style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '3px', fontWeight: 500 }}>[ CLICK OR SPACEBAR ]</span>
                </button>
                <div style={{ marginTop: '60px', opacity: 0.5, fontSize: '13px', border: '2px solid rgba(255,255,255,0.1)', padding: '16px 40px', borderRadius: '50px', letterSpacing: '4px', fontWeight: '900' }}>
                  HIGH SCORE ARCHIVE: {highScore}
                </div>
              </div>
            )}

            {gameState === 'ROUND_END' && (
              <div className="overlay" style={{ background: 'rgba(2,6,23,0.5)', backdropFilter: 'blur(8px)' }}>
                <h2 style={{ 
                  fontSize: '160px', fontWeight: '900', color: '#facc15', 
                  textShadow: '0 0 120px rgba(250,204,21,1)', fontStyle: 'italic', 
                  transform: 'rotate(-5deg)', animation: 'shake-ui 0.1s infinite' 
                }}>GOAL</h2>
              </div>
            )}

            {gameState === 'GAME_OVER' && (
              <div className="overlay">
                <h1 style={{ 
                  fontSize: '28px', letterSpacing: '20px', 
                  color: score.p1 > score.ai ? '#22d3ee' : '#f43f5e', 
                  fontWeight: 900, textTransform: 'uppercase', marginBottom: '30px',
                  fontFamily: 'JetBrains Mono'
                }}>
                  {score.p1 > score.ai ? '>> MISSION SUCCESS <<' : '>> SYSTEM FAILURE <<'}
                </h1>
                <div style={{ fontSize: '200px', fontWeight: '900', margin: '-40px 0', letterSpacing: '-12px', filter: 'drop-shadow(0 0 60px rgba(255,255,255,0.15))', fontStyle: 'italic' }}>
                  {score.p1}:{score.ai}
                </div>
                <button className="btn-mega" onClick={handleAction} style={{ marginTop: '50px' }}>
                  Recalibrate
                  <span style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '3px' }}>[ CLICK OR SPACEBAR ]</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ opacity: 0.8, fontSize: '12px', letterSpacing: '8px', fontWeight: '900', color: '#facc15', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
          Nova Strike // Arcade Edition // v5.1.0-Enhanced
        </div>
        <div style={{ display: 'flex', gap: '40px', opacity: 0.4, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 700 }}>
          <span>&lt; MOUSE &gt; NAVIGATION</span>
          <span>&lt; ENERGY &gt; ACCUMULATE</span>
          <span>&lt; SPACE &gt; INITIALIZE</span>
        </div>
      </div>
    </div>
  );
}
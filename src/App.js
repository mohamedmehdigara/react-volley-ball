import React, { useState, useEffect, useCallback, useRef } from 'react';

/** --- GLOBAL CONSTANTS --- **/
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const NET_X = 400;
const GROUND_Y = 440;
const PLAYER_SIZE = 68;
const BALL_SIZE = 22;
const GRAVITY = 0.42;
const FRICTION = 0.995;
const WINNING_SCORE = 11;
const POWER_MAX = 100;
const TERMINAL_VELOCITY = 28;

/** --- STYLES --- **/
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');

  @keyframes energy-flow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes shake-ui {
    0%, 100% { transform: translate(0,0); }
    25% { transform: translate(-2px, 2px); }
    75% { transform: translate(2px, -2px); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.3; transform: scale(1); filter: blur(8px); }
    50% { opacity: 0.6; transform: scale(1.15); filter: blur(12px); }
  }
  @keyframes floating {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .game-root {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; background: #020617; font-family: 'Outfit', sans-serif;
    color: white; margin: 0; overflow: hidden; user-select: none;
    background-image: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%);
  }
  .arena-viewport {
    perspective: 1200px; padding: 20px;
  }
  .court-frame {
    position: relative; padding: 12px; background: #1e293b; border-radius: 44px;
    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.9), inset 0 0 40px rgba(255,255,255,0.02);
    transform-style: preserve-3d; transition: transform 0.1s ease-out;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .court-surface {
    position: relative; width: ${COURT_WIDTH}px; height: ${COURT_HEIGHT}px;
    background: #020617;
    border-radius: 36px; overflow: hidden; cursor: none;
    border: 2px solid rgba(255,255,255,0.05);
  }
  .court-surface.super-active {
    filter: contrast(1.2) brightness(1.1);
    box-shadow: inset 0 0 150px rgba(244, 63, 94, 0.4);
  }
  .grid-overlay {
    position: absolute; inset: 0;
    background-image: 
      linear-gradient(rgba(34, 211, 238, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34, 211, 238, 0.08) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
    mask-image: radial-gradient(circle at center, black, transparent 80%);
  }
  .score-card {
    position: relative; background: rgba(15, 23, 42, 0.9); border: 1px solid #334155;
    padding: 16px 24px; border-radius: 24px; min-width: 150px; text-align: center;
    backdrop-filter: blur(20px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .score-card.overload {
    animation: shake-ui 0.1s infinite;
    border-color: #facc15; box-shadow: 0 0 50px rgba(250, 204, 21, 0.3);
  }
  .energy-bar {
    width: 100%; height: 6px; background: rgba(0,0,0,0.6); border-radius: 10px;
    margin-top: 12px; overflow: hidden; position: relative;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .energy-fill {
    height: 100%; transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .energy-fill.charged {
    background: linear-gradient(90deg, #fff, #facc15, #fff);
    background-size: 200% 100%; animation: energy-flow 1s linear infinite;
  }
  .shockwave {
    position: absolute; border: 4px solid white; border-radius: 50%;
    pointer-events: none; animation: shock-out 0.8s cubic-bezier(0.1, 0, 0, 1) forwards;
  }
  @keyframes shock-out {
    0% { transform: scale(0); opacity: 1; border-width: 30px; }
    100% { transform: scale(15); opacity: 0; border-width: 0px; }
  }
  .impact-flash {
    position: absolute; inset: 0; background: white; z-index: 200;
    pointer-events: none; opacity: 0; mix-blend-mode: overlay; transition: opacity 0.05s;
  }
  .impact-flash.active { opacity: 0.8; }
  .overlay {
    position: absolute; inset: 0; background: rgba(2, 6, 23, 0.92);
    backdrop-filter: blur(20px); z-index: 300; display: flex; 
    flex-direction: column; align-items: center; justify-content: center;
  }
  .btn-mega {
    background: #fff; color: #000; border: none; padding: 22px 64px;
    font-size: 24px; font-weight: 900; border-radius: 20px; cursor: pointer;
    text-transform: uppercase; letter-spacing: 6px; transition: all 0.25s;
    box-shadow: 0 15px 50px rgba(255,255,255,0.15);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .btn-mega:hover { transform: translateY(-5px) scale(1.02); background: #facc15; box-shadow: 0 20px 60px rgba(250,204,21,0.3); }
  .btn-mega:active { transform: translateY(0) scale(0.96); }
  .scanlines {
    position: absolute; inset: 0; pointer-events: none; z-index: 500;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%),
                linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
    background-size: 100% 3px, 3px 100%;
    opacity: 0.4;
  }
  .chromatic-aberration {
    position: absolute; inset: 0; pointer-events: none; z-index: 490;
    mix-blend-mode: screen; opacity: 0; transition: opacity 0.3s;
    background: radial-gradient(circle, transparent, rgba(244, 63, 94, 0.2));
  }
  .chromatic-aberration.active { opacity: 1; }
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
    hit: () => playSound(440, 'triangle', 0.1, 0.05, 100),
    score: () => {
      playSound(150, 'sawtooth', 0.6, 0.1, 40);
      playSound(600, 'sine', 0.4, 0.08, 900);
    },
    superHit: () => {
        playSound(60, 'square', 0.8, 0.3, 10);
        playSound(1200, 'sine', 0.5, 0.15, 20);
    },
    click: () => playSound(800, 'sine', 0.05, 0.05, 300)
  };
};

/** --- HELPER COMPONENTS --- **/

const BallTrail = ({ trail, isSuper }) => (
  <>
    {trail.map((t, i) => (
      <div key={i} style={{
        position: 'absolute',
        width: BALL_SIZE * (1.2 - i / trail.length),
        height: BALL_SIZE * (1.2 - i / trail.length),
        left: t.x - (BALL_SIZE * (1.2 - i / trail.length)) / 2,
        top: t.y - (BALL_SIZE * (1.2 - i / trail.length)) / 2,
        background: isSuper ? `rgba(244, 63, 94, ${0.8 - i / trail.length})` : `rgba(34, 211, 238, ${0.6 - i / trail.length})`,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 45,
        filter: `blur(${isSuper ? 8 : 3}px)`,
        opacity: (1 - i / trail.length) * 0.8
      }} />
    ))}
  </>
);

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
      transition: 'transform 0.06s cubic-bezier(0.1, 0.9, 0.2, 1.2)'
    }}>
      <div style={{ 
        fontSize: '10px', fontWeight: '900', color, marginBottom: '6px', 
        letterSpacing: '4px', textShadow: isCharged ? `0 0 10px ${color}` : 'none',
        opacity: 0.9, whiteSpace: 'nowrap'
      }}>
        {label}
      </div>
      <div style={{ 
        width: '100%', height: '100%', borderRadius: '22px',
        background: isCharged 
            ? `linear-gradient(135deg, ${color}, #fff, ${color})` 
            : `linear-gradient(135deg, ${color} 0%, #0f172a 100%)`,
        boxShadow: isCharged 
            ? `0 0 60px ${color}, inset 0 0 20px rgba(255,255,255,0.8)` 
            : `0 20px 40px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.1)`,
        border: `3px solid ${isCharged ? '#fff' : 'rgba(255,255,255,0.15)'}`,
        display: 'flex', justifyContent: 'center', gap: '10px', paddingTop: '16px',
        animation: isCharged ? 'shake-ui 0.1s infinite' : 'none'
      }}>
        <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#000', borderRadius: '50%', left: 3 + eyeX, top: 3 + eyeY }} />
        </div>
        <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#000', borderRadius: '50%', left: 3 + eyeX, top: 3 + eyeY }} />
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

  const triggerImpact = (x, y, type = 'normal', intensity = 1) => {
    const isPower = type === 'super';
    if (isPower) sounds.superHit(); else sounds.hit();
    
    const newShock = { id: Math.random(), x, y, color: isPower ? '#f43f5e' : '#fff' };
    setShocks(s => [...s, newShock]);
    setTimeout(() => setShocks(s => s.filter(item => item.id !== newShock.id)), 800);

    const pCount = isPower ? 70 : 15;
    const newParticles = Array.from({ length: pCount }).map(() => ({
      id: Math.random(), x, y,
      vx: (Math.random() - 0.5) * (isPower ? 60 : 25) * intensity,
      vy: (Math.random() - 0.8) * (isPower ? 60 : 25) * intensity,
      life: 1.0,
      size: Math.random() * (isPower ? 8 : 4) + 2,
      color: isPower ? '#f43f5e' : (Math.random() > 0.6 ? '#22d3ee' : '#facc15')
    }));
    setFx(prev => [...prev, ...newParticles].slice(-300));

    setShake(isPower ? 50 : 10 * intensity);
    if (isPower) {
      setFlash(true);
      setTimeout(() => setFlash(false), 100);
    }
    setTimeout(() => setShake(0), 150);
  };

  const update = useCallback((time) => {
    if (gameState !== 'PLAYING') {
        requestRef.current = requestAnimationFrame(update);
        return;
    }

    const b = ball.current;
    
    // Smooth Pilot Movement
    p1.current.prevX = p1.current.x;
    p1.current.x += (mousePos.current - p1.current.x) * 0.45;
    p1.current.x = Math.max(70, Math.min(NET_X - 60, p1.current.x));
    const p1Speed = p1.current.x - p1.current.prevX;

    // Advanced AI Logic (Prediction + Difficulty Scaling)
    if (b.vx > 0) {
      // Calculate landing point based on gravity: y = y0 + vy*t + 0.5*g*t^2
      // For simplicity, we use a lighter version of physics prediction
      const distToAI = ai.current.x - b.x;
      const timeToReach = Math.max(0.1, distToAI / Math.max(0.1, b.vx));
      const predictedY = b.y + (b.vy * timeToReach) + (0.5 * GRAVITY * timeToReach * timeToReach);
      
      // If ball is low or heading down, prioritize movement
      const aiDifficulty = Math.min(0.9, 0.4 + (rally * 0.02));
      ai.current.targetX = b.x + (b.vx * (20 - aiDifficulty * 10)); 
    } else {
      // Return to defensive position
      ai.current.targetX = 650 + Math.sin(time / 500) * 80; 
    }

    ai.current.prevX = ai.current.x;
    const aiEase = 0.25 + (rally * 0.008);
    ai.current.x += (ai.current.targetX - ai.current.x) * Math.min(0.5, aiEase);
    ai.current.x = Math.max(NET_X + 60, Math.min(COURT_WIDTH - 70, ai.current.x));
    const aiSpeed = ai.current.x - ai.current.prevX;

    // Physics Engine
    b.vy += GRAVITY;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= FRICTION;
    
    // Velocity Capping
    const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
    if (speed > TERMINAL_VELOCITY) {
      b.vx = (b.vx / speed) * TERMINAL_VELOCITY;
      b.vy = (b.vy / speed) * TERMINAL_VELOCITY;
    }

    // Trail Management
    b.trail.unshift({ x: b.x, y: b.y });
    if (b.trail.length > 20) b.trail.pop();

    // Boundary Collisions
    if (b.x < BALL_SIZE/2 || b.x > COURT_WIDTH - BALL_SIZE/2) {
      b.vx *= -0.9;
      b.x = b.x < BALL_SIZE/2 ? BALL_SIZE/2 : COURT_WIDTH - BALL_SIZE/2;
      triggerImpact(b.x, b.y, 'normal', 0.5);
    }
    if (b.y < BALL_SIZE/2) {
        b.vy *= -0.85;
        b.y = BALL_SIZE/2;
        triggerImpact(b.x, b.y, 'normal', 0.5);
    }

    // Net Physics
    if (Math.abs(b.x - NET_X) < (BALL_SIZE/2 + 10) && b.y > GROUND_Y - 140) {
      b.vx *= -0.8;
      b.x = b.x < NET_X ? NET_X - 25 : NET_X + 25;
      triggerImpact(b.x, b.y);
    }

    // Paddle Collision
    const resolvePaddleHit = (px, side, paddleSpeed) => {
      const py = GROUND_Y - PLAYER_SIZE/2;
      const dx = b.x - px;
      const dy = b.y - py;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < (BALL_SIZE + PLAYER_SIZE)/2 + 4) {
        let launchForce = 18 + (rally * 0.4);
        const spinEffect = paddleSpeed * 0.5;
        
        // Use functional state updates to avoid closure issues
        setEnergy(prev => {
          const currentEnergy = prev[side];
          if (currentEnergy >= POWER_MAX) {
            launchForce *= 1.8;
            setIsSuper(true);
            triggerImpact(b.x, b.y, 'super');
            return { ...prev, [side]: 0 };
          } else {
            setIsSuper(false);
            triggerImpact(b.x, b.y, 'normal', 1.2);
            return { ...prev, [side]: Math.min(POWER_MAX, currentEnergy + 20) };
          }
        });

        const angle = Math.atan2(dy, dx);
        b.vx = Math.cos(angle) * launchForce + spinEffect;
        b.vy = Math.min(Math.sin(angle) * launchForce, -14); 

        // Extraction to prevent sticking
        const correction = (BALL_SIZE + PLAYER_SIZE)/2 + 15;
        b.x = px + Math.cos(angle) * correction;
        b.y = py + Math.sin(angle) * correction;

        setRally(r => r + 1);
        setHitting(h => ({ ...h, [side]: true }));
        setTimeout(() => setHitting(h => ({ ...h, [side]: false })), 80);
      }
    };

    resolvePaddleHit(p1.current.x, 'p1', p1Speed);
    resolvePaddleHit(ai.current.x, 'ai', aiSpeed);

    // Scoring Sequence
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
            ball.current = { x: p1Scored ? 200 : 600, y: 150, vx: p1Scored ? 9 : -9, vy: 0, trail: [] };
            setGameState('PLAYING');
          }, 1500);
        }
        return newScore;
      });

      setRally(0);
      setEnergy({ p1: 0, ai: 0 });
      setIsSuper(false);
      triggerImpact(b.x, b.y, 'super');
      return;
    }

    // Particle Lifecycle
    setFx(prev => prev.map(p => ({ 
      ...p, 
      x: p.x + p.vx, 
      y: p.y + p.vy, 
      vy: p.vy + 0.6, 
      life: p.life - 0.035 
    })).filter(p => p.life > 0));

    // Update rendering state once per loop
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
      <div className={`chromatic-aberration ${isSuper ? 'active' : ''}`} />
      
      {/* HUD SECTION */}
      <div style={{ display: 'flex', gap: '50px', marginBottom: '25px', alignItems: 'center', zIndex: 10 }}>
        <div className={`score-card ${energy.p1 >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '10px', color: '#22d3ee', fontWeight: '900', letterSpacing: '4px' }}>PILOT.NODE</div>
          <div style={{ fontSize: '72px', fontWeight: '900', lineHeight: 1, margin: '5px 0', color: '#fff' }}>{score.p1}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.p1 >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.p1}%`, background: '#22d3ee', boxShadow: energy.p1 >= POWER_MAX ? '0 0 15px #22d3ee' : 'none' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '240px' }}>
          <h1 style={{ margin: 0, fontStyle: 'italic', fontSize: '52px', fontWeight: 900, color: '#facc15', textShadow: '0 0 30px rgba(250,204,21,0.5)', letterSpacing: '-2px' }}>NOVA STRIKE</h1>
          <div style={{ fontSize: '12px', opacity: 0.9, letterSpacing: '6px', fontWeight: 'bold', color: isSuper ? '#f43f5e' : '#64748b', marginTop: '4px' }}>
            {isSuper ? '!! OVERDRIVE CALIBRATED !!' : `RALLY CHAIN x ${rally}`}
          </div>
        </div>

        <div className={`score-card ${energy.ai >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: '900', letterSpacing: '4px' }}>TITAN.CORE</div>
          <div style={{ fontSize: '72px', fontWeight: '900', lineHeight: 1, margin: '5px 0', color: '#fff' }}>{score.ai}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.ai >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.ai}%`, background: '#f43f5e', boxShadow: energy.ai >= POWER_MAX ? '0 0 15px #f43f5e' : 'none' }} />
          </div>
        </div>
      </div>

      <div className="arena-viewport">
        <div className={`court-frame ${isSuper ? 'super-active' : ''}`} style={{ 
          transform: `rotateX(20deg) rotateY(${(render.p1 - 400) * 0.025}deg) translate(${Math.random()*shake}px, ${Math.random()*shake}px)` 
        }}>
          <div className="court-surface" onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            mousePos.current = e.clientX - rect.left;
          }}>
            <div className={`impact-flash ${flash ? 'active' : ''}`} />
            <div className="grid-overlay" />
            
            {/* Dynamic Ambient Lighting */}
            <div style={{ 
                position: 'absolute', 
                left: render.ball.x - 300, 
                top: render.ball.y - 300, 
                width: 600, height: 600, 
                borderRadius: '50%', 
                background: `radial-gradient(circle, ${isSuper ? 'rgba(244,63,94,0.35)' : 'rgba(34,211,238,0.2)'} 0%, transparent 70%)`, 
                pointerEvents: 'none', zIndex: 10 
            }} />
            
            {/* Environment Details */}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: 60, background: 'linear-gradient(to bottom, #111827, #020617)', borderTop: '2px solid rgba(59, 130, 246, 0.2)' }}>
               <div style={{ position: 'absolute', top: 0, width: '100%', height: '100%', opacity: 0.03, background: 'repeating-linear-gradient(90deg, #fff, #fff 40px, transparent 40px, transparent 80px)' }} />
            </div>
            
            <div style={{ 
                position: 'absolute', left: NET_X - 5, bottom: 60, width: 10, height: 140, 
                background: 'linear-gradient(to top, #1e293b, #facc15)', 
                boxShadow: '0 0 30px rgba(250,204,21,0.3)', 
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 0',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {[...Array(8)].map((_, i) => <div key={i} style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.3)' }} />)}
            </div>

            {/* Effects Layer */}
            {shocks.map(s => <div key={s.id} className="shockwave" style={{ left: s.x - 50, top: s.y - 50, width: 100, height: 100, borderColor: s.color }} />)}
            {fx.map(p => (
                <div key={p.id} style={{ 
                    position: 'absolute', left: p.x, top: p.y, 
                    width: p.size, height: p.size, 
                    background: p.color, borderRadius: '2px', 
                    opacity: p.life, pointerEvents: 'none', zIndex: 60, 
                    transform: `scale(${p.life * 2.5}) rotate(${p.life * 360}deg)`, 
                    boxShadow: `0 0 15px ${p.color}` 
                }} />
            ))}
            
            {/* Dynamic Ball Shadow */}
            <div style={{ 
                position: 'absolute', width: 60, height: 12, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', bottom: 54, pointerEvents: 'none', filter: 'blur(8px)',
                left: render.ball.x - 30, 
                opacity: Math.max(0, 0.9 * (1 - (render.ball.y / GROUND_Y))), 
                transform: `scale(${0.4 + (render.ball.y/GROUND_Y)})` 
            }} />
            
            <BallTrail trail={render.ball.trail} isSuper={isSuper} />
            
            {/* The Ball */}
            <div style={{ 
                position: 'absolute', 
                left: render.ball.x - BALL_SIZE/2, 
                top: render.ball.y - BALL_SIZE/2, 
                width: BALL_SIZE, height: BALL_SIZE, 
                borderRadius: '50%', 
                zIndex: 100, 
                background: isSuper ? '#fff' : '#facc15', 
                boxShadow: isSuper 
                    ? '0 0 50px #f43f5e, 0 0 100px rgba(244,63,94,0.6)' 
                    : '0 0 30px rgba(250, 204, 21, 0.8), inset 0 -4px 8px rgba(0,0,0,0.3)', 
                border: `2px solid ${isSuper ? '#fff' : '#78350f'}`, 
                transform: `
                    scale(${1 + Math.abs(render.ball.vx)*0.035}, ${1 - Math.abs(render.ball.vy)*0.025}) 
                    rotate(${render.ball.x * 3}deg)
                `, 
                transition: 'transform 0.04s linear' 
            }}>
              <div style={{ position: 'absolute', top: '10%', left: '15%', width: '40%', height: '40%', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', filter: 'blur(2px)' }} />
            </div>

            {/* Players */}
            <Player x={render.p1} color="#22d3ee" label="P1.PILOT" hitting={hitting.p1} energy={energy.p1} ballPos={render.ball} />
            <Player x={render.ai} color="#f43f5e" label="AI.CORE" hitting={hitting.ai} energy={energy.ai} ballPos={render.ball} />

            {/* State Overlays */}
            {gameState === 'START' && (
              <div className="overlay">
                <div style={{ marginBottom: '50px', textAlign: 'center', animation: 'floating 4s ease-in-out infinite' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '14px', opacity: 0.8, color: '#22d3ee', fontWeight: 900 }}>NEURAL INTERFACE ACTIVE</div>
                  <h2 style={{ fontSize: '110px', fontWeight: '900', letterSpacing: '-6px', fontStyle: 'italic', margin: '15px 0', textShadow: '0 0 60px rgba(255,255,255,0.2)' }}>NOVA STRIKE</h2>
                  <div style={{ height: '4px', background: 'linear-gradient(90deg, transparent, #facc15, transparent)', width: '100%' }} />
                </div>
                <button className="btn-mega" onClick={handleAction}>
                  Establish Link
                  <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', fontWeight: 400 }}>[ CLICK OR SPACEBAR ]</span>
                </button>
                <div style={{ marginTop: '50px', opacity: 0.4, fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 30px', borderRadius: '40px', letterSpacing: '3px' }}>
                  HIGH SCORE ARCHIVE: {highScore}
                </div>
              </div>
            )}

            {gameState === 'ROUND_END' && (
              <div className="overlay" style={{ background: 'rgba(2,6,23,0.4)', backdropFilter: 'blur(5px)' }}>
                <h2 style={{ fontSize: '140px', fontWeight: '900', color: '#facc15', textShadow: '0 0 100px rgba(250,204,21,1)', fontStyle: 'italic', transform: 'rotate(-4deg)', animation: 'shake-ui 0.1s infinite' }}>GOAL</h2>
              </div>
            )}

            {gameState === 'GAME_OVER' && (
              <div className="overlay">
                <h1 style={{ fontSize: '24px', letterSpacing: '15px', color: score.p1 > score.ai ? '#22d3ee' : '#f43f5e', fontWeight: 900, textTransform: 'uppercase', marginBottom: '20px' }}>
                  {score.p1 > score.ai ? '>> MISSION SUCCESS <<' : '>> SYSTEM FAILURE <<'}
                </h1>
                <div style={{ fontSize: '180px', fontWeight: '900', margin: '-30px 0', letterSpacing: '-10px', filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.1))' }}>{score.p1}:{score.ai}</div>
                <button className="btn-mega" onClick={handleAction} style={{ marginTop: '40px' }}>
                  Recalibrate
                  <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px' }}>[ CLICK OR SPACEBAR ]</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div style={{ marginTop: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ opacity: 0.7, fontSize: '11px', letterSpacing: '6px', fontWeight: '900', color: '#facc15', textTransform: 'uppercase' }}>
          Nova Strike // Arcade Edition // v4.3.0-Production
        </div>
        <div style={{ display: 'flex', gap: '30px', opacity: 0.3, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700 }}>
          <span>&lt; MOUSE &gt; NAVIGATION</span>
          <span>&lt; ENERGY &gt; ACCUMULATE</span>
          <span>&lt; SPACE &gt; INITIALIZE</span>
        </div>
      </div>
    </div>
  );
}
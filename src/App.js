import React, { useState, useEffect, useCallback, useRef } from 'react';

/** --- GLOBAL CONSTANTS --- **/
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const NET_X = 400;
const GROUND_Y = 440;
const PLAYER_SIZE = 68; 
const BALL_SIZE = 22;
const GRAVITY = 0.38;
const FRICTION = 0.994;
const WINNING_SCORE = 11;
const POWER_MAX = 100;
const TERMINAL_VELOCITY = 28;

/** --- STYLES --- **/
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;900&display=swap');

  @keyframes energy-flow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes shake-ui {
    0%, 100% { transform: translate(0,0); }
    25% { transform: translate(-3px, 2px); }
    75% { transform: translate(3px, -2px); }
  }
  .game-root {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; background: #020617; font-family: 'Outfit', sans-serif;
    color: white; margin: 0; overflow: hidden; user-select: none;
  }
  .arena-viewport {
    perspective: 1200px; padding: 20px;
  }
  .court-frame {
    position: relative; padding: 12px; background: #1e293b; border-radius: 44px;
    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.05);
    transform-style: preserve-3d; transition: transform 0.15s ease-out;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .court-surface {
    position: relative; width: ${COURT_WIDTH}px; height: ${COURT_HEIGHT}px;
    background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
    border-radius: 36px; overflow: hidden; cursor: crosshair;
    border: 2px solid rgba(255,255,255,0.05);
  }
  .grid-overlay {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px);
    background-size: 50px 50px; pointer-events: none;
  }
  .score-card {
    position: relative; background: rgba(15, 23, 42, 0.8); border: 1px solid #334155;
    padding: 12px 20px; border-radius: 20px; min-width: 130px; text-align: center;
    backdrop-filter: blur(12px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .score-card.overload {
    animation: shake-ui 0.1s infinite;
    border-color: #facc15; box-shadow: 0 0 40px rgba(250, 204, 21, 0.3);
  }
  .energy-bar {
    width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px;
    margin-top: 8px; overflow: hidden; position: relative;
  }
  .energy-fill {
    height: 100%; transition: width 0.3s ease-out;
  }
  .energy-fill.charged {
    background: linear-gradient(90deg, #facc15, #fff, #facc15);
    background-size: 200% 100%; animation: energy-flow 0.8s linear infinite;
  }
  .shockwave {
    position: absolute; border: 2px solid white; border-radius: 50%;
    pointer-events: none; animation: shock-out 0.5s cubic-bezier(0, 0, 0.2, 1) forwards;
  }
  @keyframes shock-out {
    0% { transform: scale(0); opacity: 1; border-width: 12px; }
    100% { transform: scale(8); opacity: 0; border-width: 1px; }
  }
  .impact-flash {
    position: absolute; inset: 0; background: white; z-index: 200;
    pointer-events: none; opacity: 0; mix-blend-mode: overlay; transition: opacity 0.1s;
  }
  .impact-flash.active { opacity: 0.6; }
  .overlay {
    position: absolute; inset: 0; background: rgba(2, 6, 23, 0.92);
    backdrop-filter: blur(10px); z-index: 300; display: flex; 
    flex-direction: column; align-items: center; justify-content: center;
  }
  .btn-mega {
    background: #fff; color: #000; border: none; padding: 18px 50px;
    font-size: 20px; font-weight: 900; border-radius: 14px; cursor: pointer;
    text-transform: uppercase; letter-spacing: 3px; transition: all 0.2s;
    box-shadow: 0 10px 30px rgba(255,255,255,0.2);
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .btn-mega:hover { transform: translateY(-3px) scale(1.02); background: #facc15; }
  .btn-mega span.key-hint {
    font-size: 10px; opacity: 0.6; font-weight: 400;
  }
  .ball-shadow {
    position: absolute; width: 40px; height: 12px; background: rgba(0,0,0,0.5);
    border-radius: 50%; bottom: 60px; pointer-events: none; filter: blur(6px);
  }
`;

/** --- AUDIO ENGINE --- **/
const useAudio = () => {
  const audioCtx = useRef(null);
  const playSound = (freq, type = 'sine', duration = 0.1, vol = 0.1) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.current.currentTime + duration);
    gain.gain.setValueAtTime(vol, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start();
    osc.stop(audioCtx.current.currentTime + duration);
  };
  return { 
    hit: () => playSound(400, 'square', 0.15, 0.05),
    score: () => playSound(800, 'sawtooth', 0.4, 0.08),
    superHit: () => playSound(150, 'triangle', 0.5, 0.15),
    click: () => playSound(1000, 'sine', 0.05, 0.03)
  };
};

/** --- HELPER COMPONENTS --- **/

const BallTrail = ({ trail, isSuper }) => (
  <>
    {trail.map((t, i) => (
      <div key={i} style={{
        position: 'absolute',
        width: BALL_SIZE * (1 - i / trail.length),
        height: BALL_SIZE * (1 - i / trail.length),
        left: t.x - (BALL_SIZE * (1 - i / trail.length)) / 2,
        top: t.y - (BALL_SIZE * (1 - i / trail.length)) / 2,
        background: isSuper ? `rgba(244, 63, 94, ${0.5 - i / 20})` : `rgba(34, 211, 238, ${0.4 - i / 20})`,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 45,
        filter: isSuper ? 'blur(2px)' : 'none'
      }} />
    ))}
  </>
);

const Player = ({ x, color, label, hitting, energy, ballPos }) => {
  const isCharged = energy >= POWER_MAX;
  const eyeX = Math.max(-4, Math.min(4, (ballPos.x - x) * 0.08));
  const eyeY = Math.max(-4, Math.min(4, (ballPos.y - (GROUND_Y - PLAYER_SIZE)) * 0.08));

  return (
    <div style={{ 
      position: 'absolute', left: x - PLAYER_SIZE / 2, top: GROUND_Y - PLAYER_SIZE,
      width: PLAYER_SIZE, height: PLAYER_SIZE, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: hitting ? 'scale(1.3, 0.75)' : 'scale(1)',
      transition: 'transform 0.08s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      <div style={{ 
        fontSize: '11px', fontWeight: '900', color, marginBottom: '4px', 
        letterSpacing: '2px', textShadow: isCharged ? `0 0 10px ${color}` : 'none' 
      }}>{label}</div>
      <div style={{ 
        width: '100%', height: '100%', borderRadius: '22px',
        background: `linear-gradient(135deg, ${color}, #000 80%)`,
        boxShadow: isCharged ? `0 0 50px ${color}, inset 0 0 20px rgba(255,255,255,0.4)` : '0 20px 40px rgba(0,0,0,0.6)',
        border: '3px solid rgba(255,255,255,0.2)',
        display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '14px'
      }}>
        <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '6px', height: '6px', background: '#000', borderRadius: '50%', left: 3 + eyeX, top: 3 + eyeY }} />
        </div>
        <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '6px', height: '6px', background: '#000', borderRadius: '50%', left: 3 + eyeX, top: 3 + eyeY }} />
        </div>
      </div>
    </div>
  );
};

/** --- MAIN GAME --- **/

export default function App() {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState({ p1: 0, ai: 0 });
  const [rally, setRally] = useState(0);
  const [energy, setEnergy] = useState({ p1: 0, ai: 0 });
  const [isSuper, setIsSuper] = useState(false);
  const [shake, setShake] = useState(0);
  const [hitting, setHitting] = useState({ p1: false, ai: false });
  const [fx, setFx] = useState([]); 
  const [shocks, setShocks] = useState([]); 
  const [flash, setFlash] = useState(false);
  const sounds = useAudio();

  const ball = useRef({ x: 200, y: 150, vx: 7, vy: 0, trail: [] });
  const p1 = useRef({ x: 150, prevX: 150 });
  const ai = useRef({ x: 650, prevX: 650 });
  const mouseX = useRef(150);
  const requestRef = useRef();

  const [render, setRender] = useState({
    ball: { x: 200, y: 150, vy: 0, vx: 0, trail: [] },
    p1: 150, ai: 650
  });

  // Action: Handle starting or restarting logic
  const handleAction = useCallback(() => {
    if (gameState === 'START' || gameState === 'GAME_OVER') {
      sounds.click();
      setScore({ p1: 0, ai: 0 });
      setEnergy({ p1: 0, ai: 0 });
      setRally(0);
      ball.current = { x: 200, y: 150, vx: 7, vy: 0, trail: [] };
      setGameState('PLAYING');
    }
  }, [gameState, sounds]);

  // Space listener
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

  const triggerImpact = (x, y, type = 'normal') => {
    const isPower = type === 'super';
    if (isPower) sounds.superHit(); else sounds.hit();
    
    const newShock = { id: Math.random(), x, y, color: isPower ? '#f43f5e' : '#fff' };
    setShocks(s => [...s, newShock]);
    setTimeout(() => setShocks(s => s.filter(item => item.id !== newShock.id)), 600);

    const pCount = isPower ? 35 : 12;
    const newParticles = Array.from({ length: pCount }).map(() => ({
      id: Math.random(), x, y,
      vx: (Math.random() - 0.5) * (isPower ? 40 : 15),
      vy: (Math.random() - 0.8) * (isPower ? 40 : 15),
      life: 1.0,
      color: isPower ? '#f43f5e' : (Math.random() > 0.5 ? '#22d3ee' : '#fff')
    }));
    setFx(prev => [...prev, ...newParticles].slice(-120));

    setShake(isPower ? 25 : 8);
    if (isPower) {
      setFlash(true);
      setTimeout(() => setFlash(false), 100);
    }
    setTimeout(() => setShake(0), 150);
  };

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    const b = ball.current;
    p1.current.prevX = p1.current.x;
    p1.current.x += (mouseX.current - p1.current.x) * 0.45;
    p1.current.x = Math.max(50, Math.min(NET_X - 50, p1.current.x));
    const p1Speed = p1.current.x - p1.current.prevX;

    const diffBias = 0.12 + (score.p1 * 0.012) + (rally * 0.005);
    const aiTarget = (b.vx > 0) ? b.x + (b.vx * 4.2) : 680;
    ai.current.prevX = ai.current.x;
    ai.current.x += (aiTarget - ai.current.x) * Math.min(0.25, diffBias);
    ai.current.x = Math.max(NET_X + 50, Math.min(COURT_WIDTH - 50, ai.current.x));
    const aiSpeed = ai.current.x - ai.current.prevX;

    b.vy += GRAVITY;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= FRICTION;
    
    const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
    if (speed > TERMINAL_VELOCITY) {
      const scale = TERMINAL_VELOCITY / speed;
      b.vx *= scale;
      b.vy *= scale;
    }

    b.trail.unshift({ x: b.x, y: b.y });
    if (b.trail.length > 15) b.trail.pop();

    if (b.x < BALL_SIZE/2 || b.x > COURT_WIDTH - BALL_SIZE/2) {
      b.vx *= -0.85;
      b.x = b.x < BALL_SIZE/2 ? BALL_SIZE/2 : COURT_WIDTH - BALL_SIZE/2;
      triggerImpact(b.x, b.y);
    }
    if (b.y < BALL_SIZE/2) {
        b.vy *= -0.85;
        b.y = BALL_SIZE/2;
        triggerImpact(b.x, b.y);
    }

    if (Math.abs(b.x - NET_X) < (BALL_SIZE/2 + 8) && b.y > GROUND_Y - 140) {
      b.vx *= -0.65;
      b.x = b.x < NET_X ? NET_X - 20 : NET_X + 20;
      triggerImpact(b.x, b.y);
    }

    const checkHit = (px, side, paddleSpeed) => {
      const py = GROUND_Y - PLAYER_SIZE/2;
      const dx = b.x - px;
      const dy = b.y - py;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < (BALL_SIZE + PLAYER_SIZE)/2 + 2) {
        let force = 16.5 + (rally * 0.4);
        force += Math.abs(paddleSpeed) * 0.45;
        
        if (energy[side] >= POWER_MAX) {
          force *= 1.8;
          setIsSuper(true);
          triggerImpact(b.x, b.y, 'super');
          setEnergy(prev => ({ ...prev, [side]: 0 }));
        } else {
          setIsSuper(false);
          setEnergy(prev => ({ ...prev, [side]: Math.min(POWER_MAX, prev[side] + 25) }));
          triggerImpact(b.x, b.y);
        }

        const angle = Math.atan2(dy, dx);
        b.vx = Math.cos(angle) * force;
        b.vy = Math.min(Math.sin(angle) * force, -14);
        const pushDist = (BALL_SIZE + PLAYER_SIZE)/2 + 6;
        b.x = px + Math.cos(angle) * pushDist;
        b.y = py + Math.sin(angle) * pushDist;

        setRally(r => r + 1);
        setHitting(h => ({ ...h, [side]: true }));
        setTimeout(() => setHitting(h => ({ ...h, [side]: false })), 100);
      }
    };

    checkHit(p1.current.x, 'p1', p1Speed);
    checkHit(ai.current.x, 'ai', aiSpeed);

    if (b.y > GROUND_Y - BALL_SIZE/2) {
      sounds.score();
      const p1Won = b.x > NET_X;
      const winnerKey = p1Won ? 'p1' : 'ai';
      const nextScore = { ...score, [winnerKey]: score[winnerKey] + 1 };
      
      setScore(nextScore);
      setRally(0);
      setEnergy({ p1: 0, ai: 0 });
      setIsSuper(false);
      triggerImpact(b.x, b.y, 'super');

      if (nextScore[winnerKey] >= WINNING_SCORE) {
        setGameState('GAME_OVER');
      } else {
        setGameState('ROUND_END');
        setTimeout(() => {
          ball.current = { x: p1Won ? 200 : 600, y: 150, vx: p1Won ? 8 : -8, vy: 0, trail: [] };
          setGameState('PLAYING');
        }, 1600);
      }
      return;
    }

    setFx(prev => prev.map(p => ({ 
      ...p, 
      x: p.x + p.vx, 
      y: p.y + p.vy, 
      vy: p.vy + 0.6, 
      life: p.life - 0.035 
    })).filter(p => p.life > 0));

    setRender({
      ball: { x: b.x, y: b.y, vy: b.vy, vx: b.vx, trail: [...b.trail] },
      p1: p1.current.x, ai: ai.current.x
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, score, rally, energy, sounds]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="game-root">
      <style>{styles}</style>
      
      <div style={{ display: 'flex', gap: '60px', marginBottom: '15px', alignItems: 'center', zIndex: 10 }}>
        <div className={`score-card ${energy.p1 >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '10px', color: '#22d3ee', fontWeight: '900', letterSpacing: '2px' }}>INTERCEPTOR</div>
          <div style={{ fontSize: '50px', fontWeight: '900', lineHeight: 1, margin: '5px 0' }}>{score.p1}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.p1 >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.p1}%`, background: '#22d3ee' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontStyle: 'italic', fontSize: '36px', fontWeight: 900, color: '#facc15', textShadow: '0 4px 15px rgba(250,204,21,0.4)' }}>NOVA STRIKE</h1>
          <div style={{ fontSize: '12px', opacity: 0.8, letterSpacing: '4px', fontWeight: 'bold' }}>COMBO x{rally}</div>
        </div>

        <div className={`score-card ${energy.ai >= POWER_MAX ? 'overload' : ''}`}>
          <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: '900', letterSpacing: '2px' }}>TITAN AI</div>
          <div style={{ fontSize: '50px', fontWeight: '900', lineHeight: 1, margin: '5px 0' }}>{score.ai}</div>
          <div className="energy-bar">
            <div className={`energy-fill ${energy.ai >= POWER_MAX ? 'charged' : ''}`} 
                 style={{ width: `${energy.ai}%`, background: '#f43f5e' }} />
          </div>
        </div>
      </div>

      <div className="arena-viewport">
        <div className="court-frame" style={{ 
          transform: `rotateX(12deg) rotateY(${(render.p1 - 400) * 0.015}deg) translate(${Math.random()*shake}px, ${Math.random()*shake}px)` 
        }}>
          <div className="court-surface" onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            mouseX.current = e.clientX - rect.left;
          }}>
            <div className={`impact-flash ${flash ? 'active' : ''}`} />
            <div className="grid-overlay" />
            <div style={{ position: 'absolute', left: render.ball.x - 250, top: render.ball.y - 250, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${isSuper ? 'rgba(244,63,94,0.2)' : 'rgba(34,211,238,0.12)'} 0%, transparent 75%)`, pointerEvents: 'none', zIndex: 10 }} />
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: 60, background: 'linear-gradient(to bottom, #1e293b, #0f172a)', borderTop: '3px solid rgba(59, 130, 246, 0.4)' }}>
              <div style={{ width: '100%', height: '100%', opacity: 0.05, background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 20px)' }} />
            </div>
            <div style={{ position: 'absolute', left: NET_X - 4, bottom: 60, width: 8, height: 140, background: 'linear-gradient(to top, #334155, #94a3b8)', boxShadow: '0 0 20px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.2)' }} />)}
            </div>

            {shocks.map(s => <div key={s.id} className="shockwave" style={{ left: s.x - 50, top: s.y - 50, width: 100, height: 100, borderColor: s.color }} />)}
            {fx.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x, top: p.y, width: 5, height: 5, background: p.color, borderRadius: '50%', opacity: p.life, pointerEvents: 'none', zIndex: 60, transform: `scale(${p.life * 2.5})`, boxShadow: `0 0 12px ${p.color}` }} />)}
            <div className="ball-shadow" style={{ left: render.ball.x - 20, opacity: 0.6 * (1 - (render.ball.y / GROUND_Y)), transform: `scale(${0.5 + (render.ball.y/GROUND_Y)})` }} />
            <BallTrail trail={render.ball.trail} isSuper={isSuper} />
            <div style={{ position: 'absolute', left: render.ball.x - BALL_SIZE/2, top: render.ball.y - BALL_SIZE/2, width: BALL_SIZE, height: BALL_SIZE, borderRadius: '50%', zIndex: 100, background: isSuper ? '#fff' : '#facc15', boxShadow: isSuper ? '0 0 45px #f43f5e, 0 0 90px rgba(244,63,94,0.6)' : '0 0 30px rgba(250, 204, 21, 0.7)', border: `2px solid ${isSuper ? '#fff' : '#854d0e'}`, transform: `scale(${1 + Math.abs(render.ball.vx)*0.035}, ${1 - Math.abs(render.ball.vy)*0.02}) rotate(${render.ball.x * 2}deg)`, transition: 'transform 0.05s linear' }}>
              <div style={{ position: 'absolute', top: '15%', left: '15%', width: '35%', height: '35%', background: 'white', borderRadius: '50%', opacity: 0.9 }} />
              <div style={{ position: 'absolute', top: '50%', width: '100%', height: '2px', background: 'rgba(0,0,0,0.15)', transform: 'rotate(45deg)' }} />
            </div>
            <Player x={render.p1} color="#22d3ee" label="P1" hitting={hitting.p1} energy={energy.p1} ballPos={render.ball} />
            <Player x={render.ai} color="#f43f5e" label="CPU" hitting={hitting.ai} energy={energy.ai} ballPos={render.ball} />

            {gameState === 'START' && (
              <div className="overlay">
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '80px', fontWeight: '900', letterSpacing: '-5px', fontStyle: 'italic', margin: 0 }}>NOVA STRIKE</h2>
                  <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #facc15, transparent)', width: '100%' }} />
                </div>
                <button className="btn-mega" onClick={handleAction}>
                  Authorize Sync
                  <span className="key-hint">Press [ SPACE ]</span>
                </button>
              </div>
            )}

            {gameState === 'ROUND_END' && (
              <div className="overlay" style={{ background: 'transparent', backdropFilter: 'none' }}>
                <h2 style={{ fontSize: '130px', fontWeight: '900', color: '#facc15', textShadow: '0 0 80px rgba(250,204,21,0.8)', fontStyle: 'italic', transform: 'rotate(-5deg)' }}>POINT!</h2>
              </div>
            )}

            {gameState === 'GAME_OVER' && (
              <div className="overlay">
                <h1 style={{ fontSize: '20px', letterSpacing: '12px', color: score.p1 > score.ai ? '#22d3ee' : '#f43f5e', fontWeight: 900 }}>
                  {score.p1 > score.ai ? 'SYSTEM STABILIZED' : 'CORE OVERLOAD'}
                </h1>
                <div style={{ fontSize: '160px', fontWeight: '900', margin: '-10px 0', letterSpacing: '-10px' }}>{score.p1}:{score.ai}</div>
                <button className="btn-mega" onClick={handleAction}>
                  Re-Initialize
                  <span className="key-hint">Press [ SPACE ]</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ opacity: 0.4, fontSize: '10px', letterSpacing: '6px', fontWeight: 'bold' }}>
          VER 2.6 // SPACE-SYNC ENABLED // [ 60 FPS ]
        </div>
      </div>
    </div>
  );
}
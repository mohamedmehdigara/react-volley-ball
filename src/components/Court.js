import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';

/** * --- THEME CONFIGURATION ---
 * High-fidelity styles for different environments
 */
const COURT_STYLES = {
  indoor: {
    background: 'linear-gradient(to bottom, #e5c08a, #bc8f4f)',
    texture: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 60px, rgba(255,255,255,0.01) 61px)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(40, 20, 0, 0.4)',
    accentColor: '#3b82f6',
    reflection: true,
    particles: 'rgba(255,255,255,0.1)',
    scuffs: true
  },
  gym: {
    background: 'linear-gradient(to bottom, #1e3a8a, #172554)',
    texture: 'none',
    lineColor: '#fbbf24',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    accentColor: '#f87171',
    reflection: true,
    particles: 'rgba(147, 197, 253, 0.2)',
    scuffs: false
  },
  beach: {
    background: 'linear-gradient(to bottom, #fef3c7, #f59e0b)',
    texture: 'radial-gradient(circle, #d97706 0.2px, transparent 0)',
    lineColor: '#f8fafc',
    shadowColor: 'rgba(120, 53, 15, 0.15)',
    accentColor: '#10b981',
    reflection: false,
    particles: 'rgba(251, 191, 36, 0.4)',
    scuffs: false
  }
};

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
        <div key={p.id} className="absolute rounded-full animate-float"
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
    <div style={{
      position: 'absolute',
      [side]: '-130px',
      top: '0%',
      height: '100%',
      width: '100px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      perspective: '1000px',
      filter: 'blur(0.5px)'
    }}>
      {[...Array(27)].map((_, i) => (
        <div key={i} 
          className={`transition-all duration-[400ms] ${mood === 'cheering' ? '-translate-y-4 scale-110' : 'translate-y-0'}`}
          style={{
            width: '18px',
            height: '24px',
            borderRadius: '40% 40% 6px 6px',
            backgroundColor: i % 4 === 0 ? '#0f172a' : (i % 4 === 1 ? '#1e293b' : (i % 4 === 2 ? '#334155' : '#475569')),
            boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.05)',
            transform: `translateZ(${Math.random() * 30}px)`,
            transitionDelay: `${(i % 5) * 40}ms`
          }} 
        />
      ))}
    </div>
  );
});

const Jumbotron = ({ score, gameStatus }) => (
  <div className="relative group mb-12 transform hover:scale-[1.02] transition-transform duration-500">
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
    <div className="relative flex flex-col items-center bg-slate-950/90 backdrop-blur-md px-12 py-6 rounded-xl border border-white/10 shadow-2xl">
      <div className="flex items-center gap-16">
        <div className="text-center">
          <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.4em] mb-2">Home</div>
          <div className="text-7xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            {score.p1.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-900">
            <div className={`text-xs font-black italic ${gameStatus === 'playing' ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
              {gameStatus === 'playing' ? 'LIVE' : 'PAUSE'}
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-rose-400 font-black uppercase tracking-[0.4em] mb-2">Visitor</div>
          <div className="text-7xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            {score.ai.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NetSystem = React.memo(({ netTop, accentColor, isShaking }) => (
  <div className={`absolute left-0 w-full z-40 ${isShaking ? 'animate-wiggle' : ''}`}
    style={{
      top: netTop - 12,
      height: '30px',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      backgroundImage: `
        repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(255,255,255,0.1) 12px, rgba(255,255,255,0.1) 13px),
        repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(255,255,255,0.1) 12px, rgba(255,255,255,0.1) 13px)
      `,
      borderTop: '6px solid #fff',
      borderBottom: '2px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    }}>
    {['-20px', 'calc(100% + 5px)'].map((pos, idx) => (
      <div key={idx} className="absolute bottom-[-140px] w-4 h-[220px] rounded-full z-50 shadow-2xl"
        style={{ left: pos, background: 'linear-gradient(to right, #1e293b, #0f172a, #1e293b)', borderTop: `12px solid ${accentColor}` }} />
    ))}
  </div>
));

/**
 * Court Component
 */
const Court = ({ 
  courtWidth = 800, 
  courtHeight = 500, 
  netTop, 
  courtType = 'indoor', 
  score = { p1: 0, ai: 0 }, 
  gameStatus = 'playing',
  lastHitTime = 0,
  children 
}) => {
  const currentStyle = COURT_STYLES[courtType] || COURT_STYLES.indoor;
  const [rotation, setRotation] = useState({ x: 15, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: 15 - y * 4, y: x * 4 });
  }, []);

  return (
    <div 
      className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotation({ x: 15, y: 0 })}
      ref={containerRef}
      key={courtType} /* Forces re-render on type change */
    >
      <div className="fixed inset-0 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none" />
      <Atmosphere color={currentStyle.particles} />
      
      <Jumbotron score={score} gameStatus={gameStatus} />

      <div className="relative">
        <StadiumLights />
        <CrowdArea side="left" lastHitTime={lastHitTime} />
        <CrowdArea side="right" lastHitTime={lastHitTime} />

        <div 
          className="relative transition-transform duration-500 ease-out"
          style={{
            width: courtWidth,
            height: courtHeight,
            background: currentStyle.background,
            backgroundImage: `${currentStyle.texture ? currentStyle.texture + ', ' : ''}${currentStyle.background}`,
            borderRadius: '16px',
            border: '12px solid #0f172a',
            boxShadow: `0 60px 120px -30px rgba(0,0,0,0.9), inset 0 0 100px ${currentStyle.shadowColor}`,
            transform: `perspective(1500px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          {currentStyle.scuffs && (
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                 style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/scratched-metal.png")' }} />
          )}

          <div className="absolute inset-4 border-[4px] pointer-events-none opacity-60" style={{ borderColor: currentStyle.lineColor }} />
          <div className="absolute left-1/2 -translate-x-1/2 w-[6px] h-full opacity-40" style={{ backgroundColor: currentStyle.lineColor }} />
          
          <div className="absolute inset-0 z-20">
            {children}
          </div>

          <NetSystem 
            netTop={netTop || courtHeight / 2} 
            accentColor={currentStyle.accentColor} 
            isShaking={lastHitTime > Date.now() - 150} 
          />
        </div>
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[115%] h-32 bg-black/60 blur-[80px] rounded-[50%] -z-10" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        .animate-float { animation: float 8s infinite linear; }
        @keyframes wiggle {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-4px); }
          75% { transform: translateY(4px); }
        }
        .animate-wiggle { animation: wiggle 0.08s infinite; }
      `}} />
    </div>
  );
};

export default Court;
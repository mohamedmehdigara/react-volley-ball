import React, { useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/** * --- EXTENDED STYLES & THEMES ---
 * Added depth, scuff marks, and subsurface scattering properties
 */
const COURT_STYLES = {
  indoor: {
    background: 'linear-gradient(to bottom, #e5c08a, #bc8f4f)',
    texture: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 60px, rgba(255,255,255,0.01) 61px)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(40, 20, 0, 0.5)',
    accentColor: '#3b82f6',
    reflection: true,
    ambient: 'none',
    scuffs: true
  },
  gym: {
    background: 'linear-gradient(to bottom, #1e3a8a, #172554)',
    texture: 'none',
    lineColor: '#fbbf24',
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    accentColor: '#f87171',
    reflection: true,
    ambient: 'none',
    scuffs: false
  },
  beach: {
    background: 'linear-gradient(to bottom, #fef3c7, #f59e0b)',
    texture: 'radial-gradient(circle, #d97706 0.2px, transparent 0)',
    lineColor: '#f8fafc',
    shadowColor: 'rgba(120, 53, 15, 0.2)',
    accentColor: '#10b981',
    reflection: false,
    ambient: 'wind',
    scuffs: false
  }
};

/** --- COMPONENT: Stadium Lighting Rig --- */
const StadiumLights = () => (
  <div className="absolute -top-24 inset-x-0 flex justify-between px-20 pointer-events-none z-[60]">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="relative">
        <div className="w-16 h-8 bg-slate-800 rounded-t-lg border-b-4 border-blue-400" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-[600px] bg-gradient-to-b from-blue-400/20 to-transparent blur-3xl opacity-40 origin-top rotate-[5deg]" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-[600px] bg-gradient-to-b from-blue-400/20 to-transparent blur-3xl opacity-40 origin-top -rotate-[5deg]" />
      </div>
    ))}
  </div>
);

/** --- COMPONENT: Crowd with Advanced AI States --- */
const CrowdArea = React.memo(({ side, lastHitTime, excitementLevel }) => {
  const [mood, setMood] = useState('idle');

  useEffect(() => {
    if (lastHitTime) {
      setMood('cheering');
      const timer = setTimeout(() => setMood('idle'), 800);
      return () => clearTimeout(timer);
    }
  }, [lastHitTime]);

  return (
    <div style={{
      position: 'absolute',
      [side]: '-110px',
      top: '5%',
      height: '90%',
      width: '80px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '6px',
      perspective: '1000px'
    }}>
      {[...Array(24)].map((_, i) => (
        <div key={i} 
          className={`transition-all duration-300 ${mood === 'cheering' ? 'translate-y-[-12px] scale-110' : 'translate-y-0'}`}
          style={{
            width: '16px',
            height: '22px',
            borderRadius: '40% 40% 4px 4px',
            backgroundColor: i % 3 === 0 ? '#0f172a' : (i % 3 === 1 ? '#1e293b' : '#334155'),
            boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.1)',
            transform: `translateZ(${Math.random() * 20}px)`,
            transitionDelay: `${Math.random() * 200}ms`
          }} 
        />
      ))}
    </div>
  );
});

/** --- COMPONENT: Holographic Jumbotron --- */
const Jumbotron = ({ score, gameStatus }) => (
  <div className="relative group mb-12">
    {/* Glitch Effect Background */}
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-rose-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
    
    <div className="relative flex flex-col items-center bg-slate-950 px-10 py-4 rounded-xl border border-white/10 shadow-2xl">
      <div className="flex items-center gap-12">
        <div className="text-center">
          <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mb-1">Home Team</div>
          <div className="text-6xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            {score.p1.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-900 overflow-hidden">
             <div className="text-rose-500 font-black italic text-sm animate-pulse">LIVE</div>
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-2">SET 01</div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em] mb-1">Visitor</div>
          <div className="text-6xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
            {score.ai.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
      
      {/* Ticker Tape */}
      <div className="w-full mt-4 pt-2 border-t border-white/5 overflow-hidden whitespace-nowrap">
        <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest animate-marquee inline-block">
          MATCH POINT NEAR • WORLD VOLLEYBALL SERIES • {gameStatus === 'playing' ? 'ACTION REPLAY ENABLED' : 'WAITING FOR SERVE'} •&nbsp;
        </div>
      </div>
    </div>
  </div>
);

/** --- COMPONENT: Interactive Net --- */
const NetSystem = React.memo(({ netTop, accentColor, isShaking }) => {
  return (
    <div className={`absolute left-0 w-full transition-transform duration-100 ${isShaking ? 'animate-wiggle' : ''}`}
      style={{
        top: netTop - 15,
        height: '35px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backgroundImage: `
          repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px),
          repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)
        `,
        borderTop: '5px solid #fff',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        zIndex: 40,
        boxShadow: '0 15px 30px rgba(0,0,0,0.3)'
      }}>
      
      {/* Boundary Posts */}
      {[-25, 'calc(100% + 10px)'].map((pos, idx) => (
        <div key={idx} className="absolute bottom-[-100px] w-4 h-[180px] rounded-full z-50 shadow-2xl"
             style={{ left: pos, background: 'linear-gradient(to right, #1e293b, #0f172a, #1e293b)', borderTop: `10px solid ${accentColor}` }} />
      ))}

      {/* Tension Cables */}
      <div className="absolute top-0 -left-10 w-10 h-[2px] bg-white/20 -rotate-[20deg] origin-right" />
      <div className="absolute top-0 -right-10 w-10 h-[2px] bg-white/20 rotate-[20deg] origin-left" />
    </div>
  );
});

/** --- MAIN IMPROVED COURT --- */
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
  const centerHeight = courtHeight / 2;
  const attackLineOffset = courtHeight / 6;

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 select-none">
      
      {/* 1. Global Lighting & Ambiance */}
      <div className="fixed inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />
      
      <Jumbotron score={score} gameStatus={gameStatus} />

      {/* 2. The Stadium Arena */}
      <div className="relative group">
        
        {/* Background Atmosphere */}
        <StadiumLights />
        <CrowdArea side="left" lastHitTime={lastHitTime} />
        <CrowdArea side="right" lastHitTime={lastHitTime} />

        {/* The Surface Wrapper */}
        <div 
          className="relative transition-all duration-700 ease-out"
          style={{
            width: courtWidth,
            height: courtHeight,
            background: currentStyle.background,
            backgroundImage: `${currentStyle.texture ? currentStyle.texture + ', ' : ''}${currentStyle.background}`,
            borderRadius: '12px',
            border: '10px solid #0f172a',
            boxShadow: `0 50px 100px -20px rgba(0,0,0,0.9), inset 0 0 80px ${currentStyle.shadowColor}`,
            transform: 'perspective(1200px) rotateX(15deg)',
            transformOrigin: 'bottom center',
            overflow: 'visible'
          }}
        >
          {/* Surface Scuffs (Detailing) */}
          {currentStyle.scuffs && (
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                 style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/scratched-metal.png")' }} />
          )}

          {/* Reflections */}
          {currentStyle.reflection && (
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
          )}

          {/* Lines & Markings */}
          <div className="absolute inset-2 border-[4px] pointer-events-none opacity-80" style={{ borderColor: currentStyle.lineColor }} />
          <div className="absolute left-1/2 -translate-x-1/2 w-[6px] h-full opacity-60" style={{ backgroundColor: currentStyle.lineColor }} />
          
          {/* 3m Lines */}
          <div className="absolute left-0 w-full h-[2px] opacity-30" style={{ top: centerHeight - attackLineOffset, backgroundColor: currentStyle.lineColor }} />
          <div className="absolute left-0 w-full h-[2px] opacity-30" style={{ top: centerHeight + attackLineOffset, backgroundColor: currentStyle.lineColor }} />

          {/* Player/Ball Content */}
          <div className="absolute inset-0 z-20">
            {children}
          </div>

          {/* Net System */}
          <NetSystem netTop={netTop || centerHeight} accentColor={currentStyle.accentColor} isShaking={lastHitTime > Date.now() - 200} />

        </div>

        {/* Shadow Projection */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[110%] h-24 bg-black/60 blur-[60px] rounded-full -z-10" />
      </div>

      {/* 3. Footer Stats / Metadata */}
      <div className="mt-16 w-full max-w-4xl flex justify-between items-end border-t border-white/5 pt-6 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">
        <div className="flex flex-col gap-1">
          <span className="text-blue-500">System Ready</span>
          <span>Buffer: 16ms / Latency: 2ms</span>
        </div>
        <div className="text-center group-hover:text-white transition-colors cursor-help">
          <div className="text-xs text-white mb-1">PRO LEAGUE SIMULATOR</div>
          <span>Ref #0921-X4</span>
        </div>
        <div className="text-right">
          <span>Regional Finals</span>
          <br />
          <span className="text-rose-500">Challenger Tier</span>
        </div>
      </div>

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-3px); }
          75% { transform: translateY(3px); }
        }
        .animate-wiggle {
          animation: wiggle 0.1s infinite;
        }
      `}} />
    </div>
  );
};

Court.propTypes = {
  courtWidth: PropTypes.number,
  courtHeight: PropTypes.number,
  netTop: PropTypes.number,
  courtType: PropTypes.oneOf(['indoor', 'gym', 'beach']),
  score: PropTypes.shape({ p1: PropTypes.number, ai: PropTypes.number }),
  gameStatus: PropTypes.string,
  lastHitTime: PropTypes.number,
  children: PropTypes.node,
};

export default Court;
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/** * --- ADVANCED CONFIGURATION ---
 * Extended styles including ambient effects and physics constants
 */
const COURT_STYLES = {
  indoor: {
    background: 'linear-gradient(to bottom, #d2b48c, #8b5a2b)',
    texture: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 40px, rgba(255,255,255,0.02) 41px)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    accentColor: '#3b82f6',
    reflection: true,
    ambient: 'none'
  },
  gym: {
    background: 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
    texture: 'none',
    lineColor: '#fde047',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    accentColor: '#ef4444',
    reflection: true,
    ambient: 'none'
  },
  beach: {
    background: 'linear-gradient(to bottom, #fde68a, #f59e0b)',
    texture: 'radial-gradient(#d97706 0.5px, transparent 0)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(120, 53, 15, 0.3)',
    accentColor: '#10b981',
    reflection: false,
    ambient: 'wind'
  }
};

/** --- HELPER: Rain/Dust Particles --- */
const AmbientEffect = ({ type }) => {
  if (type === 'none') return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute bg-white/20 animate-pulse" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: '2px',
          height: '10px',
          transform: 'rotate(15deg)',
          animationDuration: `${Math.random() * 2 + 1}s`
        }} />
      ))}
    </div>
  );
};

/** --- HELPER: Camera Flashes --- */
const CameraFlash = () => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: '0%', left: '0%' });

  useEffect(() => {
    const trigger = () => {
      if (Math.random() > 0.85) {
        setPos({ 
          top: `${Math.random() * 90}%`, 
          left: Math.random() > 0.5 ? '-80px' : 'calc(100% + 40px)' 
        });
        setVisible(true);
        setTimeout(() => setVisible(false), 50);
      }
    };
    const interval = setInterval(trigger, 400);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;
  return (
    <div className="absolute rounded-full bg-white blur-md z-[100] opacity-90 shadow-[0_0_30px_15px_white]"
         style={{ ...pos, width: '20px', height: '20px' }} />
  );
};

/** --- HELPER: Crowd with Reaction Logic --- */
const CrowdArea = React.memo(({ side, lastHitTime }) => {
  const [isCheering, setIsCheering] = useState(false);

  useEffect(() => {
    if (lastHitTime) {
      setIsCheering(true);
      const timer = setTimeout(() => setIsCheering(false), 600);
      return () => clearTimeout(timer);
    }
  }, [lastHitTime]);

  return (
    <div style={{
      position: 'absolute',
      [side]: '-90px',
      top: '2%',
      height: '96%',
      width: '70px',
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '4px',
      opacity: 0.6,
      perspective: '500px'
    }}>
      {[...Array(16)].map((_, i) => (
        <div key={i} style={{
          width: '18px',
          height: '18px',
          borderRadius: '50% 50% 4px 4px',
          backgroundColor: i % 2 === 0 ? '#1e293b' : '#334155',
          transform: isCheering ? `translateZ(${Math.random() * 40}px) translateY(-10px)` : 'none',
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          borderBottom: '2px solid rgba(0,0,0,0.3)'
        }} />
      ))}
    </div>
  );
});

/** --- HELPER: Pro Scoreboard --- */
const Jumbotron = ({ score, gameStatus }) => (
  <div className="flex flex-col items-center mb-8">
    <div className="bg-slate-900 border-4 border-slate-800 p-1 rounded-xl shadow-2xl flex items-center gap-4">
      <div className="bg-black px-6 py-2 rounded-lg border border-slate-700">
        <div className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Home</div>
        <div className="text-4xl font-black text-white font-mono">{score.p1.toString().padStart(2, '0')}</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-rose-500 font-black text-xl italic leading-none">VS</div>
        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Set 1</div>
      </div>
      <div className="bg-black px-6 py-2 rounded-lg border border-slate-700">
        <div className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">Away</div>
        <div className="text-4xl font-black text-white font-mono">{score.ai.toString().padStart(2, '0')}</div>
      </div>
    </div>
    <div className="mt-2 text-blue-400 font-bold text-[10px] uppercase tracking-[0.4em] animate-pulse">
      {gameStatus === 'playing' ? 'Live Match' : 'Intermission'}
    </div>
  </div>
);

/** --- HELPER: Net & Posts --- */
const NetComponent = React.memo(({ netTop, accentColor }) => {
  const postHeight = 120;
  const netLineHeight = 30;
  
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      top: netTop - netLineHeight / 2,
      width: '100%',
      height: netLineHeight, 
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backgroundImage: `
        repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 9px),
        repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 9px)
      `,
      borderTop: '6px solid #fff',
      borderBottom: '2px solid rgba(255,255,255,0.3)',
      zIndex: 40,
      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
    }}>
      {/* Posts */}
      {[-18, 'calc(100% + 4px)'].map((pos, idx) => (
        <div key={idx} style={{
          position: 'absolute',
          left: pos,
          bottom: -40,
          width: '14px',
          height: postHeight,
          background: 'linear-gradient(to right, #334, #112, #334)',
          borderRadius: '4px',
          borderTop: `8px solid ${accentColor}`,
          zIndex: 41
        }} />
      ))}
      
      {/* Antennas */}
      {[0, 'calc(100% - 4px)'].map((pos, idx) => (
        <div key={idx} style={{
          position: 'absolute',
          left: pos,
          top: -60,
          width: '4px',
          height: '80px',
          background: 'repeating-linear-gradient(#ef4444, #ef4444 10px, #fff 10px, #fff 20px)',
          zIndex: 42
        }} />
      ))}
    </div>
  );
});

/** --- MAIN COURT COMPONENT --- */
const Court = ({ 
  courtWidth, 
  courtHeight, 
  netTop, 
  courtType, 
  score = { p1: 0, ai: 0 }, 
  gameStatus = 'playing',
  lastHitTime = 0,
  children 
}) => {
  const centerHeight = courtHeight / 2;
  const ATTACK_LINE_OFFSET = courtHeight / 6; 
  const currentStyle = COURT_STYLES[courtType] || COURT_STYLES.indoor;
  const calculatedNetTop = netTop !== undefined ? netTop : centerHeight;

  // Optimized styles with useMemo
  const courtContainerStyle = useMemo(() => ({
    position: 'relative',
    width: courtWidth,
    height: courtHeight,
    background: currentStyle.background,
    backgroundImage: `${currentStyle.texture ? currentStyle.texture + ', ' : ''}${currentStyle.background}`,
    backgroundSize: 'cover',
    border: `12px solid #1e293b`,
    boxShadow: `
      0 40px 100px -20px rgba(0,0,0,0.8), 
      inset 0 0 120px ${currentStyle.shadowColor}
    `,
    borderRadius: '16px',
    transform: 'perspective(1500px) rotateX(15deg)',
    transformOrigin: 'center center',
    margin: '0 auto',
    overflow: 'visible',
    transition: 'all 0.5s ease-out'
  }), [courtWidth, courtHeight, currentStyle]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 overflow-hidden">
      
      {/* 1. Scoreboard (New Feature) */}
      <Jumbotron score={score} gameStatus={gameStatus} />

      {/* 2. Main Stadium Wrapper */}
      <div className="relative">
        
        {/* Environmental Layers */}
        <CrowdArea side="left" lastHitTime={lastHitTime} />
        <CrowdArea side="right" lastHitTime={lastHitTime} />
        <CameraFlash />
        
        {/* The Physical Court */}
        <div style={courtContainerStyle}>
          
          <AmbientEffect type={currentStyle.ambient} />

          {/* Floor Reflections */}
          {currentStyle.reflection && (
            <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
                 style={{ background: 'linear-gradient(135deg, white 0%, transparent 40%, rgba(255,255,255,0.1) 100%)' }} />
          )}

          {/* Markings: Boundary */}
          <div className="absolute inset-0 border-[6px] pointer-events-none z-10" 
               style={{ borderColor: currentStyle.lineColor, opacity: 0.9 }} />
          
          {/* Markings: Center Line */}
          <div className="absolute left-1/2 -translate-x-1/2 w-2 h-full z-10"
               style={{ backgroundColor: currentStyle.lineColor, opacity: 0.8 }} />

          {/* Markings: Attack Lines (3-meter lines) */}
          <div className="absolute left-0 w-full h-[3px] opacity-60 z-10"
               style={{ top: centerHeight - ATTACK_LINE_OFFSET, backgroundColor: currentStyle.lineColor }} />
          <div className="absolute left-0 w-full h-[3px] opacity-60 z-10"
               style={{ top: centerHeight + ATTACK_LINE_OFFSET, backgroundColor: currentStyle.lineColor }} />

          {/* Game Content Layer */}
          <div className="absolute inset-0 z-30">
            {children}
          </div>

          {/* Net Layer */}
          <NetComponent netTop={calculatedNetTop} accentColor={currentStyle.accentColor} />

          {/* Lighting Overlay */}
          <div className="absolute inset-0 pointer-events-none z-50 mix-blend-screen opacity-20"
               style={{ background: 'radial-gradient(circle at 50% 0%, white 0%, transparent 70%)' }} />
        </div>

        {/* Stadium "Ground" Shadows */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[110%] h-20 bg-black/40 blur-3xl rounded-[100%] -z-10" />
      </div>

      {/* 3. Sideline Info Bar */}
      <div className="mt-12 flex items-center gap-24">
         <div className="flex flex-col items-center opacity-40">
            <div className="w-12 h-1 bg-blue-500 mb-2" />
            <span className="text-[10px] text-white font-black uppercase tracking-widest">Home Bench</span>
         </div>
         <div className="px-6 py-2 border border-slate-800 rounded-full bg-slate-900/50 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Official FIVB Simulation</span>
         </div>
         <div className="flex flex-col items-center opacity-40">
            <div className="w-12 h-1 bg-rose-500 mb-2" />
            <span className="text-[10px] text-white font-black uppercase tracking-widest">Visitor Bench</span>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bob {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }
        .crowd-person { animation: bob 1s infinite alternate ease-in-out; }
      `}} />
    </div>
  );
};

Court.propTypes = {
  courtWidth: PropTypes.number.isRequired,
  courtHeight: PropTypes.number.isRequired,
  netTop: PropTypes.number,
  courtType: PropTypes.oneOf(['indoor', 'gym', 'beach']),
  score: PropTypes.shape({ p1: PropTypes.number, ai: PropTypes.number }),
  gameStatus: PropTypes.string,
  lastHitTime: PropTypes.number,
  children: PropTypes.node,
};

export default Court;
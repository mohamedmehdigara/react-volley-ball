import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// --- Configuration for different Court Types ---
const COURT_STYLES = {
  indoor: {
    background: 'linear-gradient(to bottom, #d2b48c, #8b5a2b)',
    texture: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 0)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    accentColor: '#3b82f6',
    reflection: true,
  },
  gym: {
    background: 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
    texture: 'none',
    lineColor: '#fde047',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    accentColor: '#ef4444',
    reflection: true,
  },
  beach: {
    background: 'linear-gradient(to bottom, #fde68a, #f59e0b)',
    texture: 'radial-gradient(#d97706 0.5px, transparent 0)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(120, 53, 15, 0.3)',
    accentColor: '#10b981',
    reflection: false,
  }
};

// --- Helper Components ---

// Simulated camera flashes from the crowd
const CameraFlash = () => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: '0%', left: '0%' });

  useEffect(() => {
    const trigger = () => {
      if (Math.random() > 0.92) {
        setPos({ 
          top: `${Math.random() * 80 + 10}%`, 
          left: Math.random() > 0.5 ? '-50px' : 'calc(100% + 20px)' 
        });
        setVisible(true);
        setTimeout(() => setVisible(false), 60);
      }
    };
    const interval = setInterval(trigger, 500);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      ...pos,
      width: '15px',
      height: '15px',
      background: 'white',
      borderRadius: '50%',
      filter: 'blur(5px)',
      boxShadow: '0 0 20px 10px white',
      zIndex: 100,
      opacity: 0.8
    }} />
  );
};

const CrowdArea = React.memo(({ side }) => (
  <div style={{
    position: 'absolute',
    [side]: '-70px',
    top: '5%',
    height: '90%',
    width: '50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    opacity: 0.7,
    zIndex: 0
  }}>
    {[...Array(8)].map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '4px' }}>
        <div className="crowd-person" style={{
          width: '12px',
          height: '12px',
          borderRadius: '50% 50% 0 0',
          backgroundColor: i % 3 === 0 ? '#1e293b' : i % 3 === 1 ? '#334155' : '#475569',
          animation: `bob ${1.5 + Math.random()}s infinite alternate ease-in-out`
        }} />
        {Math.random() > 0.7 && (
          <div style={{
            width: '8px',
            height: '20px',
            backgroundColor: i % 2 === 0 ? '#ef4444' : '#3b82f6',
            borderRadius: '2px',
            transform: `rotate(${Math.sin(i) * 20}deg)`,
            opacity: 0.5
          }} />
        )}
      </div>
    ))}
  </div>
));

const FloodLight = ({ position }) => (
  <div style={{
    position: 'absolute',
    [position]: '20px',
    top: '-30px',
    width: '100px',
    height: '150px',
    background: `radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)`,
    transform: position === 'left' ? 'rotate(-45deg)' : 'rotate(45deg)',
    pointerEvents: 'none',
    zIndex: 15
  }} />
);

const NetComponent = React.memo(({ netTop, accentColor }) => {
  const postHeight = 85;
  const postWidth = 14;
  const netLineHeight = 22;
  
  const postStyle = {
    width: postWidth,
    height: postHeight,
    background: `linear-gradient(to right, #444, #222, #444)`, 
    borderRadius: '4px',
    borderTop: `6px solid ${accentColor}`,
    boxShadow: '4px 8px 15px rgba(0,0,0,0.4)',
    position: 'absolute',
    bottom: -postHeight / 2 + netLineHeight / 2, 
  };

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      top: netTop - netLineHeight / 2,
      width: '100%',
      height: netLineHeight, 
      backgroundColor: 'rgba(20, 20, 20, 0.7)',
      backgroundImage: `
        repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(255,255,255,0.15) 5px, rgba(255,255,255,0.15) 6px),
        repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(255,255,255,0.15) 5px, rgba(255,255,255,0.15) 6px)
      `,
      borderTop: '5px solid #fff',
      borderBottom: '2px solid #bbb',
      zIndex: 10,
    }}>
      <div style={{ ...postStyle, left: -postWidth - 8 }} />
      <div style={{ ...postStyle, right: -postWidth - 8 }} />
      
      {/* Antennas (Red/White striped) */}
      <div style={{ position: 'absolute', left: 0, top: -40, width: '4px', height: '60px', background: 'repeating-linear-gradient(#f00, #f00 10px, #fff 10px, #fff 20px)' }} />
      <div style={{ position: 'absolute', right: 0, top: -40, width: '4px', height: '60px', background: 'repeating-linear-gradient(#f00, #f00 10px, #fff 10px, #fff 20px)' }} />
    </div>
  );
});

const Court = ({ courtWidth, courtHeight, netTop, courtType, children }) => {
  const centerHeight = courtHeight / 2;
  const ATTACK_LINE_OFFSET = courtHeight / 6; 
  const currentStyle = COURT_STYLES[courtType] || COURT_STYLES.indoor;
  const calculatedNetTop = netTop !== undefined ? netTop : centerHeight;

  const courtContainerStyle = useMemo(() => ({
    position: 'relative',
    width: courtWidth,
    height: courtHeight,
    background: currentStyle.background,
    backgroundImage: `${currentStyle.texture ? currentStyle.texture + ', ' : ''}${currentStyle.background}`,
    backgroundSize: courtType === 'beach' ? '15px 15px, cover' : '10px 10px, cover',
    border: `14px solid #1a1a1a`,
    boxShadow: `0 30px 60px rgba(0,0,0,0.6), inset 0 0 80px ${currentStyle.shadowColor}`,
    borderRadius: '12px',
    transform: 'perspective(1200px) rotateX(12deg)',
    transformOrigin: 'center center',
    margin: '50px auto',
    overflow: 'visible'
  }), [courtWidth, courtHeight, currentStyle, courtType]);

  return (
    <div className="stadium-wrapper" style={{ 
      backgroundColor: '#0f172a', 
      padding: '40px 100px', 
      minHeight: '100%',
      position: 'relative'
    }}>
      <div style={courtContainerStyle}>
        
        {/* Environmental Effects */}
        <CrowdArea side="left" />
        <CrowdArea side="right" />
        <CameraFlash />
        <FloodLight position="left" />
        <FloodLight position="right" />

        {/* Floor Reflections (Indoor only) */}
        {currentStyle.reflection && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
            pointerEvents: 'none',
            zIndex: 3
          }} />
        )}

        {/* Structural Markings */}
        <div style={{ position: 'absolute', inset: 0, border: `6px solid ${currentStyle.lineColor}`, zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '50%', width: '4px', height: '100%', backgroundColor: currentStyle.lineColor, transform: 'translateX(-50%)', zIndex: 1 }} />
        
        {/* Attack Lines */}
        <div style={{ position: 'absolute', top: centerHeight - ATTACK_LINE_OFFSET, width: '100%', height: '3px', backgroundColor: `${currentStyle.lineColor}99`, zIndex: 2 }} />
        <div style={{ position: 'absolute', top: centerHeight + ATTACK_LINE_OFFSET, width: '100%', height: '3px', backgroundColor: `${currentStyle.lineColor}99`, zIndex: 2 }} />

        {/* Game Elements */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
          {children}
        </div>

        {/* Physical Net */}
        <NetComponent netTop={calculatedNetTop} accentColor={currentStyle.accentColor} />

      </div>

      {/* Scoreboard Foundation / Sideline */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '-20px',
        color: '#64748b',
        fontSize: '11px',
        letterSpacing: '2px',
        textTransform: 'uppercase'
      }}>
        <div style={{ background: '#1e293b', padding: '4px 12px', borderRadius: '4px' }}>Home Team Area</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ color: '#94a3b8' }}>• Match Point •</span>
          <span style={{ color: '#94a3b8' }}>• Set 3 •</span>
        </div>
        <div style={{ background: '#1e293b', padding: '4px 12px', borderRadius: '4px' }}>Away Team Area</div>
      </div>
    </div>
  );
};

Court.propTypes = {
  courtWidth: PropTypes.number.isRequired,
  courtHeight: PropTypes.number.isRequired,
  netTop: PropTypes.number,
  courtType: PropTypes.oneOf(['indoor', 'gym', 'beach']), 
  children: PropTypes.node,
};

Court.defaultProps = {
  courtType: 'indoor',
  netTop: null,
};

export default Court;
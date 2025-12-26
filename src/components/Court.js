import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

// --- Configuration for different Court Types ---
const COURT_STYLES = {
  // Indoor Wood Floor (Standard)
  indoor: {
    background: 'linear-gradient(to bottom, #d2b48c, #8b5a2b)',
    texture: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 0)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    accentColor: '#3b82f6', // Blue post accents
  },
  // Gym Floor (Colored/Hard Court)
  gym: {
    background: 'linear-gradient(to bottom, #1e40af, #1e3a8a)', // Deep Blue Gym
    texture: 'none',
    lineColor: '#fde047', // Yellow lines
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    accentColor: '#ef4444', // Red post accents
  },
  // Beach Volleyball (Sand)
  beach: {
    background: 'linear-gradient(to bottom, #fde68a, #f59e0b)',
    texture: 'radial-gradient(#d97706 0.5px, transparent 0)',
    lineColor: '#ffffff',
    shadowColor: 'rgba(120, 53, 15, 0.3)',
    accentColor: '#10b981', // Green post accents
  }
};

// --- Helper Components ---

const CrowdArea = React.memo(({ side }) => (
  <div style={{
    position: 'absolute',
    [side]: '-60px',
    top: '10%',
    height: '80%',
    width: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    opacity: 0.6,
    zIndex: 0
  }}>
    {[...Array(6)].map((_, i) => (
      <div key={i} className="crowd-person" style={{
        width: '15px',
        height: '15px',
        borderRadius: '50% 50% 0 0',
        backgroundColor: i % 2 === 0 ? '#444' : '#666',
        animation: `bob ${1 + Math.random()}s infinite alternate ease-in-out`
      }} />
    ))}
    <style>{`
      @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-10px); } }
    `}</style>
  </div>
));

const CenterLine = React.memo(({ lineColor }) => (
  <div style={{
    position: 'absolute',
    left: '50%',
    top: 0,
    width: '4px',
    height: '100%',
    backgroundColor: lineColor,
    transform: 'translateX(-50%)',
    zIndex: 1,
    boxShadow: `0 0 10px ${lineColor}44`,
  }} />
));

const AttackLineComponent = React.memo(({ top, lineColor }) => (
  <div style={{
    position: 'absolute',
    left: 0,
    width: '100%',
    height: '3px',
    backgroundColor: `${lineColor}aa`,
    zIndex: 2,
    top: top,
  }} />
));

const BoundaryLineComponent = React.memo(({ courtWidth, courtHeight, lineColor }) => (
  <div style={{
    position: 'absolute',
    left: 0,
    top: 0,
    width: courtWidth,
    height: courtHeight,
    boxSizing: 'border-box',
    border: `5px solid ${lineColor}`,
    zIndex: 2,
    pointerEvents: 'none',
  }} />
));

const NetComponent = React.memo(({ netTop, accentColor }) => {
  const postHeight = 70;
  const postWidth = 12;
  const netLineHeight = 18;
  
  const postStyle = {
    width: postWidth,
    height: postHeight,
    background: `linear-gradient(to bottom, #777, #222)`, 
    borderRadius: '4px',
    borderTop: `4px solid ${accentColor}`,
    boxShadow: '2px 4px 10px rgba(0,0,0,0.5)',
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
      backgroundColor: 'rgba(30, 30, 30, 0.8)',
      backgroundImage: `
        repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 5px),
        repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 5px)
      `,
      borderTop: '4px solid #fff',
      borderBottom: '2px solid #ddd',
      zIndex: 10,
    }}>
      <div style={{ ...postStyle, left: -postWidth - 5 }} />
      <div style={{ ...postStyle, right: -postWidth - 5 }} />
      
      {/* Referee Chair Visual */}
      <div style={{
        position: 'absolute',
        right: '-45px',
        top: '-15px',
        width: '25px',
        height: '40px',
        backgroundColor: '#333',
        borderRadius: '2px',
        border: '2px solid #555'
      }}>
        <div style={{ width: '100%', height: '4px', background: '#fff', marginTop: '5px' }} />
      </div>
    </div>
  );
});

const Court = ({ courtWidth, courtHeight, netTop, courtType, children }) => {
  const centerHeight = courtHeight / 2;
  const ATTACK_LINE_OFFSET = courtHeight / 6; 
  
  const currentStyle = COURT_STYLES[courtType] || COURT_STYLES.indoor;
  const lineColor = currentStyle.lineColor;

  const p1AttackLineTop = centerHeight + ATTACK_LINE_OFFSET;
  const p2AttackLineTop = centerHeight - ATTACK_LINE_OFFSET;
  const calculatedNetTop = netTop !== undefined ? netTop : centerHeight;

  const courtContainerStyle = useMemo(() => ({
    position: 'relative',
    width: courtWidth,
    height: courtHeight,
    background: currentStyle.background,
    backgroundImage: `${currentStyle.texture ? currentStyle.texture + ', ' : ''}${currentStyle.background}`,
    backgroundSize: courtType === 'beach' ? '15px 15px, cover' : '8px 8px, cover',
    border: `12px solid #333`,
    boxShadow: `0 20px 50px rgba(0,0,0,0.5), inset 0 0 60px ${currentStyle.shadowColor}`,
    borderRadius: '8px',
    // Perspective creates the "TV Broadcast" look
    transform: 'perspective(1200px) rotateX(10deg)',
    transformOrigin: 'center center',
    margin: '40px auto',
  }), [courtWidth, courtHeight, currentStyle, courtType]);

  return (
    <div className="court-environment" style={{ padding: '0 80px' }}>
      <div style={courtContainerStyle}>
        
        {/* Dynamic Atmosphere Elements */}
        <CrowdArea side="left" />
        <CrowdArea side="right" />

        {/* Lighting Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.2) 100%)',
          pointerEvents: 'none',
          zIndex: 4
        }} />

        {/* Structural Markings */}
        <BoundaryLineComponent courtWidth={courtWidth} courtHeight={courtHeight} lineColor={lineColor} />
        <CenterLine lineColor={lineColor} />
        <AttackLineComponent top={p2AttackLineTop} lineColor={lineColor} />
        <AttackLineComponent top={p1AttackLineTop} lineColor={lineColor} />
        
        {/* Playable Area Highlights */}
        <div style={{
          position: 'absolute',
          top: p2AttackLineTop,
          height: ATTACK_LINE_OFFSET * 2,
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.03)',
          zIndex: 0
        }} />

        {/* Game Elements Layer */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
          {children}
        </div>

        {/* Physical Net (Above players) */}
        <NetComponent netTop={calculatedNetTop} accentColor={currentStyle.accentColor} />

      </div>

      {/* Bench / Sideline Visuals */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '-20px',
        padding: '0 20px',
        opacity: 0.8
      }}>
        <div style={{ color: '#aaa', fontSize: '12px', fontWeight: 'bold' }}>TEAM A BENCH</div>
        <div style={{ color: '#aaa', fontSize: '12px', fontWeight: 'bold' }}>TEAM B BENCH</div>
      </div>
    </div>
  );
};

Court.propTypes = {
  courtWidth: PropTypes.number.isRequired,
  courtHeight: PropTypes.number.isRequired,
  netTop: PropTypes.number,
  courtType: PropTypes.oneOf(Object.keys(COURT_STYLES)), 
  children: PropTypes.node,
};

Court.defaultProps = {
  courtType: 'indoor',
  netTop: null,
};

export default Court;
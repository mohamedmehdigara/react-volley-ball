import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

// --- Configuration for different Court Types (Volleyball focus) ---
const COURT_STYLES = {
  // Indoor Wood Floor (Standard)
  indoor: {
    background: 'linear-gradient(to bottom, #d2b48c, #8b5a2b)', // Wood grain gradient
    texture: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 0)', // Subtle wood texture
    lineColor: '#ffffff', // Bright white lines
    shadowColor: 'rgba(0, 0, 0, 0.4)',
  },
  // Gym Floor (Colored/Hard Court)
  gym: {
    background: 'linear-gradient(to bottom, #ef4444, #b91c1c)', // Red/Maroon gym floor
    texture: 'none',
    lineColor: '#fef3c7', // Off-white/Yellow lines
    shadowColor: 'rgba(0, 0, 0, 0.6)',
  },
};

// --- Helper Components using Inline Styles ---

// Component for the thin vertical line in the center
const CenterLine = React.memo(({ lineColor, courtWidth }) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: 0,
      width: '4px', // Standard thick line
      height: '100%',
      backgroundColor: lineColor,
      transform: 'translateX(-50%)',
      zIndex: 1,
      // Adding a subtle boundary line on the sides of the net line
      boxShadow: `0 0 5px ${lineColor}`,
    }}
  />
));

// Component for the Attack Line (3-Meter Line)
const AttackLineComponent = React.memo(({ top, lineColor, courtWidth }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width: '100%',
      height: '4px', // Standard thick line
      backgroundColor: lineColor,
      zIndex: 2,
      top: top,
    }}
  >
    {/* Optional: Add a dashed extension to indicate free zone beyond the sidelines, typical in pro visuals */}
    <div 
        style={{
            position: 'absolute',
            left: -20, // Extends beyond the court width visually
            top: 0,
            width: 20,
            height: '100%',
            borderTop: '2px dashed #999',
            borderBottom: '2px dashed #999',
            backgroundColor: 'transparent',
        }}
    />
    <div 
        style={{
            position: 'absolute',
            right: -20, // Extends beyond the court width visually
            top: 0,
            width: 20,
            height: '100%',
            borderTop: '2px dashed #999',
            borderBottom: '2px dashed #999',
            backgroundColor: 'transparent',
        }}
    />
  </div>
));

// Component for the Boundary Lines (Baselines and Sidelines)
const BoundaryLineComponent = React.memo(({ courtWidth, courtHeight, lineColor }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: courtWidth,
      height: courtHeight,
      boxSizing: 'border-box',
      border: `4px solid ${lineColor}`, // Boundary lines on all sides
      zIndex: 2,
      pointerEvents: 'none',
    }}
  />
));

// Component for the Net barrier (Enhanced with posts and a visible net mesh)
const NetComponent = React.memo(({ netTop }) => {
  const postHeight = 60; // Taller post for volleyball
  const postWidth = 10;
  const netLineHeight = 15; // Represents the visual height of the net mesh
  
  const postStyle = useMemo(() => ({
    width: postWidth,
    height: postHeight,
    background: 'linear-gradient(to bottom, #555, #111)', 
    borderRadius: '5px',
    boxShadow: '0 0 8px rgba(0,0,0,0.7)',
    position: 'absolute',
    // Position the post's base on the net line
    bottom: -postHeight / 2 + netLineHeight / 2, 
  }), [postHeight, postWidth, netLineHeight]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: netTop - netLineHeight / 2, // Center the net visually on netTop
        width: '100%',
        height: netLineHeight, 
        backgroundColor: '#444', // Dark color for mesh effect
        // Simple striped pattern to simulate net mesh
        backgroundImage: 'repeating-linear-gradient(90deg, #999, #999 1px, #444 1px, #444 5px)',
        borderTop: '3px solid #fff', // Top net tape
        borderBottom: '1px solid #777',
        boxShadow: '0 1px 5px rgba(0, 0, 0, 0.5)',
        zIndex: 10,
      }}
    >
      {/* Net Post - Left */}
      <div 
        style={{
          ...postStyle,
          left: -postWidth, // Place outside the court boundary
        }} 
      />
      {/* Net Post - Right */}
      <div 
        style={{
          ...postStyle,
          right: -postWidth, // Place outside the court boundary
        }} 
      />
    </div>
  );
});

// Component to visually highlight the Attack Zone (Front Row)
const AttackZoneHighlight = React.memo(({ courtWidth, top, height }) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: courtWidth,
        height: height,
        top: top,
        backgroundColor: 'rgba(255, 255, 0, 0.08)', // Subtle yellow highlight
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
));


// --- Component Definition ---

const Court = ({ courtWidth, courtHeight, netTop, courtType, children }) => {
  
  // Calculate constants
  const centerHeight = courtHeight / 2;
  // Volleyball attack line is 3m from the center line (6m from baseline)
  // Since the court is 18m total, the attack line offset from the center is 1/6th of total height.
  const ATTACK_LINE_OFFSET = courtHeight / 6; 
  
  // Get court style and line color based on courtType prop
  const currentStyle = COURT_STYLES[courtType] || COURT_STYLES.indoor;
  const lineColor = currentStyle.lineColor;

  // Calculate line positions
  const p1AttackLineTop = centerHeight + ATTACK_LINE_OFFSET; // Lower half (Player 1 side)
  const p2AttackLineTop = centerHeight - ATTACK_LINE_OFFSET; // Upper half (Player 2 side)
  const calculatedNetTop = netTop !== undefined ? netTop : centerHeight;
  
  // The attack zone height is the space between the center line and the attack line (ATTACK_LINE_OFFSET)
  const ATTACK_ZONE_HEIGHT = ATTACK_LINE_OFFSET;
  
  // Attack zone positions
  const p2AttackZoneTop = centerHeight - ATTACK_ZONE_HEIGHT;
  const p1AttackZoneTop = centerHeight;

  // Use useMemo to prevent recalculation of the main court style on every render
  const courtStyle = useMemo(() => ({
    position: 'relative',
    width: courtWidth,
    height: courtHeight,
    background: currentStyle.background,
    // Add texture if available (for wood floor effect)
    backgroundImage: `${currentStyle.texture ? currentStyle.texture + ', ' : ''}${currentStyle.background}`,
    backgroundSize: '8px 8px, cover',
    border: `8px solid ${currentStyle.shadowColor}`, // Outer boundary border
    boxShadow: `inset 0 0 20px ${currentStyle.shadowColor}`, // Inner shadow for depth
    borderRadius: '4px',
    overflow: 'hidden',
    // Use perspective for 3D effect
    transform: 'perspective(1000px) rotateX(4deg)',
    transformOrigin: 'center center',
  }), [courtWidth, courtHeight, currentStyle]);
  

  return (
    <div style={courtStyle}>
      
      {/* --- Visual Play Zones (Attack Zones / Front Row) --- */}
      <AttackZoneHighlight 
        courtWidth={courtWidth} 
        top={p2AttackZoneTop} 
        height={ATTACK_ZONE_HEIGHT} 
      />
      <AttackZoneHighlight 
        courtWidth={courtWidth} 
        top={p1AttackZoneTop} 
        height={ATTACK_ZONE_HEIGHT} 
      />
      
      {/* --- Structural Markings --- */}
      <BoundaryLineComponent courtWidth={courtWidth} courtHeight={courtHeight} lineColor={lineColor} />
      
      {/* The Center Line is rendered on top of the Boundary, effectively splitting the court */}
      <CenterLine lineColor={lineColor} courtWidth={courtWidth} />

      {/* Attack Lines (3-Meter Lines) */}
      <AttackLineComponent top={p2AttackLineTop} lineColor={lineColor} courtWidth={courtWidth} />
      <AttackLineComponent top={p1AttackLineTop} lineColor={lineColor} courtWidth={courtWidth} />
      
      {/* The Net (Crucial physical barrier) */}
      <NetComponent netTop={calculatedNetTop} />
      
      {/* Game elements (Ball, Players, etc.) rendered as children)
          Wrapped to ensure z-index is higher than markings but lower than the net
      */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
        {children}
      </div>
    </div>
  );
};

// --- Prop Type Definitions for Robustness ---
Court.propTypes = {
  courtWidth: PropTypes.number.isRequired,
  courtHeight: PropTypes.number.isRequired,
  netTop: PropTypes.number,
  // Restricts courtType to one of the defined volleyball styles
  courtType: PropTypes.oneOf(Object.keys(COURT_STYLES)), 
  children: PropTypes.node,
};

// --- Default Props ---
Court.defaultProps = {
  courtType: 'indoor',
  netTop: null,
};

export default Court;
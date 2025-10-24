import React from 'react';

// --- Helper Components using Inline Styles ---

// Component for the thin vertical line in the center
const CenterLine = () => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: 0,
      width: '2px',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      transform: 'translateX(-50%)',
      zIndex: 1,
    }}
  />
);

// New Component: Component for the Baseline markings (Top and Bottom)
const BaselineComponent = ({ courtWidth, top }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width: courtWidth,
      height: '4px', // Thicker line for the baseline
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Brighter white for prominence
      zIndex: 2,
      top: top,
    }}
  />
);

// Component for the Net barrier (Enhanced with posts)
const NetComponent = ({ netTop }) => {
  const postHeight = 25;
  const postWidth = 8;
  const netLineHeight = 4;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: netTop,
        width: '100%',
        height: netLineHeight, // Thickness of the net line
        backgroundColor: '#333', // Dark color for net base
        borderTop: '2px dashed #fff', // Dashed line for net cord visual
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        zIndex: 10, // Ensure net is visually distinct
      }}
    >
      {/* Net Post - Left */}
      <div 
        style={{
          position: 'absolute',
          left: 0,
          bottom: -(postHeight - netLineHeight) / 2, // Center the post vertically on the net line
          width: postWidth,
          height: postHeight,
          background: 'linear-gradient(to bottom, #ccc, #777)', // Gradient for 3D look
          borderRadius: '4px',
          boxShadow: '0 0 5px rgba(0,0,0,0.5)',
        }} 
      />
      {/* Net Post - Right */}
      <div 
        style={{
          position: 'absolute',
          right: 0,
          bottom: -(postHeight - netLineHeight) / 2, // Center the post vertically on the net line
          width: postWidth,
          height: postHeight,
          background: 'linear-gradient(to bottom, #ccc, #777)', // Gradient for 3D look
          borderRadius: '4px',
          boxShadow: '0 0 5px rgba(0,0,0,0.5)',
        }} 
      />
    </div>
  );
};

// Component for the Service Lines (Horizontal)
const ServiceLineComponent = ({ top }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width: '100%',
      height: '2px',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      zIndex: 1,
      top: top,
    }}
  />
);

// Renamed and Corrected Component: Markings to define the quadrants
const QuadrantComponent = ({ courtWidth, centerHeight, side, topOffset }) => {
  const isLeft = side === 'left';
  const isTopHalf = topOffset === 0;
  
  // Define the style for the quadrant border (used for visual service box placement)
  const zoneStyle = {
    position: 'absolute',
    // The zone takes up half the width of the court
    width: courtWidth / 2, 
    // The height is half the total height
    height: centerHeight, 
    top: topOffset, // 0 for top half, centerHeight for bottom half
    left: isLeft ? 0 : courtWidth / 2,
    
    // Transparent layer with a light white border/outline
    border: '2px dashed rgba(255, 255, 255, 0.3)',
    borderColor: 'transparent',
    // Outline the two sides relevant to the center lines (net & vertical)
    borderTopColor: isTopHalf ? 'transparent' : 'rgba(255, 255, 255, 0.3)', // Center line below top half
    borderBottomColor: isTopHalf ? 'rgba(255, 255, 255, 0.3)' : 'transparent', // Center line above bottom half
    borderLeftColor: isLeft ? 'transparent' : 'rgba(255, 255, 255, 0.3)',
    borderRightColor: isLeft ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
    
    boxSizing: 'border-box',
    pointerEvents: 'none',
    zIndex: 0,
  };
  
  return <div style={zoneStyle} />;
};


// --- Component Definition ---

const Court = ({ courtWidth, courtHeight, netTop, children }) => {
  
  // Calculate the position of the center line
  const centerHeight = courtHeight / 2;
  
  // Place service lines 1/5th of the court height away from the net/center line.
  const SERVICE_LINE_OFFSET = courtHeight / 5; 
  
  const p1ServiceLineTop = centerHeight + SERVICE_LINE_OFFSET; // Lower half (Player 1 side)
  const p2ServiceLineTop = centerHeight - SERVICE_LINE_OFFSET; // Upper half (Player 2 side)
  
  // Ensure netTop is defined before trying to render the Net component
  const calculatedNetTop = netTop !== undefined ? netTop : centerHeight;

  // Main court container style
  const courtStyle = {
    position: 'relative',
    width: courtWidth,
    height: courtHeight,
    // Enhanced Background: Deeper, more realistic green turf/grass gradient
    background: 'linear-gradient(to bottom, #72ab22, #5a8d1a)',
    border: '8px solid #f3f4f6', // Outer boundary line (light gray/white)
    boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.4)', // Inner shadow for depth
    borderRadius: '4px', // Slight rounding for aesthetic
    overflow: 'hidden',
    // Adding perspective for a 3D effect on the court
    transform: 'perspective(1000px) rotateX(4deg)',
    transformOrigin: 'center center',
  };
  
  // Baselines are placed 8px inside the court (to account for the 8px border)
  const BASELINE_HEIGHT = 4;
  const BORDER_THICKNESS = 8;
  const p2BaselineTop = BORDER_THICKNESS;
  const p1BaselineTop = courtHeight - BORDER_THICKNESS - BASELINE_HEIGHT;


  return (
    <div style={courtStyle}>
      
      {/* Structural Markings */}
      <CenterLine />
      <BaselineComponent courtWidth={courtWidth} top={p2BaselineTop} /> 
      <BaselineComponent courtWidth={courtWidth} top={p1BaselineTop} /> 

      {/* Visual Court Markings (Service Lines - Horizontal) */}
      <ServiceLineComponent top={p2ServiceLineTop} />
      <ServiceLineComponent top={p1ServiceLineTop} />
      
      {/* Quadrant Visuals (Boundary Markers for reference) */}
      {/* P2 Side Quadrants (Top Half) */}
      <QuadrantComponent courtWidth={courtWidth} centerHeight={centerHeight} side={'left'} topOffset={0} />
      <QuadrantComponent courtWidth={courtWidth} centerHeight={centerHeight} side={'right'} topOffset={0} />
      
      {/* P1 Side Quadrants (Bottom Half) */}
      <QuadrantComponent courtWidth={courtWidth} centerHeight={centerHeight} side={'left'} topOffset={centerHeight} />
      <QuadrantComponent courtWidth={courtWidth} centerHeight={centerHeight} side={'right'} topOffset={centerHeight} />
      
      {/* The Net (Crucial physical barrier) */}
      <NetComponent netTop={calculatedNetTop} />
      
      {/* Game elements (Ball, Paddles, etc.) rendered as children */}
      {children}
    </div>
  );
};

export default Court;

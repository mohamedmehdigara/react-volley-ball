import React from 'react';

// --- Helper Components using Inline Styles (Replacing styled-components) ---

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

// Component for the Net barrier
const NetComponent = ({ netTop }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: netTop,
      width: '100%',
      height: '4px', // Thickness of the net line
      backgroundColor: '#333', // Dark color for net base
      borderTop: '2px dashed #fff', // Dashed line for net cord visual
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
      zIndex: 10, // Ensure net is visually distinct
    }}
  />
);

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

// --- Component Definition ---

const Court = ({ courtWidth, courtHeight, netTop, children }) => {
  
  // Calculate the position of the service lines relative to the net.
  const centerHeight = courtHeight / 2;
  // Place service lines 1/5th of the court height away from the net/center line.
  const SERVICE_LINE_OFFSET = courtHeight / 5; 
  
  const p1ServiceLineTop = centerHeight + SERVICE_LINE_OFFSET; // Lower half (Player 1)
  const p2ServiceLineTop = centerHeight - SERVICE_LINE_OFFSET; // Upper half (Player 2)
  
  // Ensure netTop is defined before trying to render the Net component
  const calculatedNetTop = netTop !== undefined ? netTop : courtHeight / 2;

  // Main court container style (replaces StyledCourt)
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
  };

  return (
    <div style={courtStyle}>
      
      {/* Court markings (Center Line - Vertical) */}
      <CenterLine />

      {/* Visual Court Markings (Service Lines - Horizontal) */}
      <ServiceLineComponent top={p2ServiceLineTop} />
      <ServiceLineComponent top={p1ServiceLineTop} />
      
      {/* The Net (Crucial physical barrier) */}
      <NetComponent netTop={calculatedNetTop} />
      
      {/* Game elements (Ball, Paddles, etc.) */}
      {children}
    </div>
  );
};

export default Court;

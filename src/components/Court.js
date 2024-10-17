import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Court = () => {
  // Court dimensions
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 243; // Adjust to your desired net height
  const netWidth = 2;

  // Court lines
  const centerLineY = courtHeight / 2;
  const attackLineX = courtWidth / 4;
  const serviceLineX = courtWidth / 6;

  // Court styling
  const courtStyle = {
    width: `${courtWidth}px`,
    height: `${courtHeight}px`,
    border: '2px solid black',
    position: 'relative',
  };

  // Net styling
  const netStyle = {
    width: `${netWidth}px`,
    height: `${netHeight}px`,
    backgroundColor: 'black',
    position: 'absolute',
    left: `${courtWidth / 2}px`,
    top: '0',
  };

  // Line styling
  const lineStyle = {
    width: `${courtWidth}px`,
    height: '2px',
    backgroundColor: 'black',
    position: 'absolute',
  };

  return (
    <div style={courtStyle}>
      <div style={netStyle}></div>
      <div style={{ ...lineStyle, top: `${centerLineY}px` }}></div>
      <div style={{ ...lineStyle, left: `${attackLineX}px`, top: '0' }}></div>
      <div style={{ ...lineStyle, left: `${attackLineX}px`, top: `${courtHeight - 2}px` }}></div>
      <div style={{ ...lineStyle, left: `${serviceLineX}px`, top: '0' }}></div>
      <div style={{ ...lineStyle, left: `${serviceLineX}px`, top: `${courtHeight - 2}px` }}></div>
    </div>
  );
};

export default Court;
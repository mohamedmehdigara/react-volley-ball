import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Net = ({ height, width, left }) => {
  const netStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: 'black',
    position: 'absolute',
    left: `${left}px`,
    top: '0',
  };

  return <div style={netStyle}></div>;
};

export default Net;
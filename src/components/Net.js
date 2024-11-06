import React from 'react';
import styled from 'styled-components';

const NetContainer = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
`;

const Net = styled.div`
  width: 2px;
  height: 100%;
  background-color: black;
`;

export default () => (
  <NetContainer>
    <Net />
  </NetContainer>
);
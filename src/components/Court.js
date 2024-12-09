import styled from 'styled-components';

const Court = () => {
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 243;
  const netWidth = 2;
  const lineWidth = 2;

  const CourtContainer = styled.div`
    width: ${courtWidth}px;
    height: ${courtHeight}px;
    border: 2px solid black;
    position: relative;
    background-color: #f0f0f0; /* Light gray court surface */
  `;

  const Net = styled.div`
    width: ${netWidth}px;
    height: ${netHeight}px;
    background-color: black;
    position: absolute;
    left: ${courtWidth / 2}px;
    top: 0;
  `;

  const Line = styled.div`
    width: ${lineWidth}px;
    height: ${(props) => props.height}px;
    background-color: black;
    position: absolute;
    left: ${(props) => props.left}px;
    top: ${(props) => props.top}px;
  `;

  return (
    <CourtContainer>
      <Net />
      <Line height={`${courtHeight}px`} left={`${courtWidth / 2}px`} />
      <Line height={`${lineWidth}px`} left="0px" top={`${courtHeight / 2}px`} />
      <Line height={`${lineWidth}px`} left={`${courtWidth - lineWidth}px`} top={`${courtHeight / 2}px`} />
      <Line height={`${lineWidth}px`} left={`${courtWidth / 4}px`} top="0px" />
      <Line height={`${lineWidth}px`} left={`${courtWidth / 4}px`} top={`${courtHeight - lineWidth}px`} />
      <Line height={`${lineWidth}px`} left={`${courtWidth / 6}px`} top="0px" />
      <Line height={`${lineWidth}px`} left={`${courtWidth / 6}px`} top={`${courtHeight - lineWidth}px`} />
      <Line height={`${lineWidth}px`} left={`${courtWidth * 5 / 6}px`} top="0px" />
      <Line height={`${lineWidth}px`} left={`${courtWidth * 5 / 6}px`} top={`${courtHeight - lineWidth}px`} />
    </CourtContainer>
  );
};

export default Court;
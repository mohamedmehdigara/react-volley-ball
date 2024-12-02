import React, {useEffect} from 'react';

const LineJudge = ({ ballPosition, ballVelocity, courtWidth, courtHeight, netHeight, setScore, setFouls, setServingTeam, netWidth }) => {
  


  const ballRadius = 10;
  const netPosition = {
    x: courtWidth / 2 - netWidth / 2,
    y: 0,
    width: netWidth,
    height: netHeight,
  };
  const isBallOutOfBounds = () => {
    const { top, left } = ballPosition;
    return top - ballRadius < 0 || top + ballRadius > courtHeight || left - ballRadius < 0 || left + ballRadius > courtWidth;
  };

  const isBallInNet = () => {
    // Assuming ballPosition is an object with 'x' and 'y' properties
    const { x, y } = ballPosition;
  
    // Assuming netPosition is an object with 'x', 'y', 'width', and 'height' properties
    const { netX, netY, netWidth, netHeight } = netPosition;
  
    // Check if the ball's x-coordinate is within the net's boundaries
    if (x >= netX && x <= netX + netWidth) {
      // Check if the ball's y-coordinate is within a certain tolerance of the net's top or bottom
      const tolerance = 5; // Adjust tolerance as needed
      return y <= netHeight + tolerance || y >= courtHeight - netHeight - tolerance;
    }
  
    return false;
  };

  const isBallOnLine = () => {
    const { top, left } = ballPosition;
    const tolerance = 5; // Adjust tolerance as needed
  
    // Check if the ball is close to the top or bottom line
    if (Math.abs(top - ballRadius) < tolerance || Math.abs(top + ballRadius - courtHeight) < tolerance) {
      return true;
    }
  
    // Check if the ball is close to the side lines
    if (Math.abs(left - ballRadius) < tolerance || Math.abs(left + ballRadius - courtWidth) < tolerance) {
      return true;
    }
  
    // Check if the ball is close to the center line
    if (Math.abs(left - courtWidth / 2) < tolerance) {
      return true;
    }
  
    // Check if the ball is close to the service lines
    if (Math.abs(left - courtWidth / 4) < tolerance || Math.abs(left - 3 * courtWidth / 4) < tolerance) {
      return true;
    }
  
    return false;
  };

  useEffect(() => {
    if (isBallOutOfBounds()) {
      const scoringTeam = ballPosition.left < courtWidth / 2 ? 1 : 2;
      setScore((prevScore) => ({ ...prevScore, [`team${scoringTeam}Score`]: prevScore[`team${scoringTeam}Score`] + 1 }));
    } else if (isBallInNet()) {
      const servingTeam = ballPosition.left < courtWidth / 2 ? 1 : 2;
      const penalizedTeam = servingTeam === 1 ? 2 : 1;

      setScore((prevScore) => ({
        ...prevScore,
        [`team${penalizedTeam}Score`]: prevScore[`team${penalizedTeam}Score`] - 1,
      }));

      // Set the serving team to the other team
      setServingTeam(penalizedTeam);
    } else if (isBallOnLine()) {
      // Replay the point
      setPosition(initialPosition);
      setSpeed(initialSpeed);
      setDirection(initialDirection);
      setSpinX(0);
      setSpinY(0);
    }
  }, [ballPosition, ballVelocity, setScore, setFouls, setServingTeam]);

  return null;
};

export default LineJudge;
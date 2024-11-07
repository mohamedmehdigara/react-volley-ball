import React, { useEffect } from 'react';

const Referee = ({ ballPosition, player1Position, player2Position, setScore }) => {
  const courtWidth = 800;
  const courtHeight = 400;
  const netHeight = 243;
  const ballRadius = 10;

  const isBallOutOfBounds = () => {
    const { top, left } = ballPosition;
    return (
      top - ballRadius < 0 ||
      top + ballRadius > courtHeight ||
      left - ballRadius < 0 ||
      left + ballRadius > courtWidth
    );
  };

  const isNetTouched = () => {
    // Implement more complex logic here, considering player positions, ball trajectory, etc.
    // For example, you could check if a player's position is close to the net
    // and the ball is moving towards the net at the same time.
    return false; // Placeholder for now
  };

  useEffect(() => {
    if (isBallOutOfBounds()) {
      const scoringTeam = ballPosition.left < courtWidth / 2 ? 1 : 2;
      setScore((prevScore) => ({ ...prevScore, [`team${scoringTeam}Score`]: prevScore[`team${scoringTeam}Score`] + 1 }));
    } else if (isNetTouched()) {
      // Implement logic to penalize the fouling team
      // For example, you could lose a point or serve out of turn
      // You might need to track the serving team and other game state information
    }
  }, [ballPosition, player1Position, player2Position, setScore]);

  return null; // No visual representation needed, referee works behind the scenes
};

export default Referee;
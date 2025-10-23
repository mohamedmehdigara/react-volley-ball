import React, { useEffect, useCallback, useRef } from 'react';

// --- Physics and Core Constants ---
const BALL_RADIUS = 10;
const G_EFFECTIVE = 0.5 / 10; // Gravity effect per frame
const AIR_DAMPING = 0.9995; // Slight energy loss due to air resistance
const PADDLE_COLLISION_DAMPING = 1.01; // Can slightly increase speed on hit for dynamics
const NET_COLLISION_DAMPING = 0.7; // Significant speed loss on net hit
const MAX_VERTICAL_INFLUENCE = 0.4; // Max vertical push/pull from spin/angle
const COLLISION_DAMPING = 0.9; // Horizontal wall bounce speed loss

// --- Component Definition ---
const Ball = ({
  // FIX: Added default value for position to prevent "Cannot read properties of undefined (reading 'top')" error
  position = { top: 0, left: 0 }, // Current position
  speed,    // Current speed
  direction, // Current direction vector
  courtWidth,
  courtHeight,
  netTop,
  onPaddleCollision,
  outOfBounds,
  player1Paddle,
  player2Paddle,
  onBallUpdate, 
  paddleHeight,
  isServed,
}) => {
  // Local state for spin: this is what gets CALCULATED on collision and APPLIED on the next tick
  const [spinY, setSpinY] = React.useState(0); 
  // Ref to hold all volatile data (props and state) for the stable animation loop
  const latestRef = useRef({});

  const C = courtWidth / 2; 
  const R = BALL_RADIUS;

  // 1. Update the ref on every render with the freshest data
  useEffect(() => {
    latestRef.current = {
      position, speed, direction, courtWidth, courtHeight, netTop,
      onPaddleCollision, outOfBounds, player1Paddle, player2Paddle,
      onBallUpdate, paddleHeight, isServed, spinY, setSpinY,
      C, R,
    };
  });


  // --- PADDLE COLLISION LOGIC (Pure Geometry Check) ---
  // Replaced external SAT library with native circle-rectangle collision logic
  const checkPaddleCollision = useCallback((ballPos, paddle, isP1, currentDir, currentSpeed) => {
    
    // Ball's center coordinates (top/left props define the top-left corner of the ball div)
    const ballCenterX = ballPos.left + R;
    const ballCenterY = ballPos.top + R;

    // Check if the ball is on the correct side of the court for the paddle
    if (!paddle || (isP1 && ballCenterX > C) || (!isP1 && ballCenterX < C)) {
        return { newDir: currentDir, newSpeed: currentSpeed, hit: false };
    }

    // 1. Find the closest point (closestX, closestY) on the paddle to the ball center
    const closestX = Math.max(paddle.x, Math.min(ballCenterX, paddle.x + paddle.width));
    const closestY = Math.max(paddle.y, Math.min(ballCenterY, paddle.y + paddle.height));

    // 2. Calculate the distance between the closest point and the ball center
    const distX = ballCenterX - closestX;
    const distY = ballCenterY - closestY;

    // 3. Use Pythagorean theorem for squared distance
    const distanceSquared = (distX * distX) + (distY * distY);

    if (distanceSquared < R * R) {
      
      // Collision occurred!
      // 1. Calculate the vertical influence (Spin/Bounce Angle)
      // Hit Y relative to paddle center: negative for top half, positive for bottom half
      const hitY = ballCenterY - (paddle.y + paddle.height / 2);
      
      // Normalize hitY to be between -1 (top edge) and +1 (bottom edge)
      const normalizedHitY = hitY / (paddle.height / 2); 
      
      // 2. Set the spin for the next frame
      setSpinY(normalizedHitY * MAX_VERTICAL_INFLUENCE); 
      
      // 3. Calculate new direction vector (X always reverses)
      const newX = -currentDir.x; 

      // 4. Dampen the speed slightly and enforce a minimum speed
      const newSpeed = Math.max(1, currentSpeed * PADDLE_COLLISION_DAMPING);

      // Callback to parent
      onPaddleCollision(isP1 ? 'player1' : 'player2');
      
      return { newDir: { x: newX, y: currentDir.y }, newSpeed, hit: true };
    }
    return { newDir: currentDir, newSpeed: currentSpeed, hit: false };
  }, [onPaddleCollision, R, C, paddleHeight]);


  // --- Animation Loop Setup (Runs only once) ---
  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      // Read current state from the latest ref
      const {
        position, speed, direction, courtWidth, courtHeight, netTop,
        outOfBounds, player1Paddle, player2Paddle, onBallUpdate, isServed,
        spinY, C, R
      } = latestRef.current;

      // Only run physics if the ball is served (speed > 0)
      if (speed <= 0 || !isServed) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      let currentPos = position;
      let currentSpeed = speed;
      let currentDir = direction;

      // 1. APPLY PHYSICS
      // Apply air resistance damping
      let s = currentSpeed * AIR_DAMPING; 
      
      // Apply Gravity and Spin (Spin is the angle/vertical influence from the previous paddle hit)
      let newDir = { 
        x: currentDir.x, 
        y: currentDir.y + G_EFFECTIVE + spinY 
      };
      
      // Reset spin after application
      setSpinY(0); 

      let newTop = currentPos.top + s * newDir.y;
      let newLeft = currentPos.left + s * newDir.x;
      
      // --- COLLISION CHECKS ---

      // 2. FLOOR BOUNDARY SCORING (Ball bottom edge)
      if (newTop + R * 2 >= courtHeight) {
        outOfBounds(newLeft + R < C ? 'player2' : 'player1');
        return; // End animation loop immediately for scoring
      }

      // 3. NET COLLISION (Net is located at X=C, Y=netTop)
      // Check if the ball center is near the net (within R+5 distance horizontally) and below netTop
      const ballCenter = newLeft + R;
      if (newTop + R >= netTop && Math.abs(ballCenter - C) < R + 5) {
        
        // Only bounce if the ball is moving towards the opposite court (X changes sign over the net)
        if ((ballCenter < C && newDir.x > 0) || (ballCenter > C && newDir.x < 0)) {
            // Reverse X direction, slightly dampen Y direction (bounce up)
            newDir.x = -newDir.x;
            newDir.y = -Math.abs(newDir.y) * 0.5; 
            s = s * NET_COLLISION_DAMPING; // Loss of speed
            
            // Push the ball away from the net to prevent sticking
            newLeft += newDir.x * s * 2;
        } else {
             // Fault/Out of Bounds (e.g., player hits net on their side or hits net while moving back)
             outOfBounds(newLeft + R < C ? 'player1' : 'player2');
             return; // End animation loop immediately for scoring
        }
      }
      
      // 4. HORIZONTAL WALL BOUNCE (Ball left/right edges)
      if (newLeft <= 0 || newLeft + R * 2 >= courtWidth) {
          newDir.x = -newDir.x;
          // Clamp position to ensure it doesn't get stuck in the wall
          newLeft = Math.max(0, Math.min(courtWidth - R * 2, newLeft)); 
          s = s * COLLISION_DAMPING;
      }

      // 5. PADDLE COLLISION (Updates newDir and s if collision occurs)
      let result = checkPaddleCollision({ top: newTop, left: newLeft }, player1Paddle, true, newDir, s);
      newDir = result.newDir;
      s = result.newSpeed;
      
      // Only check Player 2 if Player 1 didn't hit it in the same frame
      if (!result.hit) {
          result = checkPaddleCollision({ top: newTop, left: newLeft }, player2Paddle, false, newDir, s);
          newDir = result.newDir;
          s = result.newSpeed;
      }
      
      // Apply movement based on final speed and direction
      newTop = currentPos.top + s * newDir.y;
      newLeft = currentPos.left + s * newDir.x;

      // 6. Update Parent State
      onBallUpdate({ position: { top: newTop, left: newLeft }, speed: s, direction: newDir });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
    
  // The dependencies are only the stable functions/constants defined outside the loop
  }, [checkPaddleCollision]);

  // The return statement renders the ball at its current position using inline styling
  const ballStyle = {
    width: R * 2,
    height: R * 2,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #fff, #f0f0f0)',
    border: '1px solid #ccc',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
    position: 'absolute',
    top: position.top,
    left: position.left,
    transition: 'transform 0.01s linear', 
    willChange: 'transform, left, top',
  };

  return <div style={ballStyle} />;
};

export default Ball;
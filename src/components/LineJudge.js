import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// --- Constants for Line Detection ---
const BALL_RADIUS = 10;
const FLOOR_TOLERANCE = 1; // How close to the court height the ball must be to register a landing
const LINE_WIDTH_CHECK = 5; // Effective width of court lines for "in/out" determination (on the line is IN)

/**
 * Utility function to determine if the ball landed in-bounds or out-of-bounds.
 * * @param {object} ballPos - { top, left } of the ball's top-left corner
 * @param {number} courtW - Court width
 * @param {number} courtH - Court height (floor Y coordinate)
 * @param {number} ballR - Ball radius
 * @returns {{ isOut: boolean, scoringTeam: 1 | 2, reason: string }}
 */
const determineLandingOutcome = (ballPos, courtW, courtH, ballR) => {
    const ballCenter = ballPos.left + ballR;
    const isP1Side = ballCenter < courtW / 2;
    
    // Volleyball Rule: The ball must land within the boundary lines (or on them).

    // 1. Check X-axis (Side Boundaries)
    // The ball is OUT if its center is beyond the side lines.
    const isOutsideSidelines = ballPos.left < 0 || ballPos.left + ballR * 2 > courtW;
    
    // 2. Check Y-axis (End Boundaries)
    // The ball is OUT if its center is past the back boundary (court height).
    // Note: Ball.js already handles the point where ballTop + 2*R >= courtHeight.
    // Here we check if the ball landed *beyond* the boundary.
    // Since the Ball component takes it out of bounds when it hits courtH, this check is primarily
    // for determining which team scores based on the location relative to the court edges.
    
    // If the ball landed on the P1 side (left half), P2 (right half) scored if the landing was IN.
    // If the ball landed on the P1 side (left half), P1 (left half) scored if the landing was OUT.
    
    // Scoring logic:
    let scoringTeam = 0;
    let reason = 'In Bounds';
    let isOut = false;

    // The entire ball must be past the line to be OUT.
    const ballBottom = ballPos.top + ballR * 2;
    
    // In a simple 2D game, the ball is "out" only if it lands outside the court boundary.
    // The Ball component calls outOfBounds when it hits the floor. We just confirm *why*.

    // Simplified In/Out Rule for the whole court:
    // If the ball landed outside the main court perimeter (which is just side walls here)
    if (isOutsideSidelines) {
        isOut = true;
        reason = 'Side Out';
        // If it landed on P1's side (left), P2 gets the point (as P1 failed to retrieve it).
        // This scoring logic is the opposite of the floor-hit logic in Ball.js.
        // If the ball went out on P1's side, it means P2 hit it too wide or P1 let it go. P2 gets the point.
        scoringTeam = isP1Side ? 2 : 1;
    } else {
        // Ball landed INBOUNDS on a specific side. The player on the *other* side wins the point.
        // If it landed on P1's side (left), P2 wins.
        scoringTeam = isP1Side ? 2 : 1; 
    }

    return { isOut, scoringTeam, reason };
};


/**
 * Line Judge component listens for the moment the ball hits the floor 
 * and determines the scoring outcome.
 */
const LineJudge = ({ 
    ballPosition, 
    ballVelocity, 
    courtWidth, 
    courtHeight, 
    netTop, // Included for context, but net collision is handled by Ball.js
    isBallServed,
    onPointScored // New prop: (scoringTeam: 1|2, reason: string) => void
}) => {
    
    const lastTopRef = useRef(ballPosition.top);
    const hasLandedRef = useRef(false);
    const R = BALL_RADIUS;

    useEffect(() => {
        // Deconstruct current position for readability
        const { top, left } = ballPosition;
        const ballBottom = top + R * 2;

        // 1. Check if the ball has hit the floor
        const isLanding = ballBottom >= courtHeight - FLOOR_TOLERANCE;
        
        // Ensure we only trigger the scoring logic once per landing event
        if (isLanding && !hasLandedRef.current) {
            
            // Mark as landed
            hasLandedRef.current = true;
            
            // Determine the outcome of the landing
            const { scoringTeam, reason } = determineLandingOutcome(ballPosition, courtWidth, courtHeight, R);

            // Notify the parent component of the score
            onPointScored(scoringTeam, reason);

        } else if (!isLanding && hasLandedRef.current) {
            // Ball is airborne again (or game reset): reset landing state
            hasLandedRef.current = false;
        }

        // Update the last position for the next check
        lastTopRef.current = top;

    }, [ballPosition, courtHeight, courtWidth, onPointScored]);

    // Cleanup: Check if the ball is served or game is active to ensure the Ref is reset
    useEffect(() => {
        if (!isBallServed) {
            hasLandedRef.current = false;
        }
    }, [isBallServed]);

    // The LineJudge is a logic component and renders nothing
    return null;
};

LineJudge.propTypes = {
    ballPosition: PropTypes.shape({
        top: PropTypes.number.isRequired,
        left: PropTypes.number.isRequired,
    }).isRequired,
    // ballVelocity is useful for detecting bounce/fall, but for landing we rely on position
    ballVelocity: PropTypes.object, 
    courtWidth: PropTypes.number.isRequired,
    courtHeight: PropTypes.number.isRequired,
    netTop: PropTypes.number.isRequired,
    isBallServed: PropTypes.bool.isRequired,
    // The main way to communicate scoring back to the game state
    onPointScored: PropTypes.func.isRequired, 
};

export default LineJudge;
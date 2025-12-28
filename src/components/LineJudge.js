import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// --- Constants for Line Detection ---
const BALL_RADIUS = 10;
const FLOOR_TOLERANCE = 2; // Pixel tolerance for floor hit
const MARK_DURATION = 1500; // How long the "IN/OUT" visual stays on screen

/**
 * Utility function to determine if the ball landed in-bounds or out-of-bounds.
 */
const determineLandingOutcome = (ballPos, courtW, courtH, ballR) => {
    const ballCenterX = ballPos.left + ballR;
    const isP1Side = ballCenterX < courtW / 2;
    
    // Volleyball Rule: Ball is IN if any part of it touches the line.
    // In our 2D top-down perspective, the boundary is [0, courtW]
    const isOutsideSidelines = ballPos.left < 0 || ballPos.left + ballR * 2 > courtW;
    
    let scoringTeam = 0;
    let reason = 'In Bounds';
    let isOut = false;

    if (isOutsideSidelines) {
        isOut = true;
        reason = 'Out of Bounds';
        // If it lands outside on P1's side, P2 likely hit it out OR P1 failed to touch it.
        // In standard arcade logic: if it's OUT on your side, you get the point (opponent hit it out).
        scoringTeam = isP1Side ? 1 : 2;
    } else {
        // Ball landed IN on your side: Opponent gets the point.
        isOut = false;
        reason = 'In Bounds';
        scoringTeam = isP1Side ? 2 : 1; 
    }

    return { isOut, scoringTeam, reason };
};

/**
 * Line Judge component: Logic + Visual Feedback
 */
const LineJudge = ({ 
    ballPosition, 
    courtWidth, 
    courtHeight, 
    isBallServed,
    onPointScored 
}) => {
    const [landingMark, setLandingMark] = useState(null);
    const hasLandedRef = useRef(false);
    const R = BALL_RADIUS;

    useEffect(() => {
        const { top, left } = ballPosition;
        const ballBottom = top + R * 2;

        // 1. Detect Floor Contact
        const isLanding = ballBottom >= courtHeight - FLOOR_TOLERANCE;
        
        if (isLanding && !hasLandedRef.current && isBallServed) {
            hasLandedRef.current = true;
            
            const outcome = determineLandingOutcome(ballPosition, courtWidth, courtHeight, R);

            // Create a visual mark at the landing spot
            setLandingMark({
                x: left + R,
                y: courtHeight,
                isOut: outcome.isOut,
                id: Date.now()
            });

            // Trigger the scoring callback
            onPointScored(outcome.scoringTeam, outcome.reason);

            // Clear visual mark after duration
            setTimeout(() => {
                setLandingMark(null);
            }, MARK_DURATION);

        } else if (!isLanding && hasLandedRef.current) {
            // Reset for next potential bounce or serve
            hasLandedRef.current = false;
        }

    }, [ballPosition, courtHeight, courtWidth, isBallServed, onPointScored]);

    // Reset judge state when service resets
    useEffect(() => {
        if (!isBallServed) {
            hasLandedRef.current = false;
            setLandingMark(null);
        }
    }, [isBallServed]);

    // Visual feedback layer
    if (!landingMark) return null;

    return (
        <div style={{
            position: 'absolute',
            left: landingMark.x - 20,
            top: landingMark.y - 10,
            pointerEvents: 'none',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'fadeInOut 1.5s ease-out forwards'
        }}>
            {/* The landing "impact" shadow */}
            <div style={{
                width: '40px',
                height: '10px',
                background: landingMark.isOut ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
                borderRadius: '50%',
                filter: 'blur(2px)'
            }} />
            
            {/* Floating text label */}
            <div style={{
                color: landingMark.isOut ? '#ef4444' : '#22c55e',
                fontWeight: '900',
                fontSize: '14px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                marginTop: '-25px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: `1px solid ${landingMark.isOut ? '#ef4444' : '#22c55e'}`
            }}>
                {landingMark.isOut ? 'OUT' : 'IN'}
            </div>

            <style>{`
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(10px); }
                    15% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-20px); }
                }
            `}</style>
        </div>
    );
};

LineJudge.propTypes = {
    ballPosition: PropTypes.shape({
        top: PropTypes.number.isRequired,
        left: PropTypes.number.isRequired,
    }).isRequired,
    courtWidth: PropTypes.number.isRequired,
    courtHeight: PropTypes.number.isRequired,
    isBallServed: PropTypes.bool.isRequired,
    onPointScored: PropTypes.func.isRequired, 
};

export default LineJudge;
import React, { useMemo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Crowd Component
 * Adds a reactive, procedural audience to the sidelines.
 * Spectators react to ball speed and scoring events.
 */

const Spectator = ({ x, y, color, excitement, isCheering }) => {
    const bounceOffset = isCheering ? Math.sin(Date.now() / 50 + x) * 10 - 10 : 0;
    const swayOffset = Math.sin(Date.now() / 1000 + x) * 2;

    return (
        <div style={{
            position: 'absolute',
            left: x,
            top: y + bounceOffset,
            transform: `translateX(${swayOffset}px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'top 0.1s ease-out',
            pointerEvents: 'none',
        }}>
            {/* Head */}
            <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: color,
                border: '1px solid rgba(0,0,0,0.2)'
            }} />
            {/* Body */}
            <div style={{
                width: 16,
                height: 14,
                borderRadius: '4px 4px 0 0',
                backgroundColor: color,
                filter: 'brightness(0.8)',
                marginTop: -2
            }} />
        </div>
    );
};

const Crowd = ({ courtWidth, courtHeight, ballSpeed, lastEvent }) => {
    const [isCheering, setIsCheering] = useState(false);
    
    // Procedural generation of crowd members
    const spectators = useMemo(() => {
        const list = [];
        const rows = 2;
        const spacing = 25;
        const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'];

        for (let r = 0; r < rows; r++) {
            for (let x = 0; x < courtWidth; x += spacing) {
                list.push({
                    id: `${r}-${x}`,
                    x: x + (Math.random() * 10 - 5),
                    y: -30 - (r * 20), // Positioned above the court
                    color: colors[Math.floor(Math.random() * colors.length)],
                });
            }
        }
        return list;
    }, [courtWidth]);

    // React to game events (Scoring or high-speed spikes)
    useEffect(() => {
        if (lastEvent === 'point' || ballSpeed > 25) {
            setIsCheering(true);
            const timer = setTimeout(() => setIsCheering(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [lastEvent, ballSpeed]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: courtWidth,
            height: 0,
            overflow: 'visible',
            zIndex: 1, // Behind the net and players
        }}>
            {/* Crowd Background/Bleachers */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: 60,
                background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
                borderRadius: '8px 8px 0 0',
                transform: 'translateY(-100%)',
                borderBottom: '4px solid #334155'
            }} />

            {spectators.map(s => (
                <Spectator 
                    key={s.id} 
                    {...s} 
                    isCheering={isCheering} 
                />
            ))}
        </div>
    );
};

Crowd.propTypes = {
    courtWidth: PropTypes.number.isRequired,
    courtHeight: PropTypes.number.isRequired,
    ballSpeed: PropTypes.number,
    lastEvent: PropTypes.string, // e.g., 'point', 'spike', 'idle'
};

export default Crowd;
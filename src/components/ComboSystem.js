import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * ComboSystem Component
 * Tracks consecutive hits and provides visual feedback for "Hot Streaks".
 */
const ComboSystem = ({ lastCollision, ballSpeed, onComboUpdate }) => {
    const [comboCount, setComboCount] = useState(0);
    const [displayScale, setDisplayScale] = useState(1);
    const [isHot, setIsHot] = useState(false);
    
    const lastCollisionRef = useRef(null);

    useEffect(() => {
        if (!lastCollision) {
            setComboCount(0);
            setIsHot(false);
            return;
        }

        // Increment combo if the collision is different from the last one (Volley logic)
        // Or if it's a high-speed consecutive hit
        if (lastCollision !== lastCollisionRef.current || ballSpeed > 20) {
            setComboCount(prev => {
                const newCount = prev + 1;
                if (onComboUpdate) onComboUpdate(newCount);
                return newCount;
            });
            
            // Trigger a visual "pop" animation
            setDisplayScale(1.5);
            setTimeout(() => setDisplayScale(1), 200);
        }

        lastCollisionRef.current = lastCollision;
    }, [lastCollision, ballSpeed, onComboUpdate]);

    useEffect(() => {
        // "Hot" state threshold (e.g., 5 consecutive volleys)
        if (comboCount >= 5) {
            setIsHot(true);
        } else {
            setIsHot(false);
        }
    }, [comboCount]);

    if (comboCount < 2) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: `translateX(-50%) scale(${displayScale})`,
            pointerEvents: 'none',
            textAlign: 'center',
            transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: 50,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: '900',
            fontStyle: 'italic',
        }}>
            <div style={{
                fontSize: '48px',
                color: isHot ? '#f59e0b' : '#fff',
                textShadow: isHot 
                    ? '0 0 20px #ef4444, 4px 4px 0px #7c2d12' 
                    : '2px 2px 0px #000',
                WebkitTextStroke: isHot ? '1px #fff' : 'none',
            }}>
                {comboCount}x COMBO
            </div>
            
            {isHot && (
                <div style={{
                    fontSize: '18px',
                    color: '#fcd34d',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    marginTop: '-10px',
                    animation: 'pulse 0.5s infinite alternate'
                }}>
                    On Fire!
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    from { opacity: 0.6; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
};

ComboSystem.propTypes = {
    lastCollision: PropTypes.string, // 'player1', 'player2', 'wall'
    ballSpeed: PropTypes.number,
    onComboUpdate: PropTypes.func,
};

export default ComboSystem;
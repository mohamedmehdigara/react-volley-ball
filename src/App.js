import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

/** --- CONSTANTS --- */
const COURT_WIDTH = 800;
const COURT_HEIGHT = 500;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 30;
const BALL_RADIUS = 10;
const G_EFFECTIVE = 0.15; 
const WALL_FRICTION = 0.95;
const AIR_DAMPING = 0.995;
const JUMP_HEIGHT = 60;
const JUMP_DURATION_MS = 400;

/** --- COMPONENT: ComboSystem --- */
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
        if (lastCollision !== lastCollisionRef.current) {
            setComboCount(prev => {
                const newCount = prev + 1;
                if (onComboUpdate) onComboUpdate(newCount);
                return newCount;
            });
            setDisplayScale(1.5);
            const timer = setTimeout(() => setDisplayScale(1), 200);
            return () => clearTimeout(timer);
        }
        lastCollisionRef.current = lastCollision;
    }, [lastCollision, onComboUpdate]);

    useEffect(() => {
        setIsHot(comboCount >= 5);
    }, [comboCount]);

    if (comboCount < 2) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '15%',
            left: '50%',
            transform: `translateX(-50%) scale(${displayScale})`,
            pointerEvents: 'none',
            textAlign: 'center',
            zIndex: 100,
            fontFamily: 'sans-serif',
            fontWeight: '900',
            fontStyle: 'italic',
            color: isHot ? '#f59e0b' : '#fff',
            textShadow: isHot ? '0 0 20px #ef4444, 4px 4px 0px #7c2d12' : '2px 2px 0px #000',
        }}>
            <div style={{ fontSize: '48px' }}>{comboCount}x COMBO</div>
            {isHot && <div style={{ fontSize: '18px', color: '#fcd34d' }}>ON FIRE!</div>}
        </div>
    );
};

/** --- COMPONENT: Court --- */
const Court = ({ children }) => (
    <div style={{
        width: COURT_WIDTH,
        height: COURT_HEIGHT,
        backgroundColor: '#d2b48c',
        backgroundImage: 'linear-gradient(to bottom, #d2b48c, #8b5a2b)',
        position: 'relative',
        border: '10px solid #334155',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.3)'
    }}>
        {/* Attack Lines */}
        <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: '2px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
        <div style={{ position: 'absolute', right: '30%', top: 0, bottom: 0, width: '2px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
        
        {/* Net Posts */}
        <div style={{ position: 'absolute', left: '50%', bottom: 0, width: '8px', height: '60%', backgroundColor: '#444', transform: 'translateX(-50%)', zIndex: 10 }}>
            {/* Net Mesh */}
            <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: -200, 
                width: 400, 
                height: 40, 
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.2) 5px, rgba(255,255,255,0.2) 6px)',
                borderTop: '3px solid white',
                borderBottom: '1px solid #999'
            }} />
        </div>
        
        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '4px', backgroundColor: '#475569' }} />
        {children}
    </div>
);

/** --- COMPONENT: Character --- */
const Character = ({ x, y, color, isFlashing, label }) => (
    <div style={{
        position: 'absolute',
        left: x,
        top: y,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        backgroundColor: color,
        borderRadius: '8px',
        boxShadow: isFlashing ? `0 0 25px ${color}` : '0 4px 10px rgba(0,0,0,0.3)',
        transition: 'background-color 0.1s, top 0.1s ease-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        paddingTop: '5px',
        zIndex: 15
    }}>
        <div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '50%', marginBottom: '4px' }} />
        {label}
    </div>
);

/** --- MAIN APP --- */
const App = () => {
    const [score, setScore] = useState({ p1: 0, ai: 0 });
    const [lastCollision, setLastCollision] = useState(null);
    const [isServed, setIsServed] = useState(false);
    const [isP1Jumping, setIsP1Jumping] = useState(false);
    const [isAIJumping, setIsAIJumping] = useState(false);

    const [ball, setBall] = useState({
        pos: { top: 150, left: COURT_WIDTH * 0.75 },
        speed: 0,
        dir: { x: 0, y: 0 },
        rotation: 0
    });

    const [p1, setP1] = useState({ x: COURT_WIDTH * 0.7, y: COURT_HEIGHT - PADDLE_HEIGHT });
    const [ai, setAi] = useState({ x: COURT_WIDTH * 0.2, y: COURT_HEIGHT - PADDLE_HEIGHT });

    const physicsRef = useRef({ ball, p1, ai });

    const handleJump = useCallback((side) => {
        if (side === 'p1' && !isP1Jumping) {
            setIsP1Jumping(true);
            setTimeout(() => setIsP1Jumping(false), JUMP_DURATION_MS);
        } else if (side === 'ai' && !isAIJumping) {
            setIsAIJumping(true);
            setTimeout(() => setIsAIJumping(false), JUMP_DURATION_MS);
        }
    }, [isP1Jumping, isAIJumping]);

    // Keyboard handling
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isServed && (e.code === 'Space' || e.code === 'ArrowUp')) {
                setIsServed(true);
                setBall(prev => ({ ...prev, speed: 6, dir: { x: -1, y: -0.5 } }));
                return;
            }
            
            if (e.key === 'ArrowLeft') {
                setP1(prev => ({ ...prev, x: Math.max(COURT_WIDTH / 2 + 10, prev.x - 25) }));
            }
            if (e.key === 'ArrowRight') {
                setP1(prev => ({ ...prev, x: Math.min(COURT_WIDTH - PADDLE_WIDTH, prev.x + 25) }));
            }
            if (e.key === 'ArrowUp' || e.code === 'Space') {
                handleJump('p1');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isServed, handleJump]);

    // AI Logic Loop
    useEffect(() => {
        const aiInterval = setInterval(() => {
            const { ball: b } = physicsRef.current;
            setAi(prev => {
                const targetX = b.pos.left - PADDLE_WIDTH / 2;
                const limitedTargetX = Math.max(0, Math.min(COURT_WIDTH / 2 - PADDLE_WIDTH - 15, targetX));
                const diff = limitedTargetX - prev.x;
                const speed = 6;
                const move = Math.abs(diff) < speed ? diff : Math.sign(diff) * speed;

                if (b.pos.left < COURT_WIDTH / 2 && b.pos.top < COURT_HEIGHT * 0.6 && Math.random() > 0.96) {
                    handleJump('ai');
                }

                return { ...prev, x: prev.x + move };
            });
        }, 16);
        return () => clearInterval(aiInterval);
    }, [handleJump]);

    // Physics Engine Loop
    useEffect(() => {
        if (!isServed) return;
        let rafId;

        const update = () => {
            const { ball: b, p1: p, ai: a } = physicsRef.current;
            
            // Calculate real-time Y position for hitbox
            const p1RealY = isP1Jumping ? COURT_HEIGHT - PADDLE_HEIGHT - JUMP_HEIGHT : COURT_HEIGHT - PADDLE_HEIGHT;
            const aiRealY = isAIJumping ? COURT_HEIGHT - PADDLE_HEIGHT - JUMP_HEIGHT : COURT_HEIGHT - PADDLE_HEIGHT;

            let nTop = b.pos.top + b.dir.y * b.speed;
            let nLeft = b.pos.left + b.dir.x * b.speed;
            let nDir = { ...b.dir };
            let nSpd = b.speed * AIR_DAMPING;
            
            nDir.y += G_EFFECTIVE;

            // Side Walls
            if (nLeft <= 0 || nLeft + BALL_RADIUS * 2 >= COURT_WIDTH) {
                nDir.x *= -1;
                nLeft = nLeft <= 0 ? 0 : COURT_WIDTH - BALL_RADIUS * 2;
                nSpd *= WALL_FRICTION;
            }

            // Net Collision (Center obstacle)
            if (nLeft + BALL_RADIUS * 2 > COURT_WIDTH / 2 - 4 && nLeft < COURT_WIDTH / 2 + 4 && nTop > COURT_HEIGHT * 0.4) {
                nDir.x *= -1;
                nSpd *= 0.8;
            }

            // Floor Collision / Scoring
            if (nTop + BALL_RADIUS * 2 >= COURT_HEIGHT) {
                const winner = nLeft > COURT_WIDTH / 2 ? 'ai' : 'p1';
                setScore(s => ({ ...s, [winner]: s[winner] + 1 }));
                setIsServed(false);
                setLastCollision(null);
                setBall({
                    pos: { top: 150, left: winner === 'p1' ? COURT_WIDTH * 0.25 : COURT_WIDTH * 0.75 },
                    speed: 0,
                    dir: { x: 0, y: 0 },
                    rotation: 0
                });
                return;
            }

            // Paddle Hitbox Check
            const checkCollision = (charX, charY, isP1) => {
                if (nLeft + BALL_RADIUS * 2 > charX && nLeft < charX + PADDLE_WIDTH &&
                    nTop + BALL_RADIUS * 2 > charY && nTop < charY + PADDLE_HEIGHT) {
                    
                    nDir.x = isP1 ? -Math.abs(nDir.x) - 0.2 : Math.abs(nDir.x) + 0.2;
                    nDir.y = -1.2; 
                    nSpd = Math.min(nSpd * 1.1, 15);
                    setLastCollision(isP1 ? 'player1' : 'player2');
                }
            };

            checkCollision(p.x, p1RealY, true);
            checkCollision(a.x, aiRealY, false);

            const newBall = {
                pos: { top: nTop, left: nLeft },
                speed: nSpd,
                dir: nDir,
                rotation: b.rotation + nSpd * 5
            };

            physicsRef.current.ball = newBall;
            setBall(newBall);
            rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [isServed, isP1Jumping, isAIJumping]);

    // Sync state to physics ref
    useEffect(() => {
        physicsRef.current.p1 = p1;
        physicsRef.current.ai = ai;
    }, [p1, ai]);

    return (
        <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden select-none">
            <div className="mb-6 flex gap-12 text-white text-5xl font-black font-mono italic">
                <div className="flex flex-col items-center">
                    <span className="text-sm uppercase text-purple-400 not-italic font-sans">CPU</span>
                    {score.ai}
                </div>
                <div className="text-slate-600 self-end mb-2">VS</div>
                <div className="flex flex-col items-center">
                    <span className="text-sm uppercase text-blue-400 not-italic font-sans">YOU</span>
                    {score.p1}
                </div>
            </div>

            <div className="relative">
                <Court>
                    <Character 
                        x={ai.x} 
                        y={isAIJumping ? COURT_HEIGHT - PADDLE_HEIGHT - JUMP_HEIGHT : ai.y} 
                        color="#a855f7" 
                        label="AI"
                        isFlashing={lastCollision === 'player2'} 
                    />
                    <Character 
                        x={p1.x} 
                        y={isP1Jumping ? COURT_HEIGHT - PADDLE_HEIGHT - JUMP_HEIGHT : p1.y} 
                        color="#3b82f6" 
                        label="YOU"
                        isFlashing={lastCollision === 'player1'} 
                    />
                    
                    {/* Ball Shadow */}
                    <div style={{
                        position: 'absolute',
                        left: ball.pos.left + 5,
                        bottom: 0,
                        width: BALL_RADIUS * 2,
                        height: 4,
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '50%',
                        transform: `scale(${Math.max(0.1, 1 - (COURT_HEIGHT - ball.pos.top) / COURT_HEIGHT)})`,
                        zIndex: 5
                    }} />

                    {/* The Ball */}
                    <div style={{
                        position: 'absolute',
                        left: ball.pos.left,
                        top: ball.pos.top,
                        width: BALL_RADIUS * 2,
                        height: BALL_RADIUS * 2,
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        backgroundImage: 'radial-gradient(circle at 30% 30%, #fff, #ddd, #999)',
                        boxShadow: '0 0 15px rgba(255,255,255,0.5)',
                        transform: `rotate(${ball.rotation}deg)`,
                        border: '1px solid #ccc',
                        zIndex: 20
                    }}>
                        <div style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: '#bbb', top: '50%' }} />
                        <div style={{ position: 'absolute', width: '1px', height: '100%', backgroundColor: '#bbb', left: '50%' }} />
                    </div>
                </Court>

                <ComboSystem lastCollision={lastCollision} ballSpeed={ball.speed} />

                {!isServed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg z-50">
                        <div className="text-center text-white p-8 rounded-2xl border border-white/20 bg-slate-800/90 shadow-2xl">
                            <h2 className="text-3xl font-bold mb-2">Volleyball Pro</h2>
                            <p className="text-slate-400 mb-6 text-sm uppercase tracking-widest">Defend your side!</p>
                            <div className="grid grid-cols-2 gap-4 mb-6 text-left text-xs text-slate-300">
                                <div><span className="text-yellow-500 font-bold">ARROWS:</span> Move</div>
                                <div><span className="text-yellow-500 font-bold">SPACE:</span> Serve/Jump</div>
                            </div>
                            <button 
                                onClick={() => setIsServed(true)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                START MATCH
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 text-slate-500 text-xs uppercase tracking-tighter">
                Click "Start Match" or press Space to serve.
            </div>
        </div>
    );
};

export default App;
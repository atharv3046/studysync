import React, { useMemo } from 'react';

const ParticleBackground = () => {
    const particles = useMemo(() =>
        Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 10 + 10}s`,
            animationDelay: `${Math.random() * 10}s`,
            size: `${Math.random() * 3 + 1}px`,
            opacity: Math.random() * 0.5 + 0.1
        })), []
    );

    return (
        <div className="particle-container">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        opacity: p.opacity,
                        animationDuration: p.animationDuration,
                        animationDelay: p.animationDelay
                    }}
                />
            ))}
            <div className="glow-orb orb-1" />
            <div className="glow-orb orb-2" />
            <div className="glow-orb orb-3" />
        </div>
    );
};

export default ParticleBackground;

import React from 'react';

interface SuperLikeAnimationProps {
    onComplete: () => void;
}

const SuperLikeAnimation: React.FC<SuperLikeAnimationProps> = ({ onComplete }) => {
    React.useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[5000] pointer-events-none flex items-center justify-center">
            <div className="animate-in zoom-in duration-500">
                <div className="relative">
                    {/* Star burst */}
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-1 h-20 bg-gradient-to-t from-cyan-400 to-transparent"
                            style={{
                                transform: `rotate(${i * 45}deg) translateY(-50px)`,
                                animation: 'pulse 0.5s ease-out',
                            }}
                        />
                    ))}

                    {/* Main star */}
                    <div className="w-40 h-40 flex items-center justify-center">
                        <div className="relative">
                            <i className="fas fa-star text-cyan-400 text-8xl animate-pulse drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]"></i>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-black uppercase text-white drop-shadow-lg">
                                    Super Like!
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperLikeAnimation;

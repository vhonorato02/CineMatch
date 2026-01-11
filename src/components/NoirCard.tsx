import React, { useState, useEffect } from 'react';
import { Movie, SwipeDirection } from '../shared/types';

interface NoirCardProps {
    movie: Movie;
    onSwipe: (direction: SwipeDirection) => void;
    isActive: boolean;
}

const NoirCard: React.FC<NoirCardProps> = ({ movie, onSwipe, isActive }) => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });

    const onStart = (e: any) => {
        if (!isActive) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setStart({ x: clientX - pos.x, y: clientY - pos.y });
        setDragging(true);
    };

    const onMove = (e: any) => {
        if (!dragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - start.x;
        const y = clientY - start.y;
        setPos({ x, y });
    };

    const onEnd = () => {
        if (!dragging) return;
        setDragging(false);

        const threshold = 100;
        if (pos.x > threshold) {
            onSwipe(SwipeDirection.RIGHT);
        } else if (pos.x < -threshold) {
            onSwipe(SwipeDirection.LEFT);
        } else if (pos.y < -threshold) {
            onSwipe(SwipeDirection.UP);
        } else {
            setPos({ x: 0, y: 0 });
        }
    };

    const style = {
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: dragging ? 'none' : 'transform 0.3s ease-out',
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? 'auto' : 'none' as any,
    };

    // Indicators
    const showYes = pos.x > 50;
    const showNo = pos.x < -50;
    const showSuperLike = pos.y < -50;

    return (
        <div
            style={style}
            onMouseDown={onStart}
            onMouseMove={onMove}
            onMouseUp={onEnd}
            onTouchStart={onStart}
            onTouchMove={onMove}
            onTouchEnd={onEnd}
            className="absolute inset-0 w-full h-[70vh] flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
        >
            <div className="w-full h-full noir-card border-2 border-gray-900 overflow-hidden relative flex flex-col">

                {/* Image */}
                <div className="flex-1 relative overflow-hidden bg-black">
                    <img
                        src={movie.imageUrl}
                        className={`w-full h-full object-cover ${dragging ? 'grayscale' : 'grayscale-0'} transition-all`}
                        alt={movie.title}
                        style={{ filter: 'grayscale(100%) contrast(1.1)' }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                    {/* Swipe Indicators */}
                    {showYes && (
                        <div className="absolute top-8 right-8 border-2 border-white px-4 py-2">
                            <span className="text-white font-bold text-xl tracking-widest">YES</span>
                        </div>
                    )}
                    {showNo && (
                        <div className="absolute top-8 left-8 border-2 border-white px-4 py-2">
                            <span className="text-white font-bold text-xl tracking-widest">NO</span>
                        </div>
                    )}
                    {showSuperLike && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white px-6 py-3">
                            <span className="text-white font-bold text-2xl tracking-widest">★ SUPER</span>
                        </div>
                    )}

                    {/* Movie Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <h3 className="noir-title text-3xl leading-none mb-2">{movie.title}</h3>
                                <p className="text-gray-400 text-sm noir-mono">
                                    {movie.year} · {movie.duration}min · {movie.rating}/10
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="border border-white px-3 py-1 inline-block">
                                    <span className="text-white font-bold text-sm">{movie.compatibility}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="p-4 bg-black border-t border-gray-900">
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {movie.genres.slice(0, 3).map(g => (
                            <span key={g} className="text-[10px] uppercase tracking-widest text-gray-600 border border-gray-800 px-2 py-1">
                                {g}
                            </span>
                        ))}
                    </div>
                    {movie.whyThis && (
                        <p className="text-xs text-gray-500 italic line-clamp-2 mb-2">"{movie.whyThis}"</p>
                    )}
                    <p className="text-xs text-gray-700 line-clamp-2">{movie.description}</p>
                </div>
            </div>
        </div>
    );
};

export default NoirCard;

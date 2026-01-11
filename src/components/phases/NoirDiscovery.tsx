import React from 'react';
import { Movie, SwipeDirection } from '../../shared/types';
import NoirCard from '../NoirCard';

interface NoirDiscoveryProps {
    movies: Movie[];
    currentIndex: number;
    onSwipe: (direction: SwipeDirection) => void;
    onReaction?: (emoji: string) => void;
    partnerReaction?: string | null;
}

const NoirDiscovery: React.FC<NoirDiscoveryProps> = ({
    movies,
    currentIndex,
    onSwipe,
    onReaction,
    partnerReaction,
}) => {
    const handleReaction = (emoji: string) => {
        onReaction?.(emoji);
        if (navigator.vibrate) navigator.vibrate(10);
    };

    return (
        <div className="w-full h-screen flex flex-col">
            {/* Cards Stack */}
            <div className="flex-1 relative">
                {movies.map((movie, index) => (
                    <NoirCard
                        key={movie.id}
                        movie={movie}
                        onSwipe={onSwipe}
                        isActive={index === currentIndex}
                    />
                ))}

                {/* Progress */}
                <div className="absolute top-6 left-6 right-6">
                    <div className="flex gap-1">
                        {movies.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 flex-1 transition-all ${idx < currentIndex ? 'bg-white' : idx === currentIndex ? 'bg-gray-600' : 'bg-gray-900'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Partner Reaction */}
                {partnerReaction && (
                    <div className="absolute top-20 right-6 text-4xl animate-bounce">
                        {partnerReaction}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-gray-900 bg-black/80 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-8">
                    {/* Pass */}
                    <button
                        onClick={() => onSwipe(SwipeDirection.LEFT)}
                        className="w-16 h-16 border border-gray-700 hover:border-white transition-all flex items-center justify-center group"
                    >
                        <i className="fas fa-times text-gray-700 group-hover:text-white text-xl"></i>
                    </button>

                    {/* Super Like */}
                    <button
                        onClick={() => onSwipe(SwipeDirection.UP)}
                        className="w-20 h-20 border-2 border-gray-600 hover:border-white transition-all flex items-center justify-center group"
                    >
                        <i className="fas fa-star text-gray-600 group-hover:text-white text-2xl"></i>
                    </button>

                    {/* Like */}
                    <button
                        onClick={() => onSwipe(SwipeDirection.RIGHT)}
                        className="w-16 h-16 border border-gray-700 hover:border-white transition-all flex items-center justify-center group"
                    >
                        <i className="fas fa-heart text-gray-700 group-hover:text-white text-xl"></i>
                    </button>
                </div>

                {/* Quick Reactions */}
                <div className="mt-4 flex justify-center gap-3">
                    {['😍', '🤔', '😴', '🔥'].map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className="text-2xl opacity-50 hover:opacity-100 transition-opacity filter grayscale hover:grayscale-0"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                <p className="text-center text-xs text-gray-700 mt-4 italic">
                    Swipe left to ignore, right to save, up to really like
                </p>
            </div>
        </div>
    );
};

export default NoirDiscovery;

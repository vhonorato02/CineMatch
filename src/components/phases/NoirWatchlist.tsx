import React from 'react';
import { Movie } from '../../shared/types';

interface NoirWatchlistProps {
    movies: Movie[];
    onClose: () => void;
    onMovieClick?: (movie: Movie) => void;
}

const NoirWatchlist: React.FC<NoirWatchlistProps> = ({ movies, onClose, onMovieClick }) => {
    return (
        <div className="w-full h-screen flex flex-col bg-black">
            {/* Header */}
            <div className="border-b border-gray-900 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="noir-title text-3xl">Your Matches</h2>
                        <p className="text-sm text-gray-600 noir-mono mt-1">
                            {movies.length} {movies.length === 1 ? 'film' : 'films'} you both can tolerate
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 border border-gray-800 hover:border-white transition-colors flex items-center justify-center"
                    >
                        <i className="fas fa-times text-sm"></i>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {movies.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <i className="fas fa-film text-6xl text-gray-900 mb-6"></i>
                        <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
                        <p className="text-sm text-gray-600 max-w-sm">
                            Keep swiping. Eventually you'll agree on something.
                        </p>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {movies.map((movie, idx) => (
                            <button
                                key={movie.id}
                                onClick={() => onMovieClick?.(movie)}
                                className="w-full noir-card p-0 overflow-hidden hover:border-white transition-all group text-left"
                            >
                                <div className="flex gap-4">
                                    {/* Poster */}
                                    <div className="w-32 h-48 bg-black flex-shrink-0">
                                        <img
                                            src={movie.imageUrl}
                                            alt={movie.title}
                                            className="w-full h-full object-cover"
                                            style={{ filter: 'grayscale(100%)' }}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-lg group-hover:text-white transition-colors">
                                                    {movie.title}
                                                </h3>
                                                <span className="text-xs text-gray-600 noir-mono">#{idx + 1}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 noir-mono mb-3">
                                                {movie.year} · {movie.duration}min · {movie.rating}/10
                                            </p>
                                            <div className="flex gap-2 flex-wrap mb-3">
                                                {movie.genres.slice(0, 3).map(genre => (
                                                    <span
                                                        key={genre}
                                                        className="text-[10px] uppercase tracking-widest text-gray-700 border border-gray-900 px-2 py-1"
                                                    >
                                                        {genre}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-700 line-clamp-2">{movie.description}</p>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs text-gray-600">
                                                {movie.compatibility}% match
                                            </span>
                                            <i className="fas fa-chevron-right text-gray-800 group-hover:text-gray-600 text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {movies.length > 0 && (
                <div className="border-t border-gray-900 p-6">
                    <p className="text-center text-xs text-gray-700 italic">
                        "Consensus achieved. Temporarily."
                    </p>
                </div>
            )}
        </div>
    );
};

export default NoirWatchlist;

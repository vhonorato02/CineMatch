import React, { useState } from 'react';
import { Movie } from '../../shared/types';
import { generateTrivia } from '../../services/aiEnhancer';

interface MovieDetailsModalProps {
    movie: Movie;
    onClose: () => void;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({ movie, onClose }) => {
    const [trivia, setTrivia] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const loadTrivia = async () => {
        setLoading(true);
        const facts = await generateTrivia(movie.title);
        setTrivia(facts);
        setLoading(false);
    };

    React.useEffect(() => {
        loadTrivia();
    }, []);

    return (
        <div className="fixed inset-0 z-[4000] glass flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header with Poster */}
                <div className="relative h-64 overflow-hidden">
                    <img src={movie.imageUrl} className="w-full h-full object-cover" alt={movie.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center z-10"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                    <div className="absolute bottom-6 left-6 right-6">
                        <h2 className="text-3xl font-black uppercase italic mb-2">{movie.title}</h2>
                        <p className="text-slate-300 text-sm">{movie.year} • {movie.duration}min • {movie.rating}/10</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Genres */}
                    <div className="flex flex-wrap gap-2">
                        {movie.genres.map(g => (
                            <span key={g} className="px-3 py-1 bg-rose-500/20 text-rose-500 rounded-full text-xs font-bold border border-rose-500/30">
                                {g}
                            </span>
                        ))}
                    </div>

                    {/* Why This */}
                    {movie.whyThis && (
                        <div className="bg-gradient-to-br from-rose-500/10 to-purple-500/10 border border-rose-500/20 rounded-2xl p-4">
                            <p className="text-sm font-bold text-rose-400 mb-2 flex items-center gap-2">
                                <i className="fas fa-heart"></i>
                                Por que assistir juntos?
                            </p>
                            <p className="text-sm italic">{movie.whyThis}</p>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="font-black uppercase text-sm mb-2">Sinopse</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{movie.description}</p>
                    </div>

                    {/* Trivia */}
                    <div>
                        <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
                            <i className="fas fa-lightbulb text-yellow-500"></i>
                            Curiosidades
                        </h3>
                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                Gerando curiosidades...
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trivia.length > 0 ? (
                                    trivia.map((fact, idx) => (
                                        <div key={idx} className="bg-white/5 rounded-xl p-4 border-l-4 border-yellow-500">
                                            <p className="text-sm text-slate-300">{fact}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">Não foi possível carregar curiosidades.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* YouTube Trailer */}
                    {movie.youtubeId && (
                        <div>
                            <h3 className="font-black uppercase text-sm mb-3">Trailer</h3>
                            <div className="aspect-video rounded-xl overflow-hidden">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${movie.youtubeId}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieDetailsModal;

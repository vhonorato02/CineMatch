import React, { useState } from 'react';
import { Movie } from '../../shared/types';

interface ChallengeModeProps {
    movies: Movie[];
    partnerName: string;
    onClose: () => void;
}

const ChallengeMode: React.FC<ChallengeModeProps> = ({ movies, partnerName, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState({ you: 0, partner: 0 });
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [revealed, setRevealed] = useState(false);

    const questions = [
        { text: `Qual filme ${partnerName} mais gostaria de assistir?`, type: 'guess' },
        { text: 'Qual gênero combina mais com vocês dois?', type: 'opinion' },
        { text: `Qual nota ${partnerName} daria para este filme?`, type: 'rating' },
    ];

    const handleSelect = (movie: Movie) => {
        setSelectedMovie(movie);
    };

    const handleReveal = () => {
        setRevealed(true);
        // Simulate partner choice (in real app, this would be synced via P2P)
        const randomCorrect = Math.random() > 0.5;
        if (randomCorrect) {
            setScore(prev => ({ ...prev, you: prev.you + 1 }));
        }
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedMovie(null);
            setRevealed(false);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[4000] glass flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black uppercase italic">Modo Desafio</h2>
                        <p className="text-sm text-slate-500">Quão bem você conhece {partnerName}?</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Score */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-rose-500/20 to-purple-500/20 rounded-2xl p-4 border border-rose-500/30 text-center">
                        <p className="text-sm text-slate-400 mb-1">Você</p>
                        <p className="text-4xl font-black text-rose-500">{score.you}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-500/30 text-center">
                        <p className="text-sm text-slate-400 mb-1">{partnerName}</p>
                        <p className="text-4xl font-black text-blue-500">{score.partner}</p>
                    </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                    <p className="text-lg font-bold text-center mb-6">{questions[currentQuestion].text}</p>

                    <div className="grid grid-cols-2 gap-4">
                        {movies.slice(0, 4).map(movie => (
                            <button
                                key={movie.id}
                                onClick={() => handleSelect(movie)}
                                disabled={revealed}
                                className={`p-4 rounded-xl border-2 transition-all ${selectedMovie?.id === movie.id
                                        ? 'border-rose-500 bg-rose-500/10'
                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                    } disabled:opacity-50`}
                            >
                                <img src={movie.imageUrl} className="w-full h-32 object-cover rounded-lg mb-2" alt={movie.title} />
                                <p className="text-sm font-bold truncate">{movie.title}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {!revealed ? (
                        <button
                            onClick={handleReveal}
                            disabled={!selectedMovie}
                            className="flex-1 bg-rose-500 disabled:bg-slate-700 py-4 rounded-xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all"
                        >
                            Revelar Resposta
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex-1 bg-green-500 py-4 rounded-xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all"
                        >
                            {currentQuestion < questions.length - 1 ? 'Próxima' : 'Finalizar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChallengeMode;

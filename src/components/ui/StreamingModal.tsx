import React, { useState } from 'react';
import { Movie } from '../../shared/types';
import { getStreamingAvailability, StreamingProvider, openStreamingLink } from '../../services/streamingService';

interface StreamingModalProps {
    movie: Movie;
    onClose: () => void;
}

const StreamingModal: React.FC<StreamingModalProps> = ({ movie, onClose }) => {
    const [providers, setProviders] = useState<StreamingProvider[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        setLoading(true);
        const result = await getStreamingAvailability(movie.title, movie.year);
        setProviders(result);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[3500] glass flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase">Onde Assistir</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <i className="fas fa-times text-sm"></i>
                    </button>
                </div>

                <p className="text-sm text-slate-400 mb-6">{movie.title} ({movie.year})</p>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {providers.map(provider => (
                            <button
                                key={provider.name}
                                onClick={() => provider.available && openStreamingLink(provider)}
                                disabled={!provider.available}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${provider.available
                                        ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20 cursor-pointer'
                                        : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <img src={provider.logo} alt={provider.name} className="w-8 h-8" />
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-sm">{provider.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {provider.available ? 'Disponível' : 'Não disponível'}
                                    </p>
                                </div>
                                {provider.available && (
                                    <i className="fas fa-external-link-alt text-green-500"></i>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                <p className="text-[10px] text-slate-600 text-center mt-6">
                    Disponibilidade sujeita a mudanças. Verifique no serviço.
                </p>
            </div>
        </div>
    );
};

export default StreamingModal;

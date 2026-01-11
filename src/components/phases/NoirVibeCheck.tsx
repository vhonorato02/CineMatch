import React, { useState } from 'react';

interface NoirVibeCheckProps {
    onStartSession: (vibe: string) => void;
    onTyping?: (typing: boolean) => void;
    isPartnerTyping?: boolean;
}

const NoirVibeCheck: React.FC<NoirVibeCheckProps> = ({ onStartSession, onTyping, isPartnerTyping }) => {
    const [customVibe, setCustomVibe] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const vibes = [
        { label: 'Classic Noir', emoji: '🕵️', desc: 'Dark. Cynical. Black & white.' },
        { label: 'Existential Crisis', emoji: '🤔', desc: 'Why are we here? Why anything?' },
        { label: 'Dark Comedy', emoji: '😐', desc: 'Laugh at the absurdity.' },
        { label: 'Tragic Romance', emoji: '🖤', desc: 'Love that goes nowhere.' },
        { label: 'Mystery', emoji: '🔍', desc: 'Questions without answers.' },
        { label: 'Psychological', emoji: '🧠', desc: 'Inside your head. Scary.' },
    ];

    const handleVibeSelect = (vibe: string) => {
        onStartSession(vibe);
    };

    const handleCustomSubmit = () => {
        if (customVibe.trim()) {
            onStartSession(customVibe.trim());
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-8 noir-fade-in">
                <div className="text-center">
                    <h2 className="noir-title text-4xl mb-2">Set The Mood</h2>
                    <p className="text-gray-500 text-sm noir-mono">
                        (Because genre is destiny)
                    </p>
                </div>

                {/* Preset Vibes */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vibes.map(vibe => (
                        <button
                            key={vibe.label}
                            onClick={() => handleVibeSelect(vibe.label)}
                            className="noir-card p-6 hover:border-white transition-all text-left group"
                        >
                            <div className="text-3xl mb-2">{vibe.emoji}</div>
                            <h3 className="font-bold text-sm mb-1 group-hover:text-white transition-colors">
                                {vibe.label}
                            </h3>
                            <p className="text-xs text-gray-600 italic">{vibe.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="noir-divider"></div>

                {/* Custom Vibe */}
                <div>
                    <button
                        onClick={() => setShowCustom(!showCustom)}
                        className="w-full text-xs text-gray-500 hover:text-white transition-colors py-2"
                    >
                        {showCustom ? '▲ Hide Custom' : '▼ or describe your own vibe'}
                    </button>

                    {showCustom && (
                        <div className="space-y-4 mt-4">
                            <input
                                type="text"
                                value={customVibe}
                                onChange={(e) => {
                                    setCustomVibe(e.target.value);
                                    onTyping?.(e.target.value.length > 0);
                                }}
                                placeholder="e.g., 'melancholic films about time travel'"
                                className="noir-input w-full"
                                maxLength={100}
                            />
                            {isPartnerTyping && (
                                <p className="text-xs text-gray-600 italic">
                                    Partner is typing...
                                </p>
                            )}
                            <button
                                onClick={handleCustomSubmit}
                                disabled={!customVibe.trim()}
                                className="noir-btn w-full disabled:opacity-30"
                            >
                                Find Movies
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-700 italic noir-quote">
                    "We're not picky. We just have very specific requirements."
                </p>
            </div>
        </div>
    );
};

export default NoirVibeCheck;

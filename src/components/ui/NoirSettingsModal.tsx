import React from 'react';

interface NoirSettingsModalProps {
    onClose: () => void;
}

const NoirSettingsModal: React.FC<NoirSettingsModalProps> = ({ onClose }) => {
    const [soundEnabled, setSoundEnabled] = React.useState(true);

    return (
        <div className="fixed inset-0 z-[3000] noir-overlay flex items-center justify-center p-6">
            <div className="noir-card w-full max-w-md">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-900">
                        <h2 className="noir-title text-3xl">Settings</h2>
                        <button onClick={onClose} className="text-gray-600 hover:text-white">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {/* Sound Toggle */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between border border-gray-900 p-4">
                            <div>
                                <p className="font-bold text-sm mb-1">Sound Effects</p>
                                <p className="text-xs text-gray-600">Beeps and boops</p>
                            </div>
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`w-12 h-6 border transition-all ${soundEnabled ? 'border-white' : 'border-gray-800'
                                    }`}
                            >
                                <div className={`w-4 h-4 bg-white transition-transform ${soundEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`}></div>
                            </button>
                        </div>
                    </div>

                    {/* About */}
                    <div className="text-center">
                        <p className="text-xs text-gray-700 mb-2">CineMatch v2.0 Noir</p>
                        <p className="text-xs text-gray-800 italic">Feito com ❤️ por Zé pra Galinha</p>
                        <p className="text-xs text-gray-900 mt-4">"Minimalism as a lifestyle choice or just lazy design?"</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoirSettingsModal;

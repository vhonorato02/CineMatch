import React from 'react';

interface NoirMatchOverlayProps {
    movieTitle: string;
    onClose: () => void;
}

const NoirMatchOverlay: React.FC<NoirMatchOverlayProps> = ({ movieTitle, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[6000] noir-overlay flex items-center justify-center noir-fade-in">
            <div className="text-center p-8">
                {/* Minimal animation */}
                <div className="mb-8 relative">
                    <div className="w-32 h-32 border-4 border-white mx-auto flex items-center justify-center">
                        <i className="fas fa-film text-6xl"></i>
                    </div>

                    {/* Pulse rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border border-white animate-ping"></div>
                    </div>
                </div>

                <h2 className="noir-title text-5xl mb-4">It's a Match</h2>
                <p className="text-gray-500 text-xl mb-2">{movieTitle}</p>
                <p className="text-gray-700 text-sm italic">
                    "Miracles do happen."
                </p>
            </div>
        </div>
    );
};

export default NoirMatchOverlay;

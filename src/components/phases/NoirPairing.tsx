import React, { useState } from 'react';

interface NoirPairingProps {
    myPeerId: string;
    onConnect: (targetId: string) => void;
    onSkip: () => void;
}

const NoirPairing: React.FC<NoirPairingProps> = ({ myPeerId, onConnect, onSkip }) => {
    const [targetId, setTargetId] = useState('');
    const [showQR, setShowQR] = useState(false);

    const inviteUrl = `${window.location.origin}${window.location.pathname}?peer=${myPeerId}`;

    const handleConnect = () => {
        if (targetId.trim()) {
            onConnect(targetId.trim());
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(myPeerId);
    };

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: 'CineMatch',
                text: 'Join me for movie selection',
                url: inviteUrl,
            });
        } else {
            navigator.clipboard.writeText(inviteUrl);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 noir-fade-in">
                <div className="text-center">
                    <h2 className="noir-title text-4xl mb-2">Connect</h2>
                    <p className="text-gray-500 text-sm noir-mono">
                        Find your partner. Or don't.
                    </p>
                </div>

                {/* Your ID */}
                <div className="noir-card p-6 space-y-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Your ID</p>
                    <div className="nouveau-mono text-lg border border-gray-800 p-4 bg-black/50 font-mono">
                        {myPeerId || '...'}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleCopy} className="noir-btn-ghost text-xs py-3">
                            Copy ID
                        </button>
                        <button onClick={handleShare} className="noir-btn-ghost text-xs py-3">
                            Share Link
                        </button>
                    </div>

                    {/* QR Code Toggle */}
                    <button
                        onClick={() => setShowQR(!showQR)}
                        className="w-full text-xs text-gray-500 hover:text-white transition-colors py-2"
                    >
                        {showQR ? '▲ Hide QR Code' : '▼ Show QR Code'}
                    </button>

                    {showQR && (
                        <div className="bg-white p-4 inline-block">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}&color=000000&bgcolor=ffffff`}
                                alt="QR Code"
                                className="w-48 h-48"
                            />
                        </div>
                    )}
                </div>

                <div className="noir-divider"></div>

                {/* Connect to Partner */}
                <div className="space-y-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500 text-center">
                        Or Enter Partner's ID
                    </p>
                    <input
                        type="text"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        placeholder="Paste ID here..."
                        className="noir-input w-full"
                    />
                    <button
                        onClick={handleConnect}
                        disabled={!targetId.trim()}
                        className="noir-btn w-full disabled:opacity-30"
                    >
                        Connect
                    </button>
                </div>

                <button onClick={onSkip} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors py-2">
                    Skip for now →
                </button>
            </div>
        </div>
    );
};

export default NoirPairing;

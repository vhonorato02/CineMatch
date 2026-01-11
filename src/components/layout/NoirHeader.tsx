import React from 'react';
import { UserProfile } from '../../shared/types';

interface NoirHeaderProps {
    connStatus: 'offline' | 'waiting' | 'connecting' | 'connected' | 'error';
    profile: UserProfile | null;
    partner: UserProfile | null;
    onOpenWatchlist?: () => void;
    onOpenStats?: () => void;
    onOpenSettings?: () => void;
}

const NoirHeader: React.FC<NoirHeaderProps> = ({
    connStatus,
    profile,
    partner,
    onOpenWatchlist,
    onOpenStats,
    onOpenSettings,
}) => {
    const statusDot = {
        offline: '○',
        waiting: '◔',
        connecting: '◑',
        connected: '●',
        error: '✕',
    }[connStatus];

    return (
        <header className="w-full border-b border-gray-900 bg-black/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div>
                        <h1 className="noir-title text-2xl">CineMatch</h1>
                    </div>

                    {/* Center - Connection Status */}
                    <div className="flex items-center gap-6">
                        {profile && (
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{profile.avatar}</span>
                                <span className="text-sm text-gray-400 noir-mono">{profile.name}</span>
                            </div>
                        )}

                        <span className="text-gray-600 noir-mono text-xs">{statusDot}</span>

                        {partner && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 noir-mono">{partner.name}</span>
                                <span className="text-xl">{partner.avatar}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {onOpenStats && (
                            <button
                                onClick={onOpenStats}
                                className="text-gray-600 hover:text-white transition-colors text-sm"
                                title="Stats"
                            >
                                <i className="fas fa-chart-bar"></i>
                            </button>
                        )}
                        {onOpenWatchlist && (
                            <button
                                onClick={onOpenWatchlist}
                                className="text-gray-600 hover:text-white transition-colors text-sm"
                                title="Watchlist"
                            >
                                <i className="fas fa-list"></i>
                            </button>
                        )}
                        {onOpenSettings && (
                            <button
                                onClick={onOpenSettings}
                                className="text-gray-600 hover:text-white transition-colors text-sm"
                                title="Settings"
                            >
                                <i className="fas fa-cog"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default NoirHeader;

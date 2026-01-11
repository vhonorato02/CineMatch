import React from 'react';
import { UserProfile } from '../../shared/types';

interface HeaderProps {
    connStatus: 'offline' | 'waiting' | 'connecting' | 'connected' | 'error';
    profile: UserProfile | null;
    partner: UserProfile | null;
    onOpenWatchlist: () => void;
}

const Header: React.FC<HeaderProps> = ({ connStatus, profile, partner, onOpenWatchlist }) => {
    return (
        <header className="p-4 flex justify-between items-center z-50 glass mb-4 pt-safe">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center rotate-3 shadow-lg">
                    <i className="fas fa-clapperboard text-[10px]"></i>
                </div>
                <span className="font-black italic tracking-tighter text-sm uppercase">CineMatch</span>
            </div>

            <div className="flex items-center gap-3">
                {connStatus === 'connected' && (
                    <div className="flex -space-x-2">
                        <img src={profile?.avatar} className="w-6 h-6 rounded-full border border-slate-900" alt="Me" />
                        <img src={partner?.avatar} className="w-6 h-6 rounded-full border border-slate-900" alt="Partner" />
                    </div>
                )}
                <button onClick={onOpenWatchlist} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">
                    <i className="fas fa-bookmark"></i>
                </button>
            </div>
        </header>
    );
};

export default Header;

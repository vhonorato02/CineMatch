import React, { useState } from 'react';
import { gamification, UserStats } from '../../services/gamification';

interface StatsModalProps {
    onClose: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
    const [stats] = useState<UserStats>(gamification.getStats());
    const progress = gamification.getProgress();

    return (
        <div className="fixed inset-0 z-[3000] glass flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black uppercase italic">Suas Stats</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Level & XP */}
                <div className="bg-gradient-to-r from-rose-500/20 to-purple-500/20 rounded-2xl p-6 mb-6 border border-rose-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-slate-400">Nível</p>
                            <p className="text-4xl font-black">{stats.level}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400">XP Total</p>
                            <p className="text-2xl font-bold text-rose-500">{stats.xp}</p>
                        </div>
                    </div>
                    <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress.percentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                        {progress.currentXP} / {progress.xpToNextLevel} XP para próximo nível
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <i className="fas fa-fire text-2xl text-orange-500 mb-2"></i>
                        <p className="text-2xl font-black">{stats.streak}</p>
                        <p className="text-xs text-slate-500 uppercase">Streak</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <i className="fas fa-heart text-2xl text-rose-500 mb-2"></i>
                        <p className="text-2xl font-black">{stats.totalMatches}</p>
                        <p className="text-xs text-slate-500 uppercase">Matches</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <i className="fas fa-hand-pointer text-2xl text-blue-500 mb-2"></i>
                        <p className="text-2xl font-black">{stats.totalSwipes}</p>
                        <p className="text-xs text-slate-500 uppercase">Swipes</p>
                    </div>
                </div>

                {/* Achievements */}
                <div className="mb-6">
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                        <i className="fas fa-trophy text-yellow-500"></i>
                        Conquistas
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {stats.achievements.map(achievement => (
                            <div
                                key={achievement.id}
                                className={`p-4 rounded-xl border ${achievement.unlocked
                                        ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                                        : 'bg-white/5 border-white/5 opacity-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <i className={`fas ${achievement.icon} text-2xl ${achievement.unlocked ? 'text-yellow-500' : 'text-slate-600'}`}></i>
                                    <div>
                                        <p className="font-black text-sm">{achievement.name}</p>
                                        <p className="text-xs text-slate-500">{achievement.description}</p>
                                        {achievement.unlocked && achievement.unlockedAt && (
                                            <p className="text-[10px] text-yellow-500 mt-1">
                                                {new Date(achievement.unlockedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Genre Stats */}
                {Object.keys(stats.genreStats).length > 0 && (
                    <div>
                        <h3 className="text-xl font-black uppercase mb-4">Gêneros Favoritos</h3>
                        <div className="space-y-2">
                            {Object.entries(stats.genreStats)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([genre, count]) => (
                                    <div key={genre} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                        <span className="font-bold text-sm">{genre}</span>
                                        <span className="text-rose-500 font-black">{count}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsModal;

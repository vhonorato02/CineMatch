import React, { useState } from 'react';
import { gamification, UserStats } from '../../services/gamification';
import { noirAchievementQuotes } from '../../utils/noirQuotes';

interface NoirStatsModalProps {
    onClose: () => void;
}

const NoirStatsModal: React.FC<NoirStatsModalProps> = ({ onClose }) => {
    const [stats] = useState<UserStats>(gamification.getStats());
    const progress = gamification.getProgress();

    return (
        <div className="fixed inset-0 z-[3000] noir-overlay flex items-center justify-center p-6">
            <div className="noir-card w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-900">
                        <h2 className="noir-title text-3xl">Statistics</h2>
                        <button onClick={onClose} className="text-gray-600 hover:text-white">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {/* Level & XP */}
                    <div className="mb-8 p-6 border border-gray-900">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Level</p>
                                <p className="text-5xl font-bold noir-mono">{stats.level}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Total XP</p>
                                <p className="text-2xl font-bold">{stats.xp}</p>
                            </div>
                        </div>
                        <div className="h-2 bg-gray-900 overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500"
                                style={{ width: `${progress.percentage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-700 mt-2 text-center">
                            {progress.currentXP} / {progress.xpToNextLevel} XP to next level
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="border border-gray-900 p-4 text-center">
                            <p className="text-3xl font-bold mb-1">{stats.streak}</p>
                            <p className="text-xs text-gray-600 uppercase tracking-widest">Day Streak</p>
                        </div>
                        <div className="border border-gray-900 p-4 text-center">
                            <p className="text-3xl font-bold mb-1">{stats.totalMatches}</p>
                            <p className="text-xs text-gray-600 uppercase tracking-widest">Matches</p>
                        </div>
                        <div className="border border-gray-900 p-4 text-center">
                            <p className="text-3xl font-bold mb-1">{stats.totalSwipes}</p>
                            <p className="text-xs text-gray-600 uppercase tracking-widest">Swipes</p>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="mb-6">
                        <h3 className="text-sm uppercase tracking-widest text-gray-600 mb-4">Achievements</h3>
                        <div className="space-y-3">
                            {stats.achievements.map(achievement => (
                                <div
                                    key={achievement.id}
                                    className={`border p-4 ${achievement.unlocked
                                            ? 'border-white bg-white/5'
                                            : 'border-gray-900 opacity-40'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <i className={`fas ${achievement.icon} text-xl ${achievement.unlocked ? 'text-white' : 'text-gray-800'}`}></i>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm mb-1">{achievement.name}</p>
                                            <p className="text-xs text-gray-600 italic">
                                                {noirAchievementQuotes[achievement.id] || achievement.description}
                                            </p>
                                            {achievement.unlocked && achievement.unlockedAt && (
                                                <p className="text-[10px] text-gray-700 mt-2">
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
                            <h3 className="text-sm uppercase tracking-widest text-gray-600 mb-4">Top Genres</h3>
                            <div className="space-y-2">
                                {Object.entries(stats.genreStats)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([genre, count]) => (
                                        <div key={genre} className="flex items-center justify-between border border-gray-900 p-3">
                                            <span className="text-sm">{genre}</span>
                                            <span className="font-bold noir-mono">{count}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoirStatsModal;

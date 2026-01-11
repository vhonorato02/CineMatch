// Gamification System - XP, Levels, Achievements

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: number;
}

export interface UserStats {
    xp: number;
    level: number;
    totalMatches: number;
    totalSwipes: number;
    streak: number;
    lastActiveDate: string;
    achievements: Achievement[];
    genreStats: Record<string, number>;
}

const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
    { id: 'first_match', name: 'Primeiro Match', description: 'Consiga seu primeiro match!', icon: 'fa-heart' },
    { id: 'streak_7', name: 'Semana Perfeita', description: '7 dias de streak consecutivos', icon: 'fa-fire' },
    { id: 'swipe_100', name: 'Explorador', description: 'Deslize em 100 filmes', icon: 'fa-compass' },
    { id: 'match_10', name: 'Cinéfilo Compatível', description: '10 matches com seu parceiro', icon: 'fa-film' },
    { id: 'super_like', name: 'Super Animado', description: 'Use seu primeiro Super Like', icon: 'fa-star' },
    { id: 'genre_master', name: 'Mestre de Gênero', description: 'Assista filmes de 5 gêneros diferentes', icon: 'fa-award' },
];

const XP_PER_LEVEL = 100;

class GamificationManager {
    private stats: UserStats;

    constructor() {
        const saved = localStorage.getItem('cm_stats');
        this.stats = saved ? JSON.parse(saved) : this.getDefaultStats();
        this.checkStreak();
    }

    private getDefaultStats(): UserStats {
        return {
            xp: 0,
            level: 1,
            totalMatches: 0,
            totalSwipes: 0,
            streak: 0,
            lastActiveDate: new Date().toISOString().split('T')[0],
            achievements: ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })),
            genreStats: {},
        };
    }

    private save() {
        localStorage.setItem('cm_stats', JSON.stringify(this.stats));
    }

    private checkStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = new Date(this.stats.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            this.stats.streak++;
        } else if (diffDays > 1) {
            this.stats.streak = 1;
        }
        // diffDays === 0 means same day, keep streak

        this.stats.lastActiveDate = today;
        this.checkAchievement('streak_7');
        this.save();
    }

    addXP(amount: number): { leveled: boolean; newLevel?: number } {
        this.stats.xp += amount;
        const newLevel = Math.floor(this.stats.xp / XP_PER_LEVEL) + 1;
        const leveled = newLevel > this.stats.level;

        if (leveled) {
            this.stats.level = newLevel;
        }

        this.save();
        return { leveled, newLevel: leveled ? newLevel : undefined };
    }

    recordMatch(genres: string[]) {
        this.stats.totalMatches++;
        this.addXP(50);

        genres.forEach(genre => {
            this.stats.genreStats[genre] = (this.stats.genreStats[genre] || 0) + 1;
        });

        if (this.stats.totalMatches === 1) this.unlockAchievement('first_match');
        if (this.stats.totalMatches >= 10) this.unlockAchievement('match_10');

        const uniqueGenres = Object.keys(this.stats.genreStats).length;
        if (uniqueGenres >= 5) this.unlockAchievement('genre_master');

        this.save();
    }

    recordSwipe() {
        this.stats.totalSwipes++;
        this.addXP(1);

        if (this.stats.totalSwipes >= 100) this.unlockAchievement('swipe_100');

        this.save();
    }

    recordSuperLike() {
        this.unlockAchievement('super_like');
    }

    private unlockAchievement(id: string) {
        const achievement = this.stats.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            this.addXP(100);
            return true;
        }
        return false;
    }

    private checkAchievement(id: string) {
        if (id === 'streak_7' && this.stats.streak >= 7) {
            this.unlockAchievement(id);
        }
    }

    getStats(): UserStats {
        return { ...this.stats };
    }

    getProgress(): { currentXP: number; xpToNextLevel: number; percentage: number } {
        const currentLevelXP = (this.stats.level - 1) * XP_PER_LEVEL;
        const currentXP = this.stats.xp - currentLevelXP;
        const percentage = (currentXP / XP_PER_LEVEL) * 100;

        return {
            currentXP,
            xpToNextLevel: XP_PER_LEVEL,
            percentage,
        };
    }
}

export const gamification = new GamificationManager();

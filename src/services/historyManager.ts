// Rewind & History Management

import { Movie, SwipeDirection } from '../shared/types';

interface SwipeHistory {
    movie: Movie;
    direction: SwipeDirection;
    timestamp: number;
}

class HistoryManager {
    private history: SwipeHistory[] = [];
    private maxHistory = 10;

    addSwipe(movie: Movie, direction: SwipeDirection) {
        this.history.push({
            movie,
            direction,
            timestamp: Date.now(),
        });

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    canRewind(): boolean {
        return this.history.length > 0;
    }

    rewind(): SwipeHistory | null {
        return this.history.pop() || null;
    }

    clear() {
        this.history = [];
    }

    getHistory(): SwipeHistory[] {
        return [...this.history];
    }
}

export const historyManager = new HistoryManager();

// LocalStorage Service with error handling and validation

const STORAGE_KEYS = {
    PROFILE: 'cm_profile',
    WATCHLIST: 'cm_watchlist',
    CURRENT_INDEX: 'cm_current_index',
    MOVIE_CACHE: 'cm_movie_cache',
    LAST_VIBE: 'cm_last_vibe',
    FIRST_TIME: 'cm_first_time',
} as const;

export const storage = {
    // Generic get with error handling
    get<T>(key: string, defaultValue: T): T {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    },

    // Generic set with error handling
    set<T>(key: string, value: T): boolean {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing ${key} to localStorage:`, error);
            return false;
        }
    },

    // Remove item
    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
        }
    },

    // Clear all app data
    clear(): void {
        Object.values(STORAGE_KEYS).forEach(key => {
            storage.remove(key);
        });
    },

    // Check if first time user
    isFirstTime(): boolean {
        const firstTime = storage.get(STORAGE_KEYS.FIRST_TIME, true);
        if (firstTime) {
            storage.set(STORAGE_KEYS.FIRST_TIME, false);
        }
        return firstTime;
    },
};

export { STORAGE_KEYS };

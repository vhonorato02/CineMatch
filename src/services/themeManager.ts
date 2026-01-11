// Theme System with multiple themes

export type Theme = 'dark' | 'oled' | 'light' | 'neon';

interface ThemeColors {
    bg: string;
    bgSecondary: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentHover: string;
    border: string;
    cardBg: string;
}

const themes: Record<Theme, ThemeColors> = {
    dark: {
        bg: '#020617',
        bgSecondary: '#0f172a',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        accent: '#f43f5e',
        accentHover: '#e11d48',
        border: 'rgba(255, 255, 255, 0.1)',
        cardBg: '#1e293b',
    },
    oled: {
        bg: '#000000',
        bgSecondary: '#0a0a0a',
        text: '#ffffff',
        textSecondary: '#888888',
        accent: '#ff0055',
        accentHover: '#cc0044',
        border: 'rgba(255, 255, 255, 0.05)',
        cardBg: '#111111',
    },
    light: {
        bg: '#f8fafc',
        bgSecondary: '#e2e8f0',
        text: '#0f172a',
        textSecondary: '#64748b',
        accent: '#f43f5e',
        accentHover: '#e11d48',
        border: 'rgba(0, 0, 0, 0.1)',
        cardBg: '#ffffff',
    },
    neon: {
        bg: '#0a0118',
        bgSecondary: '#1a0f2e',
        text: '#e0d0ff',
        textSecondary: '#9980cc',
        accent: '#ff00ff',
        accentHover: '#cc00cc',
        border: 'rgba(255, 0, 255, 0.3)',
        cardBg: '#1f1040',
    },
};

class ThemeManager {
    private currentTheme: Theme = 'dark';

    constructor() {
        const saved = localStorage.getItem('cm_theme') as Theme;
        if (saved && themes[saved]) {
            this.currentTheme = saved;
        }
        this.apply();
    }

    setTheme(theme: Theme) {
        this.currentTheme = theme;
        localStorage.setItem('cm_theme', theme);
        this.apply();
    }

    getTheme(): Theme {
        return this.currentTheme;
    }

    getColors(): ThemeColors {
        return themes[this.currentTheme];
    }

    private apply() {
        const colors = themes[this.currentTheme];
        const root = document.documentElement;

        root.style.setProperty('--bg', colors.bg);
        root.style.setProperty('--bg-secondary', colors.bgSecondary);
        root.style.setProperty('--text', colors.text);
        root.style.setProperty('--text-secondary', colors.textSecondary);
        root.style.setProperty('--accent', colors.accent);
        root.style.setProperty('--accent-hover', colors.accentHover);
        root.style.setProperty('--border', colors.border);
        root.style.setProperty('--card-bg', colors.cardBg);

        // Update body background
        document.body.style.backgroundColor = colors.bg;
        document.body.style.color = colors.text;
    }
}

export const themeManager = new ThemeManager();

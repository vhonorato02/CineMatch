// Sound Effects Service

type SoundType = 'swipe' | 'match' | 'superlike' | 'notification' | 'error' | 'success';

const sounds: Record<SoundType, string> = {
    swipe: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuAze/glEILElav6eeoVhUMTKXh8bllHgU2jdXvx3YpBSh+zO/clkYMA1Ot6OyrWRYNUp/f771tJAYuf8vt25RGDBJY',
    match: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt55...',
    superlike: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559...',
    notification: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA...',
    error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA...',
    success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA...',
};

class SoundManager {
    private enabled: boolean = true;
    private volume: number = 0.5;
    private audioContext: AudioContext | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
            this.audioContext = new AudioContext();
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        localStorage.setItem('cm_sound_enabled', String(enabled));
    }

    isEnabled(): boolean {
        const stored = localStorage.getItem('cm_sound_enabled');
        return stored === null ? true : stored === 'true';
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    play(type: SoundType) {
        if (!this.enabled || !this.isEnabled()) return;

        try {
            // Simple beep generation for now
            if (this.audioContext) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                const frequencies: Record<SoundType, number> = {
                    swipe: 400,
                    match: 800,
                    superlike: 1200,
                    notification: 600,
                    error: 200,
                    success: 900,
                };

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.value = frequencies[type];
                oscillator.type = type === 'error' ? 'sawtooth' : 'sine';

                gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
}

export const soundManager = new SoundManager();

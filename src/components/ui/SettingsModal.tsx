import React from 'react';
import { Theme, themeManager } from '../../services/themeManager';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const [theme, setTheme] = React.useState<Theme>(themeManager.getTheme());
    const [soundEnabled, setSoundEnabled] = React.useState(true);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        themeManager.setTheme(newTheme);
    };

    const themes: { id: Theme; name: string; preview: string }[] = [
        { id: 'dark', name: 'Dark', preview: 'bg-slate-950' },
        { id: 'oled', name: 'OLED', preview: 'bg-black' },
        { id: 'light', name: 'Light', preview: 'bg-slate-100' },
        { id: 'neon', name: 'Neon', preview: 'bg-purple-950' },
    ];

    return (
        <div className="fixed inset-0 z-[3000] glass flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black uppercase italic">Configurações</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Theme Selection */}
                <div className="mb-8">
                    <h3 className="text-sm font-black uppercase text-slate-500 mb-4">Tema</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {themes.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleThemeChange(t.id)}
                                className={`p-4 rounded-xl border-2 transition-all ${theme === t.id
                                        ? 'border-rose-500 bg-rose-500/10'
                                        : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <div className={`w-full h-16 ${t.preview} rounded-lg mb-2`}></div>
                                <p className="text-sm font-bold">{t.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sound Toggle */}
                <div className="mb-8">
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                        <div>
                            <p className="font-black">Efeitos Sonoros</p>
                            <p className="text-xs text-slate-500">Sons em swipes e matches</p>
                        </div>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`w-14 h-8 rounded-full transition-all ${soundEnabled ? 'bg-rose-500' : 'bg-slate-700'
                                }`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-7' : 'translate-x-1'
                                }`}></div>
                        </button>
                    </div>
                </div>

                {/* About */}
                <div className="text-center text-slate-500 text-xs">
                    <p className="mb-1">CineMatch v2.0</p>
                    <p>Feito com ❤️ por Zé pra Galinha</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;

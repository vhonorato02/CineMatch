import React, { useState } from 'react';
import { UserProfile } from '../../../types';

const AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=ffd5dc",
];

interface ProfileSetupProps {
    initialProfile: UserProfile | null;
    onComplete: (profile: UserProfile) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ initialProfile, onComplete }) => {
    const [profile, setProfile] = useState<UserProfile>(initialProfile || { name: '', avatar: AVATARS[0] });

    const handleSave = () => {
        if (profile.name.trim()) {
            localStorage.setItem('cm_profile', JSON.stringify(profile));
            onComplete(profile);
        }
    };

    return (
        <div className="w-full space-y-8 animate-in slide-in-from-bottom-10">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Crie sua<br /><span className="text-rose-500">Identidade.</span></h2>
            <div className="grid grid-cols-4 gap-3">
                {AVATARS.map(a => (
                    <button
                        key={a}
                        onClick={() => setProfile({ ...profile, avatar: a })}
                        className={`aspect-square rounded-2xl border-2 overflow-hidden transition-all ${profile.avatar === a ? 'border-rose-500 scale-110 shadow-xl shadow-rose-500/20' : 'border-white/10 opacity-30'}`}
                    >
                        <img src={a} className="w-full h-full" alt="" />
                    </button>
                ))}
            </div>
            <input
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                placeholder="Como te chamam?"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold placeholder:text-slate-700 outline-none focus:border-rose-500/50"
            />
            <button
                onClick={handleSave}
                disabled={!profile.name.trim()}
                className="w-full bg-rose-500 p-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
                Começar Jornada
            </button>
        </div>
    );
};

export default ProfileSetup;

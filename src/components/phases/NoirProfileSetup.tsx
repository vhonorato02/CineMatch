import React, { useState } from 'react';
import { UserProfile } from '../../shared/types';

interface NoirProfileSetupProps {
    onComplete: (profile: UserProfile) => void;
}

const NoirProfileSetup: React.FC<NoirProfileSetupProps> = ({ onComplete }) => {
    const [name, setName] = useState('');

    const avatars = ['🎬', '🎭', '🎪', '🎨', '🎯', '🎲', '🎰', '🎸'];
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onComplete({ name: name.trim(), avatar: selectedAvatar });
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md noir-fade-in">
                <h2 className="noir-title text-4xl mb-2 text-center">Your Name</h2>
                <p className="text-center text-gray-500 text-sm mb-12 noir-mono">
                    (Not that it matters much)
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Avatar Selection */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-4">
                            Pick an Icon
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                            {avatars.map(avatar => (
                                <button
                                    key={avatar}
                                    type="button"
                                    onClick={() => setSelectedAvatar(avatar)}
                                    className={`aspect-square flex items-center justify-center text-2xl border transition-all ${selectedAvatar === avatar
                                            ? 'border-white bg-white/10'
                                            : 'border-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    {avatar}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-4">
                            Enter Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Type here..."
                            className="noir-input w-full text-lg"
                            maxLength={20}
                            required
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="noir-btn w-full disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>

                    <p className="text-center text-xs text-gray-600 italic">
                        "We're all just names on a screen anyway."
                    </p>
                </form>
            </div>
        </div>
    );
};

export default NoirProfileSetup;

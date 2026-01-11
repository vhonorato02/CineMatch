import React from 'react';

const SkeletonCard: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-[65vh] flex items-center justify-center p-4">
            <div className="w-full h-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] border border-white/10 animate-pulse">
                <div className="h-2/3 bg-slate-800"></div>
                <div className="p-6 space-y-4">
                    <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                    <div className="flex gap-2">
                        <div className="h-6 bg-slate-800 rounded w-16"></div>
                        <div className="h-6 bg-slate-800 rounded w-16"></div>
                        <div className="h-6 bg-slate-800 rounded w-16"></div>
                    </div>
                    <div className="h-12 bg-slate-800 rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;

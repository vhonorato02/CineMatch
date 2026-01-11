import React, { useEffect, useState } from 'react';
import { getRandomNoirQuote } from '../../utils/noirQuotes';

const NoirSplash: React.FC = () => {
    const [quote, setQuote] = useState('');

    useEffect(() => {
        setQuote(getRandomNoirQuote());
    }, []);

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center noir-fade-in p-6">
            {/* Minimal logo */}
            <div className="mb-12">
                <h1 className="noir-title text-6xl mb-2">CineMatch</h1>
                <p className="noir-mono text-xs text-center tracking-widest text-gray-500">
                    EST. 2026
                </p>
            </div>

            {/* Self-aware quote */}
            <div className="max-w-md">
                <p className="noir-quote text-center">
                    {quote}
                </p>
            </div>

            {/* Minimal loading indicator */}
            <div className="mt-12">
                <div className="noir-loading"></div>
            </div>
        </div>
    );
};

export default NoirSplash;

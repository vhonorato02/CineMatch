// Streaming services integration placeholder
// In production, this would use real APIs like JustWatch, TMDB, etc.

export interface StreamingProvider {
    name: string;
    logo: string;
    available: boolean;
    link?: string;
}

const MOCK_PROVIDERS: StreamingProvider[] = [
    { name: 'Netflix', logo: 'https://img.icons8.com/color/48/netflix.png', available: false },
    { name: 'Prime Video', logo: 'https://img.icons8.com/color/48/amazon-prime-video.png', available: false },
    { name: 'Disney+', logo: 'https://img.icons8.com/color/48/disney-plus.png', available: false },
    { name: 'HBO Max', logo: 'https://img.icons8.com/color/48/hbo-max.png', available: false },
    { name: 'Apple TV+', logo: 'https://img.icons8.com/color/48/apple-tv.png', available: false },
];

export async function getStreamingAvailability(movieTitle: string, year: number): Promise<StreamingProvider[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock: randomly mark 1-2 providers as available
    const providers = MOCK_PROVIDERS.map(p => ({ ...p }));
    const numAvailable = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < numAvailable; i++) {
        const randomIndex = Math.floor(Math.random() * providers.length);
        providers[randomIndex].available = true;
        providers[randomIndex].link = `https://www.google.com/search?q=${encodeURIComponent(movieTitle + ' ' + providers[randomIndex].name)}`;
    }

    return providers;
}

export function openStreamingLink(provider: StreamingProvider) {
    if (provider.link) {
        window.open(provider.link, '_blank');
    }
}

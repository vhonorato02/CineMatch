// Self-aware, noir-themed quotes for the app

export const noirQuotes = [
    "In a world of infinite choices, we're just two people who can't decide what to watch.",
    "Love is temporary. The right movie is forever. (Actually, both are temporary. But who's counting?)",
    "Swipe left for escapism. Swipe right for more escapism.",
    "Because scrolling Netflix for 45 minutes is romantic, apparently.",
    "Two souls, one remote. Zero consensus.",
    "We're not indecisive. We're... cinematically thorough.",
    "Plot twist: You both hate rom-coms.",
    "Finding love in a hopeless streaming queue.",
    "Matching movies is easier than matching people. (We think.)",
    "Because nothing says 'couple goals' like arguing over genres.",
    "Your relationship: complicated. Your movie choice: let's keep it simple.",
    "Swipe right if you want to pretend you'll stay awake.",
    "The couple that swipes together... still falls asleep 20 minutes in.",
    "Film noir for when your relationship feels like a mystery thriller.",
    "Less drama here than in your last relationship. Probably.",
];

export function getRandomNoirQuote(): string {
    return noirQuotes[Math.floor(Math.random() * noirQuotes.length)];
}

export const noirAchievementQuotes: Record<string, string> = {
    first_match: "Your first match. Try to hide your surprise.",
    streak_7: "Seven days straight. Someone's avoiding making life decisions.",
    swipe_100: "One hundred swipes. Your indecision is now statistically significant.",
    match_10: "Ten matches. Congratulations on occasionally agreeing.",
    super_like: "Super Like activated. Try not to seem too desperate.",
    genre_master: "Five genres mastered. Renaissance person or just indecisive?",
};

// Advanced AI features for movie enhancement

import { GoogleGenerativeAI } from '@google/genai';
import { Movie } from '../shared/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY || '');

export async function enhanceMovie(movie: Movie): Promise<Partial<Movie>> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Para o filme "${movie.title}" (${movie.year}):
1. Crie uma justificativa breve e divertida de por que este filme é perfeito para um casal assistir juntos (máx 60 palavras, informal, emotivo).
2. Liste 1 fato curioso/interessante sobre os bastidores ou produção.

Responda em JSON:
{
  "whyThis": "texto motivacional",
  "trivia": "fato curioso"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
                whyThis: data.whyThis,
                // Store trivia for future use
            };
        }

        return {};
    } catch (error) {
        console.error('Error enhancing movie:', error);
        return {};
    }
}

export async function generateTrivia(movieTitle: string): Promise<string[]> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Liste 3 curiosidades interessantes e pouco conhecidas sobre o filme "${movieTitle}". 
Seja específico, curto (máx 50 palavras cada) e divertido.

Formato JSON: {"trivia": ["fato 1", "fato 2", "fato 3"]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return data.trivia || [];
        }

        return [];
    } catch (error) {
        console.error('Error generating trivia:', error);
        return [];
    }
}

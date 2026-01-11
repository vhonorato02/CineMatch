
import { GoogleGenAI, Type } from "@google/genai";
import { Movie, SessionConfig } from "../shared/types";

const MOVIE_POSTERS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800",
  "https://images.unsplash.com/photo-1542204172-3c1399430260?q=80&w=800",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800"
];

export const fetchMovies = async (config: SessionConfig): Promise<Movie[]> => {
  const apiKey = (window as any).process?.env?.API_KEY || "";
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const targetVibe = config.customVibe || config.vibe;

  const prompt = `Atue como um curador de cinema para casais. Gere 15 filmes para a vibe: "${targetVibe}".
  Retorne um ARRAY JSON de objetos com:
  - title (string)
  - year (number)
  - rating (number, 0-10)
  - genres (array de strings)
  - description (máx 150 caracteres)
  - duration (minutos)
  - youtubeId (ID do trailer)
  - whyThis (uma frase curta explicando por que é bom para um casal nessa vibe)`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              year: { type: Type.INTEGER },
              rating: { type: Type.NUMBER },
              genres: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
              duration: { type: Type.INTEGER },
              youtubeId: { type: Type.STRING },
              whyThis: { type: Type.STRING }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((m: any, i: number) => ({
      ...m,
      id: `movie-${Date.now()}-${i}`,
      compatibility: Math.floor(Math.random() * 15) + 85,
      imageUrl: MOVIE_POSTERS[i % MOVIE_POSTERS.length]
    }));
  } catch (e) {
    console.error("Gemini Error:", e);
    return [];
  }
};

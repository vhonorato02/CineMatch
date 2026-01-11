
import { GoogleGenAI, Type } from "@google/genai";
import { Movie, SessionConfig } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        const wait = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await sleep(wait);
      }
    }
  }
  throw lastError;
}

export const fetchMovies = async (genres: string[], config: SessionConfig): Promise<Movie[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const moodMap = {
    low: "relaxing, slow-paced, comforting",
    high: "energetic, thrilling, fast-paced"
  };

  const prompt = `Generate 15 trending movies for a couple. 
  Context: Genres [${genres.join(', ')}], Max duration [${config.maxTime} min], Energy [${moodMap[config.energy]}], Courage Level [${config.courage}/5].
  Strict Rules: ${config.safety.noGore ? 'NO GORE.' : ''} ${config.safety.noSex ? 'NO SEX SCENES.' : ''}
  Return JSON with: title, year, rating, genres, description (2 sentences), duration (mins), vibe (light/neutral/intense), youtubeVideoId, aiReasoning (1 sentence explaining why this is a good choice for a couple), warnings (object).`;

  return fetchWithRetry(async () => {
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
              vibe: { type: Type.STRING },
              youtubeVideoId: { type: Type.STRING },
              aiReasoning: { type: Type.STRING },
              warnings: {
                type: Type.OBJECT,
                properties: {
                  gore: { type: Type.BOOLEAN },
                  sex: { type: Type.BOOLEAN },
                  violence: { type: Type.BOOLEAN }
                }
              }
            }
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "[]");
      const streams = ["Netflix", "Prime Video", "HBO Max", "Disney+"];
      
      return data.map((m: any) => ({
        ...m,
        id: Math.random().toString(36).substr(2, 9),
        imageUrl: `https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop`,
        streamingOn: [streams[Math.floor(Math.random() * streams.length)]],
        trailerUrl: m.youtubeVideoId ? `https://www.youtube.com/watch?v=${m.youtubeVideoId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(m.title + ' trailer')}`
      }));
    } catch (e) {
      throw new Error("Invalid movie data format");
    }
  });
};

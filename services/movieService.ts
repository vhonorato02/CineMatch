
import { GoogleGenAI, Type } from "@google/genai";
import { Movie, SessionConfig } from "../types.ts";

const MOVIE_POSTERS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800",
  "https://images.unsplash.com/photo-1542204172-3c1399430260?q=80&w=800",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800"
];

export const fetchMovies = async (config: SessionConfig): Promise<Movie[]> => {
  // Verificação ultra-segura da API Key
  const apiKey = (window as any).process?.env?.API_KEY || "";
  
  if (!apiKey) {
    console.error("ERRO: API_KEY não configurada. O app não conseguirá gerar filmes.");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Gere uma lista de 10 filmes REAIS de Hollywood para a vibe "${config.vibe}".
  A saída deve ser um JSON estrito (ARRAY).
  Campos obrigatórios: title (string), year (number), rating (number de 0 a 10), genres (array), description (string), duration (number), youtubeId (string).`;

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
              youtubeId: { type: Type.STRING }
            },
            required: ["title", "year", "rating", "description", "youtubeId"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text);
    return data.map((m: any, i: number) => ({
      ...m,
      id: `movie-${i}-${Date.now()}`,
      compatibility: Math.floor(Math.random() * 20) + 80,
      imageUrl: MOVIE_POSTERS[i % MOVIE_POSTERS.length]
    }));
  } catch (e) {
    console.error("Erro ao buscar filmes via Gemini:", e);
    return [];
  }
};

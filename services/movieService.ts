
import { GoogleGenAI, Type } from "@google/genai";
import { Movie, SessionConfig } from "../types";

export const fetchMovies = async (config: SessionConfig): Promise<Movie[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Gere uma lista de 12 filmes REAIS de cinema que combinem com a vibe "${config.vibe}" e tenham cerca de ${config.maxTime} minutos.
  Retorne um array JSON estrito com: title, year (number), rating (number de 0 a 10), genres (array), description (curta), duration (number), youtubeId (ID do trailer).`;

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

    const data = JSON.parse(response.text || "[]");
    return data.map((m: any, i: number) => ({
      ...m,
      id: `m-${i}-${Date.now()}`,
      compatibility: Math.floor(Math.random() * 15) + 85,
      imageUrl: `https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop` // Imagem base de cinema de alta qualidade
    }));
  } catch (e) {
    console.error("Gemini Error:", e);
    return [];
  }
};

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Express app
const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to platform default mock news.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Full high-fidelity fallback news list in June 2026
const fallbackNews = [
  { id: 'n1', hashtag: '#AIClinicalShift', postsCount: '15.4K', title: 'Healthcare Systems Integrate Care-Agent Models', description: 'Major global hospitals deploy specialized AI agents to streamline medical transcripts and live documentation, improving clinician workflows.', category: 'Tech & Health', source: 'Global Medical Review', url: 'https://news.google.com' },
  { id: 'n2', hashtag: '#FusionGridProgress', postsCount: '12.8K', title: 'Helion Achieves High Magnetic Containment Milestones', description: 'Clean energy pioneers hit record magnetic parameters in pulse compression facilities, aiming for commercial scale fusion operations by late-decade.', category: 'Future Power', source: 'Science Scientific', url: 'https://news.google.com' },
  { id: 'n3', hashtag: '#GlobalGridSync', postsCount: '8.4K', title: 'Equatorial Intelligent Energy Grid Synchronized', description: 'Nation states complete deep subsea power cables bridging tropical solar reserves with northern industrial cooling centers directly.', category: 'Infrastructure', source: 'World Energy Board', url: 'https://news.google.com' },
  { id: 'n4', hashtag: '#ZenHourMovement', postsCount: '24.1K', title: 'International Organizations Institute Scheduled Offlines', description: 'Global corporate leaders mandate daily device-free clock-out sessions to boost neural recovery and combat modern cognitive burnout.', category: 'Global Wellness', source: 'Life & Mind Quarterly', url: 'https://news.google.com' },
  { id: 'n5', hashtag: '#DeepOceanPlume', postsCount: '6.2K', title: 'Hydrothermal Vents Discovered Host Copper Bacteria', description: 'Oceanographic submersibles capture high-definition footage of mineral-rich thermal complexes hosting extreme pressure-tolerant life.', category: 'Earth Discovery', source: 'Science Explorer', url: 'https://news.google.com' }
];

// API endpoint to fetch trending news using Search Grounding
app.get('/api/news/trending', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Return high-fidelity fallback news if no API key is provided
      return res.json({ news: fallbackNews, source: 'fallback (no API key)' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Search the live web and compile a list of 5 of the top trending general global news events, scientific updates, technologic changes, or major lifestyle trends in the world today. Provide actual real headlines and concise descriptions, creating a relevant social media hashtag (starting with #) and an estimated post count representation (e.g. "12.4K") for each.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique simple id like "n1", "n2", etc.' },
                  category: { type: Type.STRING, description: 'Subject area, e.g., Tech & Space, Health, Science' },
                  hashtag: { type: Type.STRING, description: 'Trending hashtag, e.g. #SpaceXFlight, #FusionSuccess' },
                  postsCount: { type: Type.STRING, description: 'Estimated views or posts count, e.g. "18.3K" or "104K"' },
                  title: { type: Type.STRING, description: 'The absolute actual trending news title' },
                  description: { type: Type.STRING, description: 'Concise, engaging summary of the news story' },
                  source: { type: Type.STRING, description: 'Primary news outlet or source name' },
                  url: { type: Type.STRING, description: 'Source URL default to a secure informational news portal' }
                },
                required: ['id', 'category', 'hashtag', 'postsCount', 'title', 'description', 'source']
              }
            }
          },
          required: ['news']
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const textOutput = response.text;
    if (textOutput) {
      const parsed = JSON.parse(textOutput.trim());
      
      // Make sure the parsed object contains an array of news items
      if (parsed && Array.isArray(parsed.news) && parsed.news.length > 0) {
        // Extract URL references from grounding metadata if present to enrich the articles
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        const enrichedNews = parsed.news.map((item: any, idx: number) => {
          let sourceUrl = item.url || 'https://news.google.com';
          // Try to map to deep grounding URIs if we can find a matching index
          if (groundingChunks && groundingChunks[idx] && groundingChunks[idx].web?.uri) {
            sourceUrl = groundingChunks[idx].web.uri;
          }
          return {
            ...item,
            url: sourceUrl
          };
        });

        return res.json({ news: enrichedNews, source: 'gemini-search-grounded' });
      }
    }

    res.json({ news: fallbackNews, source: 'backup-fallback' });
  } catch (error) {
    console.error("Failed to generate trending news with Gemini search grounding:", error);
    res.json({ news: fallbackNews, source: 'error-fallback' });
  }
});

// Configure Vite or Static Assets path
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Clockit Server] Running on http://localhost:${PORT}`);
  });
}

startServer();

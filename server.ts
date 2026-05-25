import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Create Gemini Client securely with the official modern SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests and setting up body limit for base64 uploads
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Server memory storage for uploaded media assets (in-memory for active session durability)
const mediaStorage = new Map<string, { mimeType: string; data: string }>();

// 1. AI-powered Translation API
app.post("/api/translate", async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: "Missing required fields: text and targetLang" });
  }

  try {
    const prompt = `Translate the following text into ${targetLang}. Preserve the emotional tone, slang, nuances, and formatting. Output ONLY the translated string without any quotation marks or extra explanation:
    
"${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ translation: response.text?.trim() });
  } catch (error: any) {
    console.error("AI Translation Error:", error);
    res.status(500).json({ error: "Translation failed", details: error.message });
  }
});

// 2. AI-powered Moderation Tool
app.post("/api/moderate", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing required field: text" });
  }

  try {
    const prompt = `Analyze the following message for content safety, harassment, hate speech, inappropriate language, and offensive content. Respond in raw JSON matching this schema:
    {
      "clean": boolean,
      "warning": string (short user-facing warning if flagged, empty string if clean),
      "censoredText": string (clean version of the message with offensive words replaced, or same message if clean)
    }

Do NOT output markdown. Do NOT put the JSON in backticks. Output only the raw valid JSON.

Message to evaluate:
"${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "{}";
    const result = JSON.parse(resultText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("AI Moderation Error:", error);
    // Graceful fallback to prevent application blocker
    res.json({ clean: true, warning: "", censoredText: text });
  }
});

// 3. Media Upload & Hosting Proxy (Handles image and audio/video preview media data)
app.post("/api/media-upload", (req, res) => {
  const { name, data, mimeType } = req.body;
  if (!data || !mimeType) {
    return res.status(400).json({ error: "Missing required media fields: data, mimeType" });
  }

  const mediaId = `media_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  mediaStorage.set(mediaId, { mimeType, data });

  const mediaUrl = `/api/media/${mediaId}`;
  res.json({ mediaId, mediaUrl });
});

app.get("/api/media/:id", (req, res) => {
  const media = mediaStorage.get(req.params.id);
  if (!media) {
    return res.status(404).send("Media asset not found");
  }

  const binaryData = Buffer.from(media.data.split(',')[1] || media.data, 'base64');
  res.setHeader("Content-Type", media.mimeType);
  res.send(binaryData);
});

// 4. Real-time Server-Sent Events (SSE) Notification Stream (Simulates real-time notification socket)
let sseClients: any[] = [];

app.get("/api/stream-notifications", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial welcome pulse
  res.write(`data: ${JSON.stringify({ type: "connect", message: "Real-time global notifications synced." })}\n\n`);

  req.on("close", () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Endpoint to dispatch a real-time event system alert
app.post("/api/dispatch-notification", (req, res) => {
  const { title, body, conversationId, type } = req.body;
  const alertPayload = {
    id: `notif_${Date.now()}`,
    title: title || "Clockit Security",
    body: body || "A global connection event occurs.",
    conversationId: conversationId || null,
    type: type || "alert",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  sseClients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(alertPayload)}\n\n`);
  });

  res.json({ success: true, clientsNotified: sseClients.length });
});

// 5. Integrate Vite Server Core Middleware (Maintains single port 3000 entry point)
async function startFullStackApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clockit Server running on http://0.0.0.0:${PORT}`);
  });
}

startFullStackApp().catch((err) => {
  console.error("Failed to start full stack application server:", err);
});

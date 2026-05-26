/**
 * server.js — Backend Express pour le Jury IA VAE Aide-Soignant
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

console.log("Variables OPENAI détectées:", Object.keys(process.env).filter(k => k.includes("OPENAI")));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "dist")));

app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "ok",
    apiKey: process.env.OPENAI_API_KEY ? "configured" : "missing",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/session", async (_req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY manquante dans les variables Railway");
    return res.status(500).json({
      error: "OPENAI_API_KEY manquante. Ajoutez-la dans les variables d'environnement Railway.",
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "shimmer",
          instructions: "Tu es un jury de VAE aide-soignant. Tu parles exclusivement en français.",
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`❌ OpenAI ${response.status}:`, body);
      return res.status(response.status).json({
        error: `OpenAI a retourné une erreur ${response.status}`,
        detail: body,
      });
    }

    const sessionData = await response.json();
    console.log("✅ Ephemeral key générée, expire à :", sessionData.expires_at);
    res.json(sessionData);

  } catch (err) {
    console.error("❌ Erreur serveur:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur Jury VAE démarré sur le port ${PORT}`);
  console.log(`   Healthcheck : GET /healthz`);
  console.log(`   API session : GET /api/session`);
});

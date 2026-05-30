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
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ══════════════════════════════════════════════════════════
// SYSTÈME DE TOKENS — liste dans .env (variable VALID_TOKENS)
// Format dans Railway : VALID_TOKENS=Myriam_15012025,Thomas_20012025,Demo_01012025
// Pour révoquer : supprimer le token de la variable, redéployer.
// ══════════════════════════════════════════════════════════
function getValidTokens() {
  const raw = process.env.VALID_TOKENS || "";
  return raw.split(",").map(t => t.trim()).filter(Boolean);
}

function isTokenValid(token) {
  if (!token) return false;
  return getValidTokens().includes(token);
}

// Middleware : vérifie le token sur toutes les routes GET sauf /healthz et /api/*
function tokenGuard(req, res, next) {
  // Laisser passer les routes API et healthcheck
  if (req.path.startsWith("/api/") || req.path === "/healthz") return next();
  // Laisser passer les assets statiques (js, css, images, fonts…)
  if (req.path.match(/\.(js|css|png|jpg|svg|ico|woff|woff2|ttf|map)$/)) return next();

  const token = req.query.token;
  if (isTokenValid(token)) return next();

  // Token absent ou invalide → page de blocage HTML (React ne charge jamais)
  res.status(403).send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Accès non autorisé — SAVOIRSCOPE</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: #f7f5f1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Georgia, serif;
      padding: 24px;
    }
    .card {
      max-width: 440px;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 80px; height: 80px;
      background: rgba(164,74,63,0.1);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 28px;
    }
    h1 {
      font-size: 26px;
      font-style: italic;
      color: #2b2e27;
      margin-bottom: 14px;
    }
    p {
      font-family: system-ui, sans-serif;
      font-size: 14px;
      color: #6f7566;
      line-height: 1.65;
      margin-bottom: 28px;
    }
    p strong { color: #5f6452; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #e0dbd0;
      background: white;
      border-radius: 999px;
      padding: 8px 16px;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      color: #8a8f7d;
      margin-bottom: 32px;
    }
    .footer {
      font-family: system-ui, sans-serif;
      font-size: 10px;
      letter-spacing: 0.15em;
      color: #b0b5a5;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#a44a3f" stroke-width="1.6">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <circle cx="12" cy="16" r="1" fill="#a44a3f"/>
      </svg>
    </div>
    <h1>Accès non autorisé</h1>
    <p>
      Ce lien n'est pas valide ou a expiré.<br/><br/>
      Veuillez contacter <strong>Patrice DIAKITÉ</strong><br/>
      pour obtenir votre accès personnalisé.
    </p>
    <div class="badge">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
      Lien invalide ou révoqué
    </div>
    <div class="footer">Savoirscope · Jury VAE Aide-Soignant</div>
  </div>
</body>
</html>`);
}

app.use(tokenGuard);
app.use(express.static(path.join(__dirname, "dist")));

// ── Healthcheck (sans token) ──
app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "ok",
    apiKey: process.env.OPENAI_API_KEY ? "configured" : "missing",
    tokens: getValidTokens().length,
    timestamp: new Date().toISOString(),
  });
});

// ── Session OpenAI — vérifie aussi le token ──
app.get("/api/session", async (req, res) => {
  // Double vérification token sur l'API elle-même
  const token = req.query.token;
  if (!isTokenValid(token)) {
    return res.status(403).json({ error: "Token invalide." });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY manquante dans les variables Railway");
    return res.status(500).json({
      error: "OPENAI_API_KEY manquante. Ajoutez-la dans les variables d'environnement Railway.",
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime",
            // Instructions volontairement vides ici.
            // Elles sont envoyées par App.tsx via session.update après connexion.
          },
        }),
      }
    );

    if (!response.ok) {
      const raw = await response.text();
      console.error(`❌ OpenAI ${response.status}:`, raw);
      return res.status(response.status).json({
        error: `OpenAI a retourné une erreur ${response.status}`,
        detail: raw,
      });
    }

    const sessionData = await response.json();
    console.log("✅ Ephemeral key générée pour token:", token, "— expire à :", sessionData.expires_at);
    res.json(sessionData);

  } catch (err) {
    console.error("❌ Erreur serveur:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

// ── SPA fallback — transmet le token à React ──
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur Jury VAE démarré sur le port ${PORT}`);
  console.log(`   Healthcheck : GET /healthz`);
  console.log(`   API session : GET /api/session?token=XXX`);
  console.log(`   Tokens actifs : ${getValidTokens().length}`);
});

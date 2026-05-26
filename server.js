/**
 * server.js — Backend Express pour le Jury IA VAE Aide-Soignant
 *
 * Compatible Railway :
 * - Lit OPENAI_API_KEY et PORT
 * - Sert le build Vite (dist/)
 * - Génère une clé Realtime temporaire
 * - Expose un healthcheck
 */

import * as dotenv from "dotenv";
dotenv.config({ override: false });

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
<<<<<<< HEAD

const PORT = process.env.PORT || 3000;

// Debug variables OpenAI
console.log(
  "Variables OPENAI détectées :",
  Object.keys(process.env).filter((k) =>
    k.includes("OPENAI")
  )
);

console.log(
  "OPENAI_API_KEY présente :",
  !!process.env.OPENAI_API_KEY
);

app.use(cors());

app.use(
  express.json({
    limit: "10mb",
  })
);

// ─────────────────────────────────────────────
// Fichiers statiques Vite
// ─────────────────────────────────────────────

app.use(
  express.static(
    path.join(__dirname, "dist")
  )
);

// ─────────────────────────────────────────────
// Healthcheck Railway
// ─────────────────────────────────────────────

=======
const PORT = process.env.PORT || 3000;

// Debug variables
console.log("Variables OPENAI détectées :", Object.keys(process.env).filter((k) => k.includes("OPENAI")));
console.log("OPENAI_API_KEY présente :", !!process.env.OPENAI_API_KEY);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "dist")));

// ─────────────────────────────────────────────
// Instructions du jury en français
// ─────────────────────────────────────────────
const INSTRUCTIONS = `Tu es le Jury IA de simulation VAE Aide-Soignant.

LANGUE : Tu DOIS parler UNIQUEMENT en français. Toutes tes réponses, questions et commentaires sont exclusivement en français. Ne parle jamais en anglais ni dans aucune autre langue.

Tu fonctionnes en temps réel (speech-to-speech). Tu adoptes la posture d'un membre de jury professionnel, bienveillant mais exigeant. Phrases courtes. Une seule question à la fois.

🎯 RÔLE : Tu simules un jury VAE Aide-Soignant officiel (DEAS). Tu évalues les compétences réelles du candidat.

🎯 DÉROULEMENT — 4 phases :
1) Présentation : parcours, structure d'exercice (EHPAD, hôpital, domicile, HAD...)
2) Cas pratiques : toilette au lit, prévention escarres, patient désorienté, fin de vie, refus de soin, transmissions
3) Analyse réflexive : pourquoi ce choix, risques identifiés, alternatives
4) Feedback synthétique : structure OBLIGATOIRE avec sauts de ligne entre chaque point.
   Utilise EXACTEMENT ce format :
   "Voici mon retour sur votre prestation.
   
   Points forts : [point 1].
   
   [point 2].
   
   Axes d'amélioration : [axe 1].
   
   [axe 2].
   
   Conseil : [conseil concret]."
   
   Chaque point sur sa propre ligne, séparé par une ligne vide.

💬 OUVERTURE OBLIGATOIRE :
Commence EXACTEMENT par :
"Bonjour. Je suis votre jury IA de simulation VAE Aide-Soignant. Nous allons réaliser un entretien comme lors d'un passage devant un jury officiel. Êtes-vous prêt ?"
Puis attends la réponse du candidat.`;

// ─────────────────────────────────────────────
// Healthcheck Railway
// ─────────────────────────────────────────────
>>>>>>> b758a2c (fix: server.js corrigé pour Railway)
app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "ok",
    apiKey: process.env.OPENAI_API_KEY
      ? "configured"
      : "missing",

    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// Création session Realtime OpenAI
// ─────────────────────────────────────────────
<<<<<<< HEAD

app.get(
  "/api/session",
  async (_req, res) => {

    const OPENAI_API_KEY =
      process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {

      console.error(
        "❌ OPENAI_API_KEY absente"
      );

      return res.status(500).json({
        error:
          "OPENAI_API_KEY manquante",
      });
    }

    try {

      console.log(
        "Création session Realtime..."
      );

      const response =
        await fetch(
          "https://api.openai.com/v1/realtime/client_secrets",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${OPENAI_API_KEY}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              session: {

                type: "realtime",

                model: "gpt-realtime-preview"

                voice:
                  "shimmer",

                modalities: [
                  "audio",
                  "text",
                ],

                instructions: `
Tu es un jury VAE aide-soignant.

Tu réalises un entretien oral interactif.

Règles :

- Parle uniquement français
- Une question à la fois
- Attends la réponse
- Relance si nécessaire
- Évalue les compétences
- Posture bienveillante mais exigeante
- Simulation réaliste de jury
`,
              },
            }),
          }
        );

      const raw =
        await response.text();

      console.log(
        "Status OpenAI :",
        response.status
      );

      console.log(
        "Réponse OpenAI :",
        raw
      );

      if (!response.ok) {

        return res
          .status(
            response.status
          )
          .json({
            error:
              "Erreur OpenAI",

            detail: raw,
          });
      }

      let sessionData;

      try {

        sessionData =
          JSON.parse(raw);

      } catch {

        return res
          .status(500)
          .json({
            error:
              "Réponse OpenAI invalide",
          });
      }

      console.log(
        "✅ Session créée"
      );

      console.log(
        sessionData
      );

      return res.json(
        sessionData
      );

    } catch (err) {

      console.error(
        "Erreur serveur :",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Erreur interne",

          detail:
            err.message,
        });
    }
=======
app.get("/api/session", async (_req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY absente");
    return res.status(500).json({ error: "OPENAI_API_KEY manquante dans .env" });
  }

  try {
    console.log("Création session Realtime...");

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime",
          instructions: INSTRUCTIONS,
          audio: {
            input: {
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
                create_response: true,
                interrupt_response: true,
              },
            },
            output: {
              voice: "shimmer",
            },
          },
        },
      }),
    });

    const raw = await response.text();
    console.log("Status OpenAI :", response.status);
    console.log("Réponse OpenAI :", raw);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erreur OpenAI", detail: raw });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "Réponse OpenAI invalide" });
    }

    console.log("✅ Session créée, expire à :", sessionData.client_secret?.expires_at);
    return res.json(sessionData);

  } catch (err) {
    console.error("Erreur serveur :", err);
    return res.status(500).json({ error: "Erreur interne", detail: err.message });
>>>>>>> b758a2c (fix: server.js corrigé pour Railway)
  }
);

// ─────────────────────────────────────────────
<<<<<<< HEAD
// Fallback SPA Vite
// ─────────────────────────────────────────────

app.use(
  (req, res, next) => {

    if (
      req.method !== "GET"
    ) {
      return next();
    }

    res.sendFile(
      path.join(
        __dirname,
        "dist",
        "index.html"
      )
    );
  }
);

// ─────────────────────────────────────────────
// Lancement serveur
// ─────────────────────────────────────────────

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `✅ Serveur démarré : ${PORT}`
    );

    console.log(
      "Healthcheck : /healthz"
    );

    console.log(
      "Realtime : /api/session"
    );
  }
);
=======
// Fallback SPA Vite — Express v5
// ─────────────────────────────────────────────
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ─────────────────────────────────────────────
// Lancement serveur
// ─────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur démarré : ${PORT}`);
  console.log("Healthcheck : /healthz");
  console.log("Realtime : /api/session");
});
>>>>>>> b758a2c (fix: server.js corrigé pour Railway)

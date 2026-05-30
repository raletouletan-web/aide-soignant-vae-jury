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
            instructions: `LANGUE : Tu DOIS parler UNIQUEMENT en français. Toutes tes réponses, questions et commentaires sont exclusivement en français. Ne parle jamais en anglais ni dans aucune autre langue.

Tu fonctionnes en temps réel (speech-to-speech). Tu adoptes la posture d'un membre de jury professionnel, bienveillant mais exigeant. Phrases courtes. Une seule question à la fois.

════════════════════════════════════════════════
PROMPT IA VOCALE — JURY VAE AIDE-SOIGNANT
Conçu par Patrice DIAKITÉ
════════════════════════════════════════════════

1. IDENTITÉ ET RÔLE
Tu es un jury VAE (Validation des Acquis de l'Expérience) pour le métier d'aide-soignant.
Tu es formel, sérieux, neutre.
Tu ne quittes jamais ce rôle.
Tu parles français uniquement.
Tu utilises des phrases courtes pour une meilleure compréhension orale.

2. RÉFÉRENTIEL D'ÉVALUATION
Tu évalues le candidat sur les 5 domaines d'activités (DA) et les 11 compétences officielles du DEAS :

5 domaines de Compétences du métier d'aide soignants :
1. DA1 : Accompagnement et soins de la personne dans les activités de sa vie quotidienne et de sa vie sociale en repérant les fragilités. Ce domaine se concentre sur l'aide aux actes essentiels, le respect du projet de vie, l'évaluation de l'autonomie et l'identification des risques de maltraitance ou de vulnérabilité.
2. DA2 : Appréciation de l'état clinique de la personne et mise en œuvre de soins adaptés en collaboration avec l'infirmier en intégrant la qualité et la prévention des risques. Il s'agit ici de l'observation de l'état général, de la mesure des paramètres vitaux, de l'évaluation de la douleur et de la réalisation de soins personnalisés en collaboration étroite avec l'infirmier.
3. DA3 : Information et accompagnement des personnes et de leur entourage, des professionnels et des apprenants. Ce domaine couvre l'accueil et la communication avec le patient et ses proches, ainsi que l'encadrement et la formation des pairs et des stagiaires.
4. DA4 : Entretien de l'environnement immédiat de la personne et des matériels liés aux activités de soins, au lieu et aux situations d'intervention. Cela inclut le nettoyage, la désinfection, la gestion des stocks (linge, dispositifs médicaux) et le repérage de toute anomalie ou dysfonctionnement du matériel.
5. DA5 : Transmission, quels que soient l'outil et les modalités de communication, des observations recueillies pour maintenir la continuité des soins et des activités. Ce dernier domaine concerne la traçabilité des soins, la hiérarchisation des informations et l'organisation du travail au sein d'une équipe pluriprofessionnelle pour garantir la sécurité et la qualité.

Les 11 compétences essentielles du métier d'aides soignants :
Bloc 1 : Accompagnement et soins de la personne dans les activités de sa vie quotidienne et sociale
- Compétence 1 : Accompagner les personnes dans les actes essentiels de la vie quotidienne et sociale, personnaliser cet accompagnement selon la situation et réajuster si nécessaire.
- Compétence 2 : Identifier les situations à risque lors de l'accompagnement, mettre en œuvre des actions de prévention adéquates et les évaluer.
Bloc 2 : Évaluation de l'état clinique et mise en œuvre de soins adaptés en collaboration
- Compétence 3 : Évaluer l'état clinique d'une personne à tout âge de la vie pour adapter sa prise en soins.
- Compétence 4 : Mettre en œuvre des soins adaptés à l'état clinique de la personne.
- Compétence 5 : Accompagner la personne dans son installation et ses déplacements en mobilisant ses ressources et en utilisant des techniques préventives de mobilisation.
Bloc 3 : Information et accompagnement des personnes et de leur entourage, des professionnels et des apprenants
- Compétence 6 : Établir une communication adaptée pour informer et accompagner la personne et son entourage.
- Compétence 7 : Informer et former les pairs, les personnes en formation et les autres professionnels.
Bloc 4 : Entretien de l'environnement immédiat de la personne et des matériels liés aux activités
- Compétence 8 : Utiliser des techniques d'entretien des locaux et du matériel adaptées en prenant en compte la prévention des risques associés.
- Compétence 9 : Repérer et traiter les anomalies et dysfonctionnements en lien avec l'entretien des locaux et des matériels.
Bloc 5 : Travail en équipe pluriprofessionnelle et traitement des informations
- Compétence 10 : Rechercher, traiter et transmettre les données pertinentes pour assurer la continuité et la traçabilité des soins et des activités.
- Compétence 11 : Organiser son activité, coopérer au sein d'une équipe pluriprofessionnelle et améliorer sa pratique dans le cadre d'une démarche qualité/gestion des risques.

3. OUVERTURE OBLIGATOIRE
(À prononcer textuellement, sans modification, dès le début)

« Bonjour. Je suis une intelligence artificielle dédiée à la validation des acquis par l'expérience. J'ai été conçue par Patrice DIAKITÉ.
Mon rôle est de vous questionner comme le ferait un jury humain.
Deux modalités sont possibles. Mode apprentissage : après chaque réponse, je vous aide à approfondir votre propos.
Mode simulation : je me comporte exactement comme un véritable jury.
Veuillez choisir votre mode. Dites : MODE APPRENTISSAGE ou MODE SIMULATION. »

Tu dois attendre la réponse du candidat.

Gestion du silence ou de l'hésitation : Si le candidat ne répond pas, hésite longuement, dit « je ne sais pas » ou formule autrement (ex. : « simulation », « je veux le mode simulation ») → tu passes automatiquement en MODE SIMULATION.
SI LE CANDIDAT DIT « TEST JURY », va directement à la synthèse finale en improvisant des axes d'amélioration. C'est un test de l'outil.

La première question après le choix du mode est toujours : "Pouvez-vous vous présenter brièvement ?"
Tu utiliseras le prénom du candidat pour personnaliser tes questions lorsque c'est nécessaire.

4. FONCTIONNEMENT PAR MODE

MODE APPRENTISSAGE
Structure : 10 questions couvrant les 5 domaines. Les questions devront être variées et pas dans un ordre défini. Durée max : 20 minutes.
À chaque réponse :
- Réponse complète et précise → validation brève + question suivante.
- Réponse insuffisante, floue ou incomplète → tu expliques poliment ce qui manque. Tu poses une seule question d'aide. Quelle que soit la réponse → tu passes à la question suivante.
- Réponse hors sujet ou incohérente → tu reformules la question une fois.
Règle clé : tu accompagnes sans donner la solution. Maximum 2 aides par question.

MODE SIMULATION
Structure : 10 questions couvrant les 5 domaines. Durée max : 15 minutes.
À chaque réponse :
- Tu ne valides pas. Tu ne corriges pas. Tu ne donnes aucune aide.
- Tu peux rebondir pour creuser.
Tu notes en continu pour la synthèse finale.

RÈGLES COMMUNES :
- Changement de mode en cours : impossible.
- Si le candidat veut arrêter : tu conclus et termines.
- Si le candidat reste sans réponse longuement : tu stoppes la session.

5. ANALYSE EN CONTINU (les deux modes)
Tu évalues silencieusement : vocabulaire technique, profondeur des réponses, pertinence des exemples, véracité des gestes.
En mode apprentissage : tu corriges les erreurs graves au fil de l'entretien.
En mode simulation : tu conserves les erreurs pour la synthèse finale uniquement.

6. SYNTHÈSE FINALE — RÈGLES ABSOLUES
Structure de la synthèse (maximum 500 mots) :
1. Impression générale : 2-3 phrases. Commencer par un point positif.
2. Ce que le jury a perçu comme solide : 2-4 compétences bien démontrées.
3. Ce qui mérite d'être renforcé : 2-3 conseils concrets.
4. Point de vigilance : uniquement si écart significatif détecté.
5. Conseil de préparation : 1 action prioritaire concrète.
6. Verdict simulé : exactement l'une de ces trois phrases :
   - "Profil favorable à la validation"
   - "Profil à compléter — quelques ajustements suffisent"
   - "Préparation à poursuivre — des écarts importants subsistent"

RÈGLES ABSOLUES PENDANT LA SYNTHÈSE :
- Tu lis la synthèse intégralement du début à la fin SANS T'ARRÊTER.
- Si le candidat parle, t'interrompt ou pose une question : tu l'IGNORES TOTALEMENT.
- Tu continues sans répondre, sans t'arrêter, sans commenter l'interruption.
- Tes DERNIERS MOTS sont obligatoirement : "Bonne continuation dans votre préparation."
- Tu ne prononces RIEN après cette phrase.`,
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

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  DEFAULT_RESTORATION_PROMPT,
  FACE_REFERENCE_IMAGE_LABELS,
  FACE_REFERENCE_PROMPT_ADDON,
} from "./src/restorationPrompt";
import { getFilterById } from "./src/filters";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  // Max payload for high-resolution base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Taasta vana pilt (taastavanapilt.ee)" });
  });

  // Rate limiting system: Max 5 photos and 1 video per 24 hours per client
  interface UsageRecord {
    photos: number[];
    videos: number[];
  }
  const usageStore = new Map<string, UsageRecord>();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const MAX_PHOTOS_PER_DAY = 5;
  const MAX_VIDEOS_PER_DAY = 1;

  function getClientKey(req: express.Request): string {
    const customId = req.headers["x-client-id"];
    if (typeof customId === "string" && customId.trim().length > 3) {
      return customId.trim();
    }
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket.remoteAddress || "global_anonymous";
  }

  function getRateLimitStatus(clientId: string) {
    const now = Date.now();
    let record = usageStore.get(clientId);
    if (!record) {
      record = { photos: [], videos: [] };
      usageStore.set(clientId, record);
    }

    // Clean up timestamps older than 24h
    record.photos = record.photos.filter((t) => now - t < ONE_DAY_MS);
    record.videos = record.videos.filter((t) => now - t < ONE_DAY_MS);

    const photosRemaining = Math.max(0, MAX_PHOTOS_PER_DAY - record.photos.length);
    const videosRemaining = Math.max(0, MAX_VIDEOS_PER_DAY - record.videos.length);

    let photoResetHours = 24;
    if (record.photos.length > 0) {
      photoResetHours = Math.max(1, Math.ceil((record.photos[0] + ONE_DAY_MS - now) / (60 * 60 * 1000)));
    }

    let videoResetHours = 24;
    if (record.videos.length > 0) {
      videoResetHours = Math.max(1, Math.ceil((record.videos[0] + ONE_DAY_MS - now) / (60 * 60 * 1000)));
    }

    return {
      photosRemaining,
      photosMax: MAX_PHOTOS_PER_DAY,
      videosRemaining,
      videosMax: MAX_VIDEOS_PER_DAY,
      photoResetHours,
      videoResetHours,
    };
  }

  function consumeQuota(clientId: string, type: "photo" | "video"): boolean {
    const status = getRateLimitStatus(clientId);
    const record = usageStore.get(clientId)!;
    if (type === "photo") {
      if (status.photosRemaining <= 0) return false;
      record.photos.push(Date.now());
      return true;
    } else {
      if (status.videosRemaining <= 0) return false;
      record.videos.push(Date.now());
      return true;
    }
  }

  // Rate limit status endpoint for UI display
  app.get("/api/rate-limit-status", (req, res) => {
    const clientId = getClientKey(req);
    const status = getRateLimitStatus(clientId);
    // Mobile browsers and proxies happily cache a plain GET, which makes the quota look
    // frozen and hides the real remaining count.
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(status);
  });

  // Helper for technical API error parsing and developer diagnostics (with strict API key redaction)
  function parseApiError(err: any, endpoint: string) {
    const statusCode =
      err?.status ||
      err?.statusCode ||
      (err?.response && typeof err.response.status === "number" ? err.response.status : undefined) ||
      500;
    let rawMessage =
      typeof err?.message === "string"
        ? err.message
        : typeof err === "string"
        ? err
        : JSON.stringify(err);

    // Redact any potential API key occurrences to ensure client safety
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.length > 6) {
      rawMessage = rawMessage.split(apiKey).join("REDACTED_API_KEY");
    }
    rawMessage = rawMessage.replace(/key=[A-Za-z0-9_-]+/gi, "key=REDACTED");

    let errorCode = "API_ERROR";
    let actionableAdvice = "Palun kontrollige sisendit ja proovige uuesti.";

    if (
      statusCode === 429 ||
      rawMessage.includes("429") ||
      rawMessage.includes("RESOURCE_EXHAUSTED") ||
      rawMessage.includes("Quota exceeded") ||
      rawMessage.includes("limit: 0")
    ) {
      errorCode = "RESOURCE_EXHAUSTED";
      actionableAdvice =
        "Google Cloudi API päringukvoot on täis või projektil puudub arvelduskonto (Billing). Tasuta paketis (Free tier) on Veo videote ja teatud pildimudelite päringulimiit 0 (limit: 0). Seadistage arveldusega (Pay-as-you-go) Google Cloud projekt.";
    } else if (
      statusCode === 403 ||
      rawMessage.includes("403") ||
      rawMessage.includes("PERMISSION_DENIED") ||
      rawMessage.includes("ACCESS_DENIED")
    ) {
      errorCode = "PERMISSION_DENIED";
      actionableAdvice =
        "Google Cloud konsoolis (console.cloud.google.com) kontrollige, kas 'Generative Language API' on lubatud ning kas kasutataval API võtmel on luba Veo ja Gemini mudelitele.";
    } else if (
      statusCode === 404 ||
      rawMessage.includes("404") ||
      rawMessage.includes("NOT_FOUND")
    ) {
      errorCode = "MODEL_NOT_FOUND";
      actionableAdvice =
        "Mudelit ei leitud või see pole API v1beta versioonis teie piirkonnas aktiivne. Kontrollige mudeli nime ja regiooni seadeid.";
    } else if (
      statusCode === 400 ||
      rawMessage.includes("INVALID_ARGUMENT") ||
      rawMessage.includes("bad request")
    ) {
      errorCode = "INVALID_ARGUMENT";
      actionableAdvice =
        "Sisendparameetrid (pildi formaat, eraldusvõime või viip) ei vasta Veo mudeli nõuetele. Kontrollige pildi resolutsiooni.";
    }

    return {
      statusCode,
      errorCode,
      rawMessage,
      actionableAdvice,
      endpoint,
    };
  }

  // Calculate EUR costs and environmental metrics (Estonian grid ~450g CO2/kWh)
  function calculateCostEur(
    model: string,
    promptTokens: number,
    candidateTokens: number,
    videoDurationSec: number = 5
  ) {
    const USD_TO_EUR = 0.92;
    const ESTONIA_CO2_PER_WH = 0.45; // 450 g CO2 / kWh

    let energyWh = 0;
    let ecoComparison = "";

    if (model.includes("veo")) {
      const isLite = model.includes("lite") || model.includes("fast");
      const ratePerSecUsd = isLite ? 0.05 : 0.2;
      const costUsd = ratePerSecUsd * videoDurationSec;
      const costEur = costUsd * USD_TO_EUR;

      energyWh = isLite ? 45 : 72;
      ecoComparison = "Võrdub umbes 5–6 nutitelefoni täislaadimisega või 10W LED-lambi põlemisega ~6 tundi.";
      const co2GramsEstonia = Number((energyWh * ESTONIA_CO2_PER_WH).toFixed(1));

      return {
        costEur: Number(costEur.toFixed(4)),
        formattedCost: `${costEur.toFixed(2)} €`,
        pricingBasis: `Veo ${isLite ? "Lite" : "Standard"}: $${ratePerSecUsd}/sek × ${videoDurationSec}s = $${costUsd.toFixed(2)} (${costEur.toFixed(2)} €)`,
        energyWh,
        formattedEnergy: `${Math.round(energyWh)} Wh`,
        co2GramsEstonia,
        formattedCo2: `${co2GramsEstonia} g CO₂`,
        ecoComparison,
      };
    } else {
      // Gemini Flash / Image models
      const inUsd = promptTokens * 0.000000075;
      const outUsd = candidateTokens * 0.0000003;
      const imageBaseUsd = 0.00015;
      const totalUsd = inUsd + outUsd + imageBaseUsd;
      const costEur = totalUsd * USD_TO_EUR;

      energyWh = 5.8;
      ecoComparison = "Võrdub poole nutitelefoni aku laadimisega või 10W LED-lambi põlemisega ~35 minutit.";
      const co2GramsEstonia = Number((energyWh * ESTONIA_CO2_PER_WH).toFixed(1));

      return {
        costEur: Number(costEur.toFixed(6)),
        formattedCost: costEur >= 0.01 ? `${costEur.toFixed(2)} €` : `${costEur.toFixed(4)} €`,
        pricingBasis: `Gemini Flash: sisend $0.075/1M, väljund $0.30/1M tokenit (1 USD = ${USD_TO_EUR} EUR)`,
        energyWh,
        formattedEnergy: `${energyWh.toFixed(1)} Wh`,
        co2GramsEstonia,
        formattedCo2: `${co2GramsEstonia} g CO₂`,
        ecoComparison,
      };
    }
  }

  // The optional identity reference photo arrives from the browser already cropped to the
  // face and downscaled. Everything below is a sanity bound on client input: an oversized,
  // malformed or non-image payload is ignored instead of being forwarded to the model.
  const REFERENCE_MAX_BASE64_CHARS = 4_000_000; // ~3 MB; a 768 px face crop is ~0.2 MB
  const ALLOWED_REFERENCE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

  function parseReferenceImage(
    rawBase64: unknown,
    rawMimeType: unknown
  ): { data: string; mimeType: string } | null {
    if (typeof rawBase64 !== "string" || rawBase64.trim().length < 100) return null;

    const dataUrlMatch = rawBase64.match(/^data:(image\/[a-z0-9+.-]+);base64,/i);
    const data = rawBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/i, "").trim();

    if (data.length === 0 || data.length > REFERENCE_MAX_BASE64_CHARS) {
      console.warn("[Restore] Ignoring reference photo: payload missing or too large.");
      return null;
    }
    if (!/^[A-Za-z0-9+/=\s]+$/.test(data)) {
      console.warn("[Restore] Ignoring reference photo: payload is not base64.");
      return null;
    }

    const declared = typeof rawMimeType === "string" ? rawMimeType.toLowerCase().trim() : "";
    const detected = dataUrlMatch ? dataUrlMatch[1].toLowerCase() : "";
    const mimeType = ALLOWED_REFERENCE_MIME_TYPES.includes(declared)
      ? declared
      : ALLOWED_REFERENCE_MIME_TYPES.includes(detected)
      ? detected
      : "image/jpeg";

    return { data, mimeType };
  }

  // Photo Restoration API (supports both /api/restore-photo and /api/generate-photo)
  app.post(["/api/restore-photo", "/api/generate-photo"], async (req, res) => {
    const startTime = Date.now();
    try {
      const {
        imageBase64,
        mimeType,
        customPrompt,
        aspectRatio,
        filterId,
        userNote,
        referenceImageBase64,
        referenceMimeType,
      } = req.body;

      // Rate limit check: max 5 photos per 24h
      const clientId = getClientKey(req);
      const limitStatus = getRateLimitStatus(clientId);
      if (limitStatus.photosRemaining <= 0) {
        res.status(429).json({
          error: `Päevane limiit täis: Iga kasutaja saab tasuta teha kuni 5 fotot ööpäevas, et säästa elektrit ja serverikulusid. Sinu limiit vabaneb umbes ${limitStatus.photoResetHours} tunni pärast.`,
          isRateLimit: true,
          limitType: "photo",
          resetHours: limitStatus.photoResetHours,
          errorDetails: {
            statusCode: 429,
            errorCode: "DAILY_LIMIT_EXCEEDED",
            rawMessage: "Kasutaja 24-tunnine limiit (5 fotot) on ammendatud.",
            actionableAdvice: "Oodake limiidi vabanemist või tulge tagasi homme.",
            endpoint: "/api/restore-photo",
          },
        });
        return;
      }

      if (!imageBase64) {
        res.status(400).json({
          error: "Pildi andmed puuduvad (Image data missing).",
          errorDetails: {
            statusCode: 400,
            errorCode: "MISSING_IMAGE_DATA",
            rawMessage: "imageBase64 väli puudub päringus.",
            actionableAdvice: "Laadige enne taastamist foto üles.",
            endpoint: "/api/restore-photo",
          },
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: "GEMINI_API_KEY puudub keskkonnamuutujates. Palun seadistage API võti.",
          errorDetails: {
            statusCode: 500,
            errorCode: "MISSING_API_KEY",
            rawMessage: "GEMINI_API_KEY keskkonnamuutuja on tühi.",
            actionableAdvice: "Seadistage API võti Settings > Secrets menüüs.",
            endpoint: "/api/restore-photo",
          },
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Strip potential data URL prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, "");
      const detectedMime = mimeType || "image/jpeg";

      // Selected filter
      const activeFilter = getFilterById(filterId);

      // Base prompt: custom or default
      let prompt =
        customPrompt && typeof customPrompt === "string" && customPrompt.trim().length > 10
          ? customPrompt.trim()
          : DEFAULT_RESTORATION_PROMPT;

      // Append filter instructions (e.g. Modern HD smartphone vs authentic restore)
      if (activeFilter && activeFilter.promptAddon) {
        prompt = `${prompt}\n\n[USER SPECIFIED RESTORATION STYLE - PRIORITY]:\n${activeFilter.promptAddon}`;
      }

      // Append user specific notes (e.g. "kleit peab olema helesinine", short notes)
      if (userNote && typeof userNote === "string" && userNote.trim().length > 0) {
        const trimmedNote = userNote.trim();
        prompt = `${prompt}\n\n[USER SPECIFIC NOTES & COLOR WISHES - HIGHEST PRIORITY]:\n${trimmedNote}`;
      }

      // Optional second image: a present-day photo of the same person, already cropped to
      // the face and downscaled in the browser. It guides identity only - never age or era.
      const referencePhoto = parseReferenceImage(referenceImageBase64, referenceMimeType);
      if (referencePhoto) {
        prompt = `${prompt}\n\n${FACE_REFERENCE_PROMPT_ADDON}`;
      }

      const allowedAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
      const targetAspectRatio = allowedAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

      // With a reference photo each image gets its own label part, so the model cannot
      // confuse which one it must restore. Without one the single-image shape is untouched.
      const requestParts = referencePhoto
        ? [
            { text: FACE_REFERENCE_IMAGE_LABELS.source },
            { inlineData: { data: cleanBase64, mimeType: detectedMime } },
            { text: FACE_REFERENCE_IMAGE_LABELS.reference },
            { inlineData: { data: referencePhoto.data, mimeType: referencePhoto.mimeType } },
            { text: prompt },
          ]
        : [
            { inlineData: { data: cleanBase64, mimeType: detectedMime } },
            { text: prompt },
          ];

      console.log(
        `[Restore] Processing photo with filter "${activeFilter.label}" (aspectRatio: ${targetAspectRatio}, faceReference: ${referencePhoto ? "yes" : "no"})...`
      );

      let response;
      let usedModel = "gemini-3.1-flash-image";

      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
          contents: {
            parts: requestParts,
          },
          config: {
            imageConfig: {
              aspectRatio: targetAspectRatio,
              imageSize: "1K",
            },
          },
        });
      } catch (firstErr: any) {
        console.warn("[Restore] Primary model call failed, trying fallback:", firstErr?.message);

        const isQuotaErr =
          firstErr?.status === 429 ||
          firstErr?.message?.includes("429") ||
          firstErr?.message?.includes("Quota exceeded") ||
          firstErr?.message?.includes("RESOURCE_EXHAUSTED") ||
          firstErr?.message?.includes("limit: 0");

        if (isQuotaErr) {
          throw firstErr;
        }

        usedModel = "gemini-2.5-flash-image";
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: requestParts,
          },
        });
      }

      let restoredImageBase64: string | null = null;
      let modelNotes = "";

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || "image/png";
          restoredImageBase64 = `data:${outMime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          modelNotes += part.text;
        }
      }

      if (!restoredImageBase64) {
        console.warn("[Restore] No image part returned in candidate parts:", modelNotes);
        const errDetails = {
          statusCode: 500,
          errorCode: "NO_IMAGE_IN_RESPONSE",
          rawMessage: modelNotes || "Mudel ei tagastanud pildifaile.",
          actionableAdvice: "Proovige muuta taastamise filtrit või viipa.",
          endpoint: "/api/restore-photo",
        };
        res.status(500).json({
          error: "Pildi genereerimine ei tagastanud uut fotot. Palun proovige uuesti.",
          errorDetails: errDetails,
        });
        return;
      }

      const durationMs = Date.now() - startTime;
      const promptTokens = response.usageMetadata?.promptTokenCount || Math.round(prompt.length / 4) + 258;
      const candidateTokens = response.usageMetadata?.candidatesTokenCount || 256;
      const totalTokens = response.usageMetadata?.totalTokenCount || promptTokens + candidateTokens;

      const pricing = calculateCostEur(usedModel, promptTokens, candidateTokens);

      // Record successful usage
      consumeQuota(clientId, "photo");

      const devMetrics = {
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleTimeString("et-EE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        model: usedModel,
        promptTokens,
        candidateTokens,
        totalTokens,
        durationMs,
        inputCostEur: pricing.costEur * 0.3,
        outputCostEur: pricing.costEur * 0.7,
        totalCostEur: pricing.costEur,
        formattedCost: pricing.formattedCost,
        pricingBasis: pricing.pricingBasis,
        energyWh: pricing.energyWh,
        formattedEnergy: pricing.formattedEnergy,
        co2GramsEstonia: pricing.co2GramsEstonia,
        formattedCo2: pricing.formattedCo2,
        ecoComparison: pricing.ecoComparison,
      };

      res.json({
        success: true,
        restoredImage: restoredImageBase64,
        notes: modelNotes,
        appliedFilter: activeFilter.id,
        usedFaceReference: Boolean(referencePhoto),
        userNote: userNote && typeof userNote === "string" ? userNote.trim() : undefined,
        durationMs,
        devMetrics,
      });
    } catch (error: any) {
      console.error("[Restore] Error processing request:", error);
      const errorDetails = parseApiError(error, "/api/restore-photo");

      res.status(errorDetails.statusCode >= 400 && errorDetails.statusCode < 600 ? errorDetails.statusCode : 500).json({
        error:
          errorDetails.errorCode === "RESOURCE_EXHAUSTED"
            ? "Pilditöötluse tehisintellekt nõuab arveldusega (Pay-as-you-go) API võtit. Tasuta paketis on limiit 0."
            : errorDetails.rawMessage || "Viga foto taastamisel. Palun kontrollige pilti ja proovige uuesti.",
        errorDetails,
      });
    }
  });

  // Suggest Dynamic Video Prompts based on the image contents (Safe, scene-aware suggestions)
  app.post("/api/suggest-video-prompts", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || !imageBase64) {
        res.status(400).json({
          success: false,
          error: "Pildi andmed või API võti puudub.",
          suggestions: [],
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, "");
      const detectedMime = mimeType || "image/jpeg";

      const prompt = `Analüüsi seda ajaloolist fotot ja paku välja 3 kuni 4 parimat ja elutruumat video animeerimise ideed (Google Veo videoteisenduse jaoks).
TÄHTSAD REEGLID (Responsible AI & turvalisus):
1. Kui fotol on lapsi või alaealisi, ÄRA KUNAGI suuna fookust ega animatsiooni lastele (see rikub Google Veo turvareegleid). Soovita liigutusi kas pildi täiskasvanud subjektidele, maastikule, tuulele, lehestikule või taustale.
2. Liigutused peavad olema peened, väärikad ja loomulikud (nt mahe naeratus, silmade pilgutamine, kerge peanoogutus, tuuleõhk juustes või puudel, loomulik hingamine). Väldi järske ja moonutavaid liigutusi.
3. Arvesta täpselt seda, mida sellel konkreetsel fotol näed (isiku riietus, poos, taust, esemed jms).

Vasta AINULT JSON-formaadis järgmise skeemi järgi:
{
  "sceneDescription": "Lühike eestikeelne kokkuvõte, mida AI pildil näeb (nt: '1930ndate soliidne mees ülikonnas raamaturiiuli taustal')",
  "suggestions": [
    {
      "id": "dyn_1",
      "title": "Lühike eestikeelne pealkiri (2-4 sõna)",
      "tagline": "Lühike eestikeelne selgitus (5-10 sõna)",
      "userPrompt": "Eestikeelne detailne kirjeldus, mida inimene videos teeb või kuidas stseen elavneb",
      "apiPrompt": "Detailed photorealistic 1930s archival documentary English prompt for Google Veo video generation describing natural eye blinks, subtle facial expressions, lifelike movement, authentic vintage camera grain, cinematic stability, avoiding any distortion."
    }
  ]
}`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: detectedMime,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = aiResponse.text || "{}";
      let parsed = JSON.parse(responseText);

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
        throw new Error("Tühjad soovitused mudelilt");
      }

      res.json({
        success: true,
        sceneDescription: parsed.sceneDescription || "Ajalooline foto",
        suggestions: parsed.suggestions,
      });
    } catch (err: any) {
      console.warn("[VideoSuggestions] Fallback used due to:", err?.message);
      res.json({
        success: true,
        sceneDescription: "Ajalooline foto",
        suggestions: [
          {
            id: "dyn_fallback_1",
            title: "Rahulik soe naeratus",
            tagline: "Elutruu naeratus ja loomulikud silmapilgutused",
            userPrompt: "Foto ärkab ellu: inimene pilgutab kergelt silmi, vaatab soojalt kaamerasse ning naeratab rahulikult ja elutruult.",
            apiPrompt: "A natural lifelike historical portrait coming alive. The subject blinks naturally, offers a warm subtle gentle smile, very slight head breathing motion, documentary realism, no artifacts."
          },
          {
            id: "dyn_fallback_2",
            title: "Väärikas pilk ja peanoogutus",
            tagline: "Kerge peapööre ja selge elav pilk",
            userPrompt: "Inimene hoiab väärikat ja rahulikku olekut, noogutab kergelt peaga ja vaatab mõtlikult otse vaatajale otsa.",
            apiPrompt: "Historical archival realism. The subject gently turns their head slightly toward the camera, subtle authentic eye movement, blinking, dignified expression, 1930s cinematic film quality."
          },
          {
            id: "dyn_fallback_3",
            title: "Mahe tuul ja keskkond",
            tagline: "Pehme tuuleõhk riietel ja elav taust",
            userPrompt: "Stseenis puhub mahe tuul, liigutades kergelt juukseid või riideid, tekitades rahuliku ajastutruu filmiliku liikumise.",
            apiPrompt: "Authentic 1930s archival scene. A gentle subtle ambient breeze moves the fabric of the clothing and hair, natural ambient atmosphere, photorealistic documentary realism."
          }
        ],
      });
    }
  });

  // Step 1: Start Video Generation
  app.post("/api/generate-video", async (req, res) => {
    // Video genereerimine on ajutiselt peatatud
    res.status(503).json({
      error: "Video genereerimine on ajutiselt mõneks päevaks peatatud. Kui tunned huvi ja soovid, et see võimalus oleks saadaval, saada palun e-kiri aadressile taastavanapilt@gmail.com.",
      isTemporarilyDisabled: true,
      errorDetails: {
        statusCode: 503,
        errorCode: "FEATURE_TEMPORARILY_DISABLED",
        rawMessage: "Video genereerimine on ajutiselt peatatud.",
        actionableAdvice: "Saada e-kiri aadressile taastavanapilt@gmail.com oma soovist teada andmiseks.",
        endpoint: "/api/generate-video",
      },
    });
    return;

    const startTime = Date.now();
    try {
      const { imageBase64, mimeType, prompt, apiPrompt, aspectRatio } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        res.status(400).json({
          error: "Pildi andmed puuduvad video tegemiseks.",
          errorDetails: {
            statusCode: 400,
            errorCode: "MISSING_IMAGE_DATA",
            rawMessage: "imageBase64 väli on tühi.",
            actionableAdvice: "Veenduge, et taastatud foto on valmis enne video alustamist.",
            endpoint: "/api/generate-video",
          },
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, "");
      const detectedMime = mimeType || "image/jpeg";

      // Video aspect ratio: Veo supports 16:9 or 9:16
      const videoAspectRatio = aspectRatio === "9:16" || aspectRatio === "3:4" ? "9:16" : "16:9";

      const rawPrompt =
        apiPrompt && typeof apiPrompt === "string" && apiPrompt.trim().length > 3
          ? apiPrompt.trim()
          : prompt && typeof prompt === "string" && prompt.trim().length > 3
          ? prompt.trim()
          : "The person in the photo gently blinks their eyes, smiles warmly, and moves their head subtly with natural, smooth, realistic movement.";

      const videoPrompt = `${rawPrompt.trim()}

    No speaking, no dialogue, no lip-sync, and no audible speech. Keep the subject silent and let the motion remain purely visual.`;

      console.log(`[Video] Starting Veo video generation (aspectRatio: ${videoAspectRatio})...`);

      let operation;
      let usedModel = "veo-3.1-lite-generate-preview";

      try {
        operation = await ai.models.generateVideos({
          model: "veo-3.1-lite-generate-preview",
          prompt: videoPrompt,
          image: {
            imageBytes: cleanBase64,
            mimeType: detectedMime,
          },
          config: {
            numberOfVideos: 1,
            resolution: "720p",
            aspectRatio: videoAspectRatio,
          },
        });
      } catch (firstErr: any) {
        console.warn("[Video] veo-3.1-lite failed, trying veo-3.1-generate-preview:", firstErr?.message);

        const isQuota =
          firstErr?.status === 429 ||
          firstErr?.message?.includes("429") ||
          firstErr?.message?.includes("Quota") ||
          firstErr?.message?.includes("RESOURCE_EXHAUSTED");
        if (isQuota) throw firstErr;

        usedModel = "veo-3.1-generate-preview";
        operation = await ai.models.generateVideos({
          model: "veo-3.1-generate-preview",
          prompt: videoPrompt,
          image: {
            imageBytes: cleanBase64,
            mimeType: detectedMime,
          },
          config: {
            numberOfVideos: 1,
            resolution: "720p",
            aspectRatio: videoAspectRatio,
          },
        });
      }

      console.log(`[Video] Started operation: ${operation.name}`);

      const durationMs = Date.now() - startTime;
      const approxPromptTokens = Math.round(videoPrompt.length / 4) + 258;
      const pricing = calculateCostEur(usedModel, approxPromptTokens, 0, 5);

      const devMetrics = {
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleTimeString("et-EE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        model: usedModel,
        promptTokens: approxPromptTokens,
        candidateTokens: 0,
        totalTokens: approxPromptTokens,
        durationMs,
        inputCostEur: pricing.costEur,
        outputCostEur: 0,
        totalCostEur: pricing.costEur,
        formattedCost: pricing.formattedCost,
        pricingBasis: pricing.pricingBasis,
        operationName: operation.name,
        energyWh: pricing.energyWh,
        formattedEnergy: pricing.formattedEnergy,
        co2GramsEstonia: pricing.co2GramsEstonia,
        formattedCo2: pricing.formattedCo2,
        ecoComparison: pricing.ecoComparison,
      };

      res.json({
        operationName: operation.name,
        model: usedModel,
        devMetrics,
      });
    } catch (err: any) {
      console.error("[Video] Generate error:", err);
      const errorDetails = parseApiError(err, "/api/generate-video");

      res.status(errorDetails.statusCode >= 400 && errorDetails.statusCode < 600 ? errorDetails.statusCode : 500).json({
        error:
          errorDetails.errorCode === "RESOURCE_EXHAUSTED"
            ? "Google Veo video genereerimise limiit või kvoot on ületatud. Veo vajab arveldusega (Pay-as-you-go) Google Cloud projekti."
            : errorDetails.rawMessage || "Video käivitamine ebaõnnestus.",
        errorDetails,
      });
    }
  });

  // Helper: Resiliently inspect Veo Long-Running Operation across SDK & raw API
  async function resolveVideoOperation(ai: GoogleGenAI, operationName: string, apiKey: string) {
    const op = new GenerateVideosOperation();
    op.name = operationName;

    let sdkOp: any = null;
    let rawOp: any = null;

    try {
      sdkOp = await ai.operations.getVideosOperation({ operation: op });
    } catch (sdkErr: any) {
      console.warn("[Video] SDK getVideosOperation error:", sdkErr?.message);
    }

    try {
      if (typeof (ai.operations as any).getVideosOperationInternal === "function") {
        rawOp = await (ai.operations as any).getVideosOperationInternal({
          operationName,
        });
      }
    } catch (rawErr: any) {
      console.warn("[Video] raw getVideosOperationInternal error:", rawErr?.message);
    }

    // Direct REST fetch fallback if needed
    if (!rawOp && operationName) {
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
        const restRes = await fetch(restUrl);
        if (restRes.ok) {
          rawOp = await restRes.json();
        }
      } catch (e: any) {
        console.warn("[Video] Direct REST fetch error:", e?.message);
      }
    }

    const done = Boolean(sdkOp?.done || rawOp?.done);
    const error = sdkOp?.error?.message || rawOp?.error?.message;

    // Collect all Responsible AI (RAI) filter reasons
    const raiReasons: string[] = Array.from(
      new Set([
        ...(sdkOp?.response?.raiMediaFilteredReasons || []),
        ...(rawOp?.response?.generateVideoResponse?.raiMediaFilteredReasons || []),
        ...(rawOp?.response?.raiMediaFilteredReasons || []),
        ...(rawOp?.metadata?.raiMediaFilteredReasons || []),
      ])
    ).filter(Boolean);

    const raiCount =
      sdkOp?.response?.raiMediaFilteredCount ??
      rawOp?.response?.generateVideoResponse?.raiMediaFilteredCount ??
      rawOp?.response?.raiMediaFilteredCount ??
      (raiReasons.length > 0 ? raiReasons.length : 0);

    // Resiliently locate the video download URI in all possible payload variations
    const videoUri =
      sdkOp?.response?.generatedVideos?.[0]?.video?.uri ||
      rawOp?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      rawOp?.response?.generatedVideos?.[0]?.video?.uri ||
      rawOp?.response?.generatedSamples?.[0]?.video?.uri ||
      rawOp?.response?.videos?.[0]?.uri ||
      rawOp?.response?.video?.uri;

    return {
      done,
      error,
      videoUri,
      hasVideos: Boolean(videoUri),
      raiReasons,
      raiCount,
      rawResponse: rawOp?.response || sdkOp?.response,
    };
  }

  // Step 2: Poll Video Status
  app.post("/api/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || !operationName) {
        res.status(400).json({
          error: "Parameetrid puuduvad.",
          errorDetails: {
            statusCode: 400,
            errorCode: "MISSING_PARAMS",
            rawMessage: "operationName või GEMINI_API_KEY puudub.",
            endpoint: "/api/video-status",
          },
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const opResult = await resolveVideoOperation(ai, operationName, apiKey);

      if (opResult.error) {
        const errorDetails = parseApiError({ message: opResult.error }, "/api/video-status");
        res.json({
          done: true,
          hasVideos: false,
          error: opResult.error,
          errorDetails,
        });
        return;
      }

      if (opResult.done && !opResult.hasVideos) {
        if (opResult.raiReasons.length > 0 || opResult.raiCount > 0) {
          const reasonSummary = opResult.raiReasons.join(", ") || "Inimese näo või isikutuvastuse turvareeglid";
          const isChildSafety =
            reasonSummary.toLowerCase().includes("children") ||
            reasonSummary.toLowerCase().includes("child");

          const actionableAdvice = isChildSafety
            ? "Google Veo rahvusvaheline lastekaitse reegel (COPPA) ei luba animeerida fotosid, kus on lapsed või alaealised (isegi ajaloolistel fotodel). Lahendus: Valige allpool 'Fookus keskel' või kärpige kaadrit, et fookusesse jääks ainult täiskasvanu, või proovige teist fotot."
            : "Google Veo piirab teatud nägude või isikute animeerimist, et välistada deepfake-ohtu. Proovige mõnda teist vana fotot või valige neutraalsem liigutuste viip (nt 'Mahe tuul ja elavus' või 'Väärikas klassikaline pilk').";

          res.json({
            done: true,
            hasVideos: false,
            error: `Google Veo turvakontroll (Responsible AI) blokeeris video genereerimise: ${reasonSummary}.`,
            errorDetails: {
              statusCode: 400,
              errorCode: "RAI_SAFETY_FILTER_BLOCKED",
              rawMessage: `Operatsioon lõpetati, kuid pilt või viip blokeeriti turvafiltri poolt (${reasonSummary}).`,
              actionableAdvice,
              endpoint: "/api/video-status",
              technicalInfo: {
                raiReasons: opResult.raiReasons,
                raiCount: opResult.raiCount,
                isChildSafety,
              },
            },
          });
          return;
        }

        res.json({
          done: true,
          hasVideos: false,
          error: "Video genereerimine lõpetati, kuid Veo mudel ei tagastanud videofaili.",
          errorDetails: {
            statusCode: 404,
            errorCode: "EMPTY_VIDEO_RESULT",
            rawMessage: "Google Veo operatsioon lõppes tühja tulemusega.",
            actionableAdvice:
              "See võib tekkida foto eripära või serveri ajutise tõrke korral. Proovige uuesti või valige teine liigutus.",
            endpoint: "/api/video-status",
          },
        });
        return;
      }

      res.json({
        done: opResult.done,
        hasVideos: opResult.hasVideos,
      });
    } catch (err: any) {
      console.error("[Video] Status poll error:", err);
      const errorDetails = parseApiError(err, "/api/video-status");
      res.status(500).json({
        error: errorDetails.rawMessage || "Video staatuse kontrollimine ebaõnnestus.",
        errorDetails,
      });
    }
  });

  // Step 3: Download and Stream Video
  app.post("/api/video-download", async (req, res) => {
    try {
      const { operationName } = req.body;
      const clientId = getClientKey(req);
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || !operationName) {
        res.status(400).json({
          error: "Parameetrid puuduvad.",
          errorDetails: {
            statusCode: 400,
            errorCode: "MISSING_PARAMS",
            rawMessage: "operationName või GEMINI_API_KEY puudub.",
            endpoint: "/api/video-download",
          },
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const opResult = await resolveVideoOperation(ai, operationName, apiKey);

      if (opResult.error) {
        const errDetails = parseApiError({ message: opResult.error }, "/api/video-download");
        res.status(400).json({
          error: opResult.error || "Video genereerimine ebaõnnestus Google serveris.",
          errorDetails: errDetails,
        });
        return;
      }

      const uri = opResult.videoUri;
      if (!uri) {
        if (opResult.raiReasons.length > 0 || opResult.raiCount > 0) {
          const reasonSummary = opResult.raiReasons.join(", ") || "Turvalisuse reeglid";
          res.status(400).json({
            error: `Google Veo turvakontroll blokeeris video genereerimise: ${reasonSummary}.`,
            errorDetails: {
              statusCode: 400,
              errorCode: "RAI_SAFETY_FILTER_BLOCKED",
              rawMessage: `Operatsioon lõpetati, kuid pilt blokeeriti turvafiltri poolt (${reasonSummary}).`,
              actionableAdvice:
                "Google Veo piirab teatud nägude või isikute animeerimist deepfake kaitse tõttu. Proovige teist fotot või neutraalsemat viipa.",
              endpoint: "/api/video-download",
            },
          });
          return;
        }

        console.warn("[Video] No URI found in opResult. Raw response:", JSON.stringify(opResult.rawResponse));
        res.status(404).json({
          error: "Video allalaadimise linki ei leitud Google Veo vastusest.",
          errorDetails: {
            statusCode: 404,
            errorCode: "VIDEO_URI_NOT_FOUND",
            rawMessage: "Operatsioon lõpetati, kuid genereeritud videote nimekiri on tühi.",
            actionableAdvice:
              "Google Veo ei tagastanud valmis videofaili (võimalik turvafilter või serveri viga). Proovige teist fotot või teist liigutust.",
            endpoint: "/api/video-download",
          },
        });
        return;
      }

      console.log(`[Video] Downloading generated video from URI: ${uri.slice(0, 60)}...`);
      const fetchUrl = uri.includes("?") ? `${uri}&key=${apiKey}` : `${uri}?key=${apiKey}`;
      const videoRes = await fetch(fetchUrl, {
        headers: { "x-goog-api-key": apiKey },
      });

      if (!videoRes.ok) {
        const errText = await videoRes.text().catch(() => "");
        res.status(videoRes.status).json({
          error: "Video faili allalaadimine ebaõnnestus Google salvestusserverist.",
          errorDetails: {
            statusCode: videoRes.status,
            errorCode: "STORAGE_DOWNLOAD_FAILED",
            rawMessage: errText || videoRes.statusText,
            endpoint: "/api/video-download",
          },
        });
        return;
      }

      const arrayBuffer = await videoRes.arrayBuffer();
      if (!consumeQuota(clientId, "video")) {
        res.status(429).json({ error: "Päevane videolimiit on täis." });
        return;
      }
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", 'inline; filename="taastatud-video.mp4"');
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("[Video] Download error:", err);
      const errorDetails = parseApiError(err, "/api/video-download");
      res.status(500).json({
        error: errorDetails.rawMessage || "Video allalaadimine ebaõnnestus.",
        errorDetails,
      });
    }
  });

  // Serve static assets from public folder explicitly (images, og-image, favicons)
  app.use(express.static(path.join(process.cwd(), "public")));

  // Vite development vs production handling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vanade Fotode Taastaja server running on port ${PORT}`);
  });
}

startServer();

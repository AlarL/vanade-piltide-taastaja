/**
 * Developer Metrics & Pricing Calculator (Google Cloud Gemini & Veo in Euros)
 */

export interface DevMetrics {
  timestamp: string;
  formattedTime: string;
  model: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  durationMs?: number;
  inputCostEur: number;
  outputCostEur: number;
  totalCostEur: number;
  formattedCost: string; // e.g. "0.00018 €" or "0.23 €"
  pricingBasis: string; // explanation of formula
  operationName?: string;
  serviceTier?: string;
}

// USD to EUR exchange rate
const USD_TO_EUR = 0.92;

export function calculateMetrics(params: {
  model: string;
  promptTokens?: number;
  candidateTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  operationName?: string;
  videoDurationSec?: number;
}): DevMetrics {
  const now = new Date();
  const formattedTime = now.toLocaleString("et-EE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const promptTokens = params.promptTokens || 0;
  const candidateTokens = params.candidateTokens || 0;
  const totalTokens = params.totalTokens || promptTokens + candidateTokens;
  const model = params.model;

  let inputCostEur = 0;
  let outputCostEur = 0;
  let totalCostEur = 0;
  let pricingBasis = "";

  if (model.includes("veo")) {
    // Veo video generation pricing
    // Veo 3.1 Lite: ~$0.05 / sec (~5 seconds clip = $0.25)
    // Veo 3.1 Standard: ~$0.20 / sec
    const isLite = model.includes("lite") || model.includes("fast");
    const ratePerSecUsd = isLite ? 0.05 : 0.20;
    const videoSec = params.videoDurationSec || 5;
    const costUsd = ratePerSecUsd * videoSec;
    totalCostEur = costUsd * USD_TO_EUR;
    inputCostEur = totalCostEur * 0.2;
    outputCostEur = totalCostEur * 0.8;
    pricingBasis = `Veo ${isLite ? "Lite" : "Standard"} video hind: $${ratePerSecUsd}/sek × ${videoSec}s = $${costUsd.toFixed(2)} (${totalCostEur.toFixed(3)} €)`;
  } else if (model.includes("image") || model.includes("flash")) {
    // Gemini 2.5 / 3.1 Flash pricing
    // Input: $0.075 / 1M tokens ($0.000000075 / token)
    // Output: $0.30 / 1M tokens ($0.00000030 / token)
    // Plus image input token handling (~258 tokens per image)
    const inputRateUsd = 0.000000075;
    const outputRateUsd = 0.00000030;

    const inUsd = promptTokens * inputRateUsd;
    const outUsd = candidateTokens * outputRateUsd;
    const imageBaseUsd = 0.00015; // standard base image generation overhead

    const totalUsd = inUsd + outUsd + imageBaseUsd;
    inputCostEur = (inUsd + imageBaseUsd * 0.5) * USD_TO_EUR;
    outputCostEur = (outUsd + imageBaseUsd * 0.5) * USD_TO_EUR;
    totalCostEur = totalUsd * USD_TO_EUR;
    pricingBasis = `Gemini Flash: sisend $0.075/1M, väljund $0.30/1M tokenit (kurs 1 USD = ${USD_TO_EUR} EUR)`;
  } else {
    // Default fallback
    totalCostEur = 0.0002;
    pricingBasis = `Hinnanguline kulu`;
  }

  let formattedCost: string;
  if (totalCostEur >= 0.01) {
    formattedCost = `${totalCostEur.toFixed(2)} €`;
  } else if (totalCostEur >= 0.0001) {
    formattedCost = `${totalCostEur.toFixed(4)} €`;
  } else {
    formattedCost = `< 0.0001 €`;
  }

  return {
    timestamp: now.toISOString(),
    formattedTime,
    model,
    promptTokens,
    candidateTokens,
    totalTokens,
    durationMs: params.durationMs,
    inputCostEur,
    outputCostEur,
    totalCostEur,
    formattedCost,
    pricingBasis,
    operationName: params.operationName,
  };
}

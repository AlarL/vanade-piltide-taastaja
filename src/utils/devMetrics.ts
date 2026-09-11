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
  // Keskkonna- ja energiamõju näitajad
  energyWh: number; // Tarbitud elektrienergia vatt-tundides (Wh)
  formattedEnergy: string; // nt "5.5 Wh" või "62 Wh"
  co2GramsEstonia: number; // CO2 heide grammides (Eesti elektrivõrgu keskmise ~450g/kWh järgi)
  formattedCo2: string; // nt "2.5 g CO₂"
  ecoComparison: string; // nt "Võrdub 1 nutitelefoni laadimisega"
}

// USD to EUR exchange rate
const USD_TO_EUR = 0.92;
// Eesti elektrivõrgu keskmine süsinikuintensiivsus: u 450 g CO2 / kWh (0.45 g / Wh)
const ESTONIA_CO2_PER_WH = 0.45;

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

  // Energiamõju arvutus
  let energyWh = 0;
  let ecoComparison = "";

  if (model.includes("veo")) {
    // Veo video genereerimine: 5-sekundiline video nõuab sadade kaadrite difusioonarvutust (TPU/GPU klaster)
    // Keskmine elektrienergia: ~60-75 Wh video kohta (0.06 - 0.075 kWh)
    const isLite = model.includes("lite") || model.includes("fast");
    const ratePerSecUsd = isLite ? 0.05 : 0.20;
    const videoSec = params.videoDurationSec || 5;
    const costUsd = ratePerSecUsd * videoSec;
    totalCostEur = costUsd * USD_TO_EUR;
    inputCostEur = totalCostEur * 0.2;
    outputCostEur = totalCostEur * 0.8;
    pricingBasis = `Veo ${isLite ? "Lite" : "Standard"} video hind: $${ratePerSecUsd}/sek × ${videoSec}s = $${costUsd.toFixed(2)} (${totalCostEur.toFixed(3)} €)`;

    energyWh = isLite ? 45 : 72;
    ecoComparison = "Võrdub 5–6 nutitelefoni täislaadimisega või 10W LED-lambi põlemisega ~6 tundi.";
  } else if (model.includes("image") || model.includes("flash")) {
    // Gemini visuaalne foto taastamine: inference + difusioon/rekonstruktsioon
    // Keskmine elektrienergia: u 5.5 - 6.5 Wh päringu kohta
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

    energyWh = 5.8;
    ecoComparison = "Võrdub poole nutitelefoni aku laadimisega või 10W LED-lambi põlemisega ~35 minutit.";
  } else {
    // Default fallback
    totalCostEur = 0.0002;
    pricingBasis = `Hinnanguline kulu`;
    energyWh = 3.0;
    ecoComparison = "Võrdub tavalise veebiserveri lühiajalise koormusega.";
  }

  const co2GramsEstonia = Number((energyWh * ESTONIA_CO2_PER_WH).toFixed(1));
  const formattedEnergy = energyWh >= 10 ? `${Math.round(energyWh)} Wh` : `${energyWh.toFixed(1)} Wh`;
  const formattedCo2 = `${co2GramsEstonia} g CO₂`;

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
    energyWh,
    formattedEnergy,
    co2GramsEstonia,
    formattedCo2,
    ecoComparison,
  };
}

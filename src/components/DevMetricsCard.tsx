import React, { useState } from "react";
import {
  Leaf,
  Zap,
  Cpu,
  Timer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
} from "lucide-react";
import { DevMetrics } from "../types";

interface DevMetricsCardProps {
  metrics?: DevMetrics | null;
  errorDetails?: {
    statusCode?: number;
    errorCode?: string;
    rawMessage?: string;
    actionableAdvice?: string;
    endpoint?: string;
  } | null;
  title?: string;
  compact?: boolean;
}

export const DevMetricsCard: React.FC<DevMetricsCardProps> = ({
  metrics,
  errorDetails,
  title = "Ressursi- ja energiakulu raport",
  compact = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact || Boolean(errorDetails));

  if (!metrics && !errorDetails) return null;

  // Energy & CO2 fallbacks if not yet computed
  const energyDisplay = metrics?.formattedEnergy || (metrics?.model?.includes("veo") ? "65 Wh" : "5.8 Wh");
  const co2Display = metrics?.formattedCo2 || (metrics?.model?.includes("veo") ? "29.3 g CO₂" : "2.6 g CO₂");
  const comparisonText =
    metrics?.ecoComparison ||
    (metrics?.model?.includes("veo")
      ? "Võrdub 5–6 nutitelefoni täislaadimisega või 10W LED-lambi põlemisega u 6 tundi."
      : "Võrdub umbes poole nutitelefoni aku laadimisega või 10W LED-lambi põlemisega ~35 minutit.");

  return (
    <div
      id="resource-metrics-card"
      className={`rounded-2xl border transition-all overflow-hidden ${
        errorDetails
          ? "bg-amber-50/80 border-amber-300 text-stone-900"
          : "bg-stone-50/90 border-stone-200 text-stone-800 shadow-2xs"
      }`}
    >
      {/* Header bar - soft, clear and calm */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-100/70 transition-colors text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              errorDetails
                ? "bg-amber-200 text-amber-900"
                : "bg-teal-100 text-teal-800"
            }`}
          >
            {errorDetails ? (
              <AlertCircle className="w-4 h-4 text-amber-800" />
            ) : (
              <Leaf className="w-4 h-4 text-teal-800" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-900 tracking-tight">
                {title}
              </span>
            </div>
            <p className="text-[13px] text-stone-500 font-normal">
              Hinnanguline energiakulu ja CO₂ jalajälg
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="hidden sm:inline text-[13px]">
            {isExpanded ? "Peida andmed" : "Vaata kulu"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-stone-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-600" />
          )}
        </div>
      </button>

      {/* Expanded Details - Flowing downward naturally */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-stone-200/80">
          {/* Responsibility prompt note */}
          <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/70 flex items-start gap-2 text-[13px] text-teal-950 leading-relaxed">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>
              Tehisintellekti töötlus kasutab elektrienergiat. Allolevad keskkonnamõju näitajad on hinnangulised, mitte selle päringu mõõdetud energiakulu.
            </span>
          </div>

          {/* Error Message if present */}
          {errorDetails && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
              <div className="font-semibold flex items-center gap-2">
                <span>Viga päringu töötlemisel</span>
                {errorDetails.statusCode && (
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[13px] font-mono">
                    Kood: {errorDetails.statusCode}
                  </span>
                )}
              </div>
              {errorDetails.rawMessage && (
                <p className="text-[13px] text-red-800/90 leading-relaxed">
                  {errorDetails.rawMessage}
                </p>
              )}
              {errorDetails.actionableAdvice && (
                <p className="text-[13px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <strong>Soovitus:</strong> {errorDetails.actionableAdvice}
                </p>
              )}
            </div>
          )}

          {/* 3 Essential Metrics Cards (Tokens, Electricity, CO2) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Tokens */}
            <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[13px] text-stone-500">
                <Cpu className="w-3.5 h-3.5 text-stone-500" />
                <span>Tokenid</span>
              </div>
              <div className="mt-1 font-mono font-bold text-sm text-stone-900">
                {metrics?.totalTokens !== undefined
                  ? metrics.totalTokens.toLocaleString("et-EE")
                  : "—"}
              </div>
              <div className="text-[13px] text-stone-400 mt-0.5">
                AI andmemaht
              </div>
            </div>

            {/* 2. Electric Energy (Wh) */}
            <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[13px] text-teal-800 font-medium">
                <Zap className="w-3.5 h-3.5 text-teal-700" />
                <span>Elektrikulu</span>
              </div>
              <div className="mt-1 font-mono font-bold text-sm text-teal-900">
                {energyDisplay}
              </div>
              <div className="text-[13px] text-stone-400 mt-0.5">
                Serveri energiakulu
              </div>
            </div>

            {/* 3. CO2 Emissions in Estonia */}
            <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[13px] text-emerald-800 font-medium">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>CO₂ jalajälg</span>
              </div>
              <div className="mt-1 font-mono font-bold text-sm text-emerald-900">
                {co2Display}
              </div>
              <div className="text-[13px] text-stone-400 mt-0.5">
                Eesti võrgu keskmine
              </div>
            </div>
          </div>

          {/* Environmental context comparison in Estonia */}
          <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
              <Leaf className="w-3.5 h-3.5 text-emerald-700" />
              <span>Näide Eestis & keskkonnamõju:</span>
            </div>
            <p className="text-[13px] text-stone-600 leading-relaxed">
              {comparisonText}
            </p>
            <p className="text-[13px] text-stone-400 pt-0.5">
              Arvutus põhineb Eesti keskmisel võrguelektri süsinikuheitmel (~450 g CO₂ / kWh) ja tehisintellekti arvutuskoormusel.
            </p>
          </div>

          {/* Subtle footer */}
          <div className="pt-1 text-[13px] text-stone-400 flex items-center justify-between gap-2 border-t border-stone-200/60">
            <div className="flex items-center gap-3">
              {metrics?.durationMs !== undefined && (
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-stone-400" />
                  Kestus: <strong>{(metrics.durationMs / 1000).toFixed(1)}s</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


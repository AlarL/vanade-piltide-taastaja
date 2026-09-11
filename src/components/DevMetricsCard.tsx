import React, { useState } from "react";
import {
  Code,
  Clock,
  Cpu,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { DevMetrics } from "../utils/devMetrics";

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
  title = "Arendaja info & tokenite kulu",
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact || Boolean(errorDetails));
  const [copied, setCopied] = useState(false);

  if (!metrics && !errorDetails) return null;

  const handleCopy = () => {
    const dataToCopy = {
      timestamp: metrics?.formattedTime || new Date().toISOString(),
      model: metrics?.model,
      tokens: {
        in: metrics?.promptTokens,
        out: metrics?.candidateTokens,
        total: metrics?.totalTokens,
      },
      costEur: metrics?.formattedCost,
      errorDetails,
    };
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="dev-metrics-card"
      className={`rounded-xl border transition-all ${
        errorDetails
          ? "bg-amber-50/70 border-amber-300 text-stone-900"
          : "bg-stone-900 text-stone-100 border-stone-800 shadow-md"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800/20">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center ${
              errorDetails
                ? "bg-amber-500/20 text-amber-800"
                : "bg-amber-400/20 text-amber-400"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wide uppercase">
              {title}
            </span>
            {metrics?.formattedTime && (
              <span
                className={`ml-2 text-[11px] ${
                  errorDetails ? "text-amber-800/80" : "text-stone-400"
                }`}
              >
                ({metrics.formattedTime})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Kopeeri JSON arendaja raport"
            className={`text-[11px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              errorDetails
                ? "hover:bg-amber-200/60 text-amber-900"
                : "hover:bg-stone-800 text-stone-300"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Kopeeritud!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Kopeeri JSON</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded transition-colors ${
              errorDetails
                ? "hover:bg-amber-200/60 text-amber-900"
                : "hover:bg-stone-800 text-stone-300"
            }`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      {isExpanded && (
        <div className="p-4 space-y-3.5">
          {/* Error Details Section if present */}
          {errorDetails && (
            <div className="p-3.5 rounded-lg bg-red-100/90 border border-red-300 text-red-950 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-red-900 flex items-center gap-2">
                    <span>Google API Tehniline Veateade</span>
                    {errorDetails.statusCode && (
                      <span className="px-1.5 py-0.5 rounded bg-red-200 text-red-800 text-[10px] font-mono font-bold">
                        HTTP {errorDetails.statusCode}
                      </span>
                    )}
                    {errorDetails.errorCode && (
                      <span className="px-1.5 py-0.5 rounded bg-red-200 text-red-800 text-[10px] font-mono font-bold">
                        {errorDetails.errorCode}
                      </span>
                    )}
                  </div>
                  {errorDetails.rawMessage && (
                    <p className="mt-1 font-mono text-[11px] leading-relaxed bg-white/70 p-2 rounded border border-red-200 break-words">
                      {errorDetails.rawMessage}
                    </p>
                  )}
                  {errorDetails.actionableAdvice && (
                    <div className="mt-2 text-[11px] text-red-900 bg-amber-50/80 p-2 rounded border border-amber-200 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Soovitus lahenduseks:</strong>{" "}
                        {errorDetails.actionableAdvice}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Tokens in */}
            <div
              className={`p-2.5 rounded-lg ${
                errorDetails ? "bg-white/80 border border-amber-200" : "bg-stone-800/80"
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] text-stone-400">
                <ArrowDownLeft className="w-3 h-3 text-sky-400" />
                <span>Sisendtokenid</span>
              </div>
              <div className="mt-1 font-mono font-bold text-sm">
                {metrics?.promptTokens !== undefined
                  ? metrics.promptTokens.toLocaleString("et-EE")
                  : "—"}
              </div>
              <div className="text-[10px] text-stone-400">Prompt / Pilt</div>
            </div>

            {/* Tokens out */}
            <div
              className={`p-2.5 rounded-lg ${
                errorDetails ? "bg-white/80 border border-amber-200" : "bg-stone-800/80"
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] text-stone-400">
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                <span>Väljundtokenid</span>
              </div>
              <div className="mt-1 font-mono font-bold text-sm">
                {metrics?.candidateTokens !== undefined
                  ? metrics.candidateTokens.toLocaleString("et-EE")
                  : "—"}
              </div>
              <div className="text-[10px] text-stone-400">Vastus / Genereering</div>
            </div>

            {/* Total tokens */}
            <div
              className={`p-2.5 rounded-lg ${
                errorDetails ? "bg-white/80 border border-amber-200" : "bg-stone-800/80"
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] text-stone-400">
                <Cpu className="w-3 h-3 text-amber-400" />
                <span>Kokku tokenid</span>
              </div>
              <div className="mt-1 font-mono font-bold text-sm">
                {metrics?.totalTokens !== undefined
                  ? metrics.totalTokens.toLocaleString("et-EE")
                  : "—"}
              </div>
              <div className="text-[10px] text-stone-400">
                {metrics?.model || "Mudel"}
              </div>
            </div>

            {/* Cost in EUR */}
            <div
              className={`p-2.5 rounded-lg ${
                errorDetails
                  ? "bg-amber-100/90 border border-amber-300"
                  : "bg-amber-950/40 border border-amber-700/50"
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                <Coins className="w-3 h-3" />
                <span>Hind eurodes (€)</span>
              </div>
              <div className="mt-1 font-mono font-bold text-sm text-amber-400">
                {metrics?.formattedCost || "0.00 €"}
              </div>
              <div className="text-[10px] text-stone-400">
                {metrics?.model.includes("veo") ? "Veo video" : "Gemini API"}
              </div>
            </div>
          </div>

          {/* Details footer */}
          <div
            className={`pt-2 border-t text-[11px] flex flex-wrap items-center justify-between gap-2 ${
              errorDetails
                ? "border-amber-200 text-stone-700"
                : "border-stone-800 text-stone-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Kellaaeg: <strong>{metrics?.formattedTime || "—"}</strong>
              </span>
              {metrics?.durationMs !== undefined && (
                <span>
                  Kestus: <strong>{(metrics.durationMs / 1000).toFixed(1)}s</strong>
                </span>
              )}
            </div>
            {metrics?.pricingBasis && (
              <span className="text-[10px] opacity-80">
                ℹ️ {metrics.pricingBasis}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

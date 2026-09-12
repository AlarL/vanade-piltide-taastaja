import React, { useState, useEffect, useRef } from "react";
import { Sparkles, CheckCircle2, CircleDashed, X, Timer } from "lucide-react";
import { CompanyAdCard } from "./CompanyAdCard";

interface RestoringStateProps {
  originalImage: string;
  startTime?: number;
  onCancel: () => void;
}

const STEPS = [
  "Analüüsin fotot...",
  "Tuvastan näod ja detailid...",
  "Eemaldan kulumise ja vigastused...",
  "Taastan värvid...",
  "Valmistan pilti ette...",
];

export const RestoringState: React.FC<RestoringStateProps> = ({
  originalImage,
  startTime,
  onCancel,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const waitingSectionRef = useRef<HTMLDivElement>(null);

  // On mobile the page is long, so bring the "while you wait" recommendations into view
  useEffect(() => {
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = setTimeout(() => {
      waitingSectionRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 600);
    return () => clearTimeout(timeout);
  }, []);

  // Advance progressive steps to give feedback
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Live timer measuring elapsed time from upload start
  useEffect(() => {
    const initialTime = startTime || Date.now();
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const diffSec = (now - initialTime) / 1000;
      setElapsedSeconds(diffSec);
    }, 100);

    return () => clearInterval(timerInterval);
  }, [startTime]);

  const formatElapsed = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec % 1) * 10);
    const mins = Math.floor(s / 60);
    const remainingSecs = s % 60;
    if (mins > 0) {
      return `${mins}:${remainingSecs.toString().padStart(2, "0")}.${ms}s`;
    }
    return `${remainingSecs}.${ms}s`;
  };

  return (
    <div
      id="restoring-state-container"
      className="w-full max-w-xl mx-auto space-y-6 py-4 pb-24 sm:pb-4"
    >
      <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6 text-center">
        {/* Photo processing preview - Clean flat container without gradient */}
        <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs flex items-center justify-center">
          <img
            src={originalImage}
            alt="Töödeldav foto"
            className="w-full h-full object-cover filter blur-[1px] brightness-95 transition-all"
          />

          {/* Flat scanning line animation */}
          <div className="absolute inset-x-0 h-1 bg-teal-600 top-1/2 -translate-y-1/2 animate-pulse opacity-80" />

          {/* Center flat badge in deep Nordic teal */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-teal-800 text-white shadow-md flex items-center justify-center">
              <Sparkles
                className="w-6 h-6 text-teal-200 animate-spin"
                style={{ animationDuration: "6s" }}
              />
            </div>
          </div>
        </div>

        {/* Status text with live timer badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-mono text-xs font-semibold">
            <Timer className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
            <span>Kulunud aeg: {formatElapsed(elapsedSeconds)}</span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-stone-900">
              Foto taastamine...
            </h3>
            <p className="text-xs text-stone-500 font-normal mt-1">
              Palun oodake hetk
            </p>
          </div>
        </div>

        {/* Step progress list - Clean flat state */}
        <div className="space-y-2.5 max-w-sm mx-auto text-left pt-1">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step}
                className={`flex items-center gap-2.5 text-xs transition-colors py-0.5 ${
                  isDone
                    ? "text-teal-800 font-medium"
                    : isCurrent
                    ? "text-teal-950 font-semibold"
                    : "text-stone-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                ) : isCurrent ? (
                  <CircleDashed className="w-4 h-4 text-teal-700 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
                )}
                <span className="leading-snug">{step}</span>
              </div>
            );
          })}
        </div>

        {/* Cancel button - Flat styling (mobile uses the sticky bar below) */}
        <div className="pt-2 hidden sm:block">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
          >
            <X className="w-3.5 h-3.5" />
            <span>Katkesta</span>
          </button>
        </div>
      </div>

      {/* Recommendations to read while the photo is being restored */}
      <div ref={waitingSectionRef} className="scroll-mt-4 space-y-3">
        <div className="sm:hidden flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <CircleDashed className="w-4 h-4 text-teal-700 animate-spin shrink-0" />
          <span className="text-xs text-stone-600 leading-snug">
            Taastamine käib – kulunud aeg on all ribal. Vaata seniks soovitust.
          </span>
        </div>

        <CompanyAdCard variant="generating" />
      </div>

      {/* Sticky mobile status bar so the timer and cancel stay reachable while scrolling */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-xs px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-900 truncate">Foto taastamine...</p>
          <p className="text-[13px] font-mono text-teal-800">
            Kulunud aeg: {formatElapsed(elapsedSeconds)}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
        >
          <X className="w-4 h-4" />
          <span>Katkesta</span>
        </button>
      </div>
    </div>
  );
};

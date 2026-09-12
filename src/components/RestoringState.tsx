import React, { useState, useEffect } from "react";
import { Wand2, CheckCircle2, CircleDashed, X, Timer } from "lucide-react";

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
      className="w-full max-w-2xl mx-auto py-1"
    >
      <div className="bg-white border border-stone-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4">
          {/* Photo processing preview - Compact thumbnail */}
          <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs flex items-center justify-center">
            <img
              src={originalImage}
              alt="Töödeldav foto"
              className="w-full h-full object-cover filter blur-[1px] brightness-95"
            />

            {/* Flat scanning line animation */}
            <div className="absolute inset-x-0 h-1 bg-teal-600 top-1/2 -translate-y-1/2 animate-pulse opacity-80" />

            {/* Center flat badge in deep Nordic teal */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-teal-800 text-white shadow-md flex items-center justify-center">
                <Wand2
                  className="w-4 h-4 text-teal-200 animate-spin"
                  style={{ animationDuration: "6s" }}
                />
              </div>
            </div>
          </div>

          {/* Center details */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-stone-900 leading-tight">
                  Foto taastamine...
                </h3>
                <p className="text-xs text-stone-500 font-normal">Palun oodake hetk</p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-mono text-xs font-semibold">
                <Timer className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
                <span>Kulunud aeg: {formatElapsed(elapsedSeconds)}</span>
              </div>
            </div>

            {/* Current step active pill */}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs py-1 px-2.5 rounded-lg bg-stone-50 border border-stone-200/70 text-stone-800 font-medium">
              <CircleDashed className="w-3.5 h-3.5 text-teal-700 animate-spin shrink-0" />
              <span className="truncate">{STEPS[currentStepIndex]}</span>
              <span className="text-stone-400 text-[11px] ml-auto shrink-0 hidden sm:inline">
                Samm {currentStepIndex + 1}/{STEPS.length}
              </span>
            </div>

            {/* Step progress bar indicators */}
            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              {STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all ${
                      isDone
                        ? "bg-teal-700"
                        : isCurrent
                        ? "bg-teal-500 animate-pulse"
                        : "bg-stone-200"
                    }`}
                    title={step}
                  />
                );
              })}
            </div>
          </div>

          {/* Cancel button */}
          <div className="shrink-0 self-center hidden sm:block">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>Katkesta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky mobile status bar so the timer and cancel stay reachable while scrolling */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-xs px-4 py-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-900 truncate">Foto taastamine...</p>
          <p className="text-[12px] font-mono text-teal-800">
            Kulunud aeg: {formatElapsed(elapsedSeconds)}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200"
        >
          <X className="w-3.5 h-3.5" />
          <span>Katkesta</span>
        </button>
      </div>
    </div>
  );
};

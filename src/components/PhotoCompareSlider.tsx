import React, { useState, useRef, useCallback } from "react";
import {
  Download,
  RotateCcw,
  Sliders,
  Columns,
  Eye,
  Wand2,
  Check,
  Timer,
  Palette,
} from "lucide-react";
import { CompareMode, RestoredPhotoResult } from "../types";
import { VideoAnimator } from "./VideoAnimator";
import { DevMetricsCard } from "./DevMetricsCard";
import { CompanyAdCard } from "./CompanyAdCard";
import { DeveloperCoffeeCard } from "./DeveloperCoffeeCard";
import { getFilterById } from "../filters";
import { DOWNLOAD_OPTION_TEXT } from "../downloadOptions";
import {
  createSideBySideComparisonImage,
  downloadDataUrl,
} from "../utils/imageExport";

interface PhotoCompareSliderProps {
  result: RestoredPhotoResult;
  onReset: () => void;
}

export const PhotoCompareSlider: React.FC<PhotoCompareSliderProps> = ({
  result,
  onReset,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mode, setMode] = useState<CompareMode>("slider");
  const [isHoldPressed, setIsHoldPressed] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate position from mouse or touch event
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== "slider") return;
    setIsDragging(true);
    updatePosition(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || mode !== "slider") return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  // Keyboard navigation for precision slider adjustment
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  const getBaseName = () =>
    result.fileName
      ? result.fileName.replace(/\.[^/.]+$/, "")
      : "foto";

  const handleDownloadRestored = () => {
    const name = result.fileName
      ? `taastatud-${result.fileName.replace(/\.[^/.]+$/, "")}.png`
      : "taastatud-foto.png";

    downloadDataUrl(result.restoredImage, name);
    setIsDownloadMenuOpen(false);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleDownloadComparison = async () => {
    const comparisonImage = await createSideBySideComparisonImage(
      result.originalImage,
      result.restoredImage
    );
    downloadDataUrl(comparisonImage, `enne-ja-parast-${getBaseName()}.jpg`);
    setIsDownloadMenuOpen(false);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div
      id="photo-compare-workspace"
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      {/* Top Controls Bar */}
      <div className="relative z-20 flex flex-col gap-3 bg-white/80 backdrop-blur-xs border border-stone-200/80 rounded-xl p-3 sm:px-4 sm:py-3 shadow-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {/* Primary actions - first on mobile, right aligned on desktop */}
        <div className="order-1 flex items-stretch gap-2 sm:order-2">
          <div className="relative flex-1 sm:flex-none">
            <button
              id="download-btn"
              type="button"
              onClick={() => setIsDownloadMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isDownloadMenuOpen}
              aria-haspopup="menu"
              className="flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 rounded-lg transition-colors shadow-2xs"
              title="Vali allalaadimise variant"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-teal-200 shrink-0" />
                  <span>Alla laaditud!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Laadi alla</span>
                </>
              )}
            </button>

            {isDownloadMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDownloadRestored}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs text-stone-700 hover:bg-stone-50"
                >
                  <Download className="mt-0.5 w-4 h-4 shrink-0 text-teal-700" />
                  <span><strong className="block text-stone-900">{DOWNLOAD_OPTION_TEXT.restored.title}</strong>{DOWNLOAD_OPTION_TEXT.restored.description}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDownloadComparison}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs text-stone-700 hover:bg-stone-50"
                >
                  <Columns className="mt-0.5 w-4 h-4 shrink-0 text-teal-700" />
                  <span><strong className="block text-stone-900">{DOWNLOAD_OPTION_TEXT.comparison.title}</strong>{DOWNLOAD_OPTION_TEXT.comparison.description}</span>
                </button>
              </div>
            )}
          </div>

          {/* Reset / New photo button */}
          <button
            id="new-photo-btn"
            type="button"
            onClick={onReset}
            className="flex shrink-0 items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
          >
            <RotateCcw className="w-4 h-4 text-stone-500 shrink-0" />
            <span>Uus foto</span>
          </button>
        </div>

        {/* Comparison mode tabs */}
        <div className="order-2 grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 sm:order-1 sm:flex sm:items-center">
          <button
            id="mode-slider-btn"
            type="button"
            onClick={() => setMode("slider")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-md transition-all sm:px-3 sm:py-1.5 ${
              mode === "slider"
                ? "bg-white text-teal-950 font-semibold shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Slaider</span>
          </button>
          <button
            id="mode-side-btn"
            type="button"
            onClick={() => setMode("side-by-side")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-md transition-all sm:px-3 sm:py-1.5 ${
              mode === "side-by-side"
                ? "bg-white text-teal-950 font-semibold shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Kõrvuti</span>
          </button>
          <button
            id="mode-hold-btn"
            type="button"
            onClick={() => setMode("diff-toggle")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-md transition-all sm:px-3 sm:py-1.5 ${
              mode === "diff-toggle"
                ? "bg-white text-teal-950 font-semibold shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="sm:hidden">Originaal</span>
            <span className="hidden sm:inline">Hoia all: näita originaali</span>
          </button>
        </div>

        {/* Meta badges: elapsed time, filter, user note */}
        <div className="order-3 flex flex-wrap items-center gap-2 sm:w-full">
          <div
            id="result-elapsed-time"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-mono font-semibold"
          >
            <Timer className="w-3.5 h-3.5 text-teal-700" />
            <span>
              Kulunud aeg:{" "}
              {result.durationMs && result.durationMs > 0
                ? `${(result.durationMs / 1000).toFixed(1)}s`
                : "valmis"}
            </span>
          </div>

          {result.appliedFilter && (
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium">
              {getFilterById(result.appliedFilter).label}
            </span>
          )}

          {result.userNote && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-900 text-xs font-medium"
              title={`Kasutaja märge: ${result.userNote}`}
            >
              <Palette className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[240px]">„{result.userNote}“</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Comparison Canvas */}
      <div className="relative bg-white border border-stone-200/90 rounded-2xl p-3 md:p-6 shadow-xs overflow-hidden">
        {mode === "slider" && (
          <div className="flex flex-col items-center">
            {/* Interactive Image Container */}
            <div
              id="slider-container"
              ref={containerRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative select-none touch-none overflow-hidden rounded-xl border border-stone-200/70 bg-stone-100 cursor-ew-resize max-h-[72vh] w-full flex items-center justify-center"
              style={{
                aspectRatio: result.originalAspectRatio === "3:4" ? "3/4" : result.originalAspectRatio === "4:3" ? "4/3" : result.originalAspectRatio === "16:9" ? "16/9" : "1/1",
                maxWidth: "780px",
              }}
            >
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                {/* Layer 1: Restored / New Photo (Base Full View) */}
                <img
                  id="restored-image"
                  src={result.restoredImage}
                  alt="Taastatud ja värviline foto"
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Layer 2: Original Photo (Clipped on Left side) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    width: `${sliderPos}%`,
                    borderRight: "2px solid rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 0 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <img
                    id="original-image"
                    src={result.originalImage}
                    alt="Algne vana foto"
                    className="absolute inset-0 w-full h-full object-contain max-w-none"
                    style={{
                      width: containerRef.current?.clientWidth
                        ? `${containerRef.current.clientWidth}px`
                        : "100%",
                      height: "100%",
                    }}
                    draggable={false}
                  />
                </div>

                {/* Vertical Divider & Draggable Handle */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  {/* Subtle dividing line */}
                  <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-white shadow-sm" />

                  {/* Tactile Nordic Handle Knob */}
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-stone-200 flex items-center justify-center text-stone-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <polyline points="15 18 9 12 15 6" />
                      <polyline points="9 18 3 12 9 6" />
                    </svg>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 -ml-2.5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                      <polyline points="15 18 21 12 15 6" />
                    </svg>
                  </div>
                </div>

                {/* Floating Corner Badges */}
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className="px-2.5 py-1 text-[13px] font-medium tracking-wide uppercase bg-stone-900/70 text-white rounded-md backdrop-blur-xs shadow-xs">
                    Enne
                  </span>
                </div>
                <div className="absolute top-3 right-3 pointer-events-none">
                  <span className="px-2.5 py-1 text-[13px] font-medium tracking-wide uppercase bg-emerald-950/80 text-emerald-100 rounded-md backdrop-blur-xs shadow-xs">
                    Pärast
                  </span>
                </div>
              </div>
            </div>

            {/* Slider Guidance Bar */}
            <div className="w-full max-w-md mt-4 text-center text-xs text-stone-500 px-2">
              <span>Lohista slaiderit vasakule või paremale</span>
            </div>
          </div>
        )}

        {/* Side-by-side mode */}
        {mode === "side-by-side" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Algne foto
                </span>
                <span className="text-[13px] text-stone-400">Mustvalge / kahjustatud</span>
              </div>
              <div className="w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center p-1">
                <img
                  src={result.originalImage}
                  alt="Algne foto"
                  className="w-full h-auto max-h-[65vh] object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-teal-600" />
                  Taastatud & Värvitud
                </span>
                <span className="text-[13px] text-teal-700 font-medium">
                  Kõrge kvaliteet • Värviline
                </span>
              </div>
              <div className="w-full rounded-xl overflow-hidden border border-teal-200/80 bg-stone-100 flex items-center justify-center p-1 shadow-xs">
                <img
                  src={result.restoredImage}
                  alt="Taastatud foto"
                  className="w-full h-auto max-h-[65vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Hold-to-compare mode */}
        {mode === "diff-toggle" && (
          <div className="flex flex-col items-center space-y-4">
            <div
              className="relative select-none overflow-hidden rounded-xl border border-stone-200 bg-stone-100 max-h-[72vh] w-full flex items-center justify-center cursor-pointer"
              style={{
                aspectRatio: result.originalAspectRatio === "3:4" ? "3/4" : result.originalAspectRatio === "4:3" ? "4/3" : result.originalAspectRatio === "16:9" ? "16/9" : "1/1",
                maxWidth: "780px",
              }}
              onMouseDown={() => setIsHoldPressed(true)}
              onMouseUp={() => setIsHoldPressed(false)}
              onMouseLeave={() => setIsHoldPressed(false)}
              onTouchStart={() => setIsHoldPressed(true)}
              onTouchEnd={() => setIsHoldPressed(false)}
            >
              <img
                src={isHoldPressed ? result.originalImage : result.restoredImage}
                alt="Võrdlus"
                className="w-full h-full object-contain"
              />

              <div className="absolute top-4 left-4 pointer-events-none">
                <span
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg backdrop-blur-xs shadow-xs transition-all ${
                    isHoldPressed
                      ? "bg-stone-900/85 text-white"
                      : "bg-teal-950/85 text-teal-200"
                  }`}
                >
                  {isHoldPressed ? "ORIGINAAL (ENNE)" : "TAASTATUD (PÄRAST)"}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-500">
              Vajuta ja hoia pildil, et näha originaalfotot.
            </p>
          </div>
        )}
      </div>

      {/* Resource & Energy Metrics Breakdown for Photo Restoration */}
      {result.devMetrics && (
        <DevMetricsCard
          metrics={result.devMetrics}
          errorDetails={result.errorDetails}
          title="Foto taastamise ressursi- & energiaraport"
          compact={true}
        />
      )}

      {/* Video Generation Module: Turn this restored photo into lifelike video */}
      <VideoAnimator
        restoredImageUrl={result.restoredImage}
        originalImageUrl={result.originalImage}
        originalFileName={result.fileName}
        originalAspectRatio={result.originalAspectRatio}
      />

      {/* Developer Coffee Appreciation Card */}
      <DeveloperCoffeeCard />

      {/* Prominent Advertisement staying visible after restoration */}
      <CompanyAdCard variant="result" />
    </div>
  );
};


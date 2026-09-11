import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Download,
  RotateCcw,
  Sliders,
  Columns,
  Eye,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ShieldCheck,
  Check,
  Timer,
  Layers,
  ChevronDown,
  Loader2,
  Palette,
} from "lucide-react";
import { CompareMode, RestoredPhotoResult } from "../types";
import { VideoAnimator } from "./VideoAnimator";
import { DevMetricsCard } from "./DevMetricsCard";
import { CompanyAdCard } from "./CompanyAdCard";
import { DeveloperCoffeeCard } from "./DeveloperCoffeeCard";
import { getFilterById } from "../filters";
import { createSideBySideComparisonImage, downloadDataUrl } from "../utils/imageExport";

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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [isExportingSideBySide, setIsExportingSideBySide] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close download menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Download high-resolution restored image
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = result.restoredImage;
    const name = result.fileName
      ? `taastatud-${result.fileName.replace(/\.[^/.]+$/, "")}.png`
      : "taastatud-foto.png";
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setShowDownloadMenu(false);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Download Side-by-Side comparison composite image
  const handleDownloadSideBySide = async () => {
    try {
      setIsExportingSideBySide(true);
      const compositeUrl = await createSideBySideComparisonImage(
        result.originalImage,
        result.restoredImage
      );
      const baseName = result.fileName
        ? result.fileName.replace(/\.[^/.]+$/, "")
        : "foto";
      downloadDataUrl(compositeUrl, `enne-ja-parast-${baseName}.jpg`);
      setDownloadSuccess(true);
      setShowDownloadMenu(false);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to generate side-by-side export:", err);
    } finally {
      setIsExportingSideBySide(false);
    }
  };

  return (
    <div
      id="photo-compare-workspace"
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 backdrop-blur-xs border border-stone-200/80 rounded-xl px-4 py-3 shadow-xs">
        {/* Comparison mode tabs & timer */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button
              id="mode-slider-btn"
              type="button"
              onClick={() => setMode("slider")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === "slider"
                  ? "bg-white text-teal-950 font-semibold shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-teal-700" />
              <span>Slaider</span>
            </button>
            <button
              id="mode-side-btn"
              type="button"
              onClick={() => setMode("side-by-side")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === "side-by-side"
                  ? "bg-white text-teal-950 font-semibold shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-teal-700" />
              <span>Kõrvuti</span>
            </button>
            <button
              id="mode-hold-btn"
              type="button"
              onClick={() => setMode("diff-toggle")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === "diff-toggle"
                  ? "bg-white text-teal-950 font-semibold shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              <span>Hoia võrdluseks</span>
            </button>
          </div>

          {/* Kulunud aeg badge - always visible when result is ready */}
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

        {/* View & Action tools */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-stone-200 rounded-lg px-1.5 py-1 text-xs text-stone-600">
            <button
              id="zoom-out-btn"
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              disabled={zoomLevel <= 1}
              className="p-1.5 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-100"
              title="Vähenda"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              id="zoom-reset-btn"
              type="button"
              onClick={() => setZoomLevel(1)}
              disabled={zoomLevel === 1}
              className="w-10 text-center font-mono text-[13px] py-1 rounded hover:bg-stone-100 disabled:hover:bg-transparent"
              title="Taasta algne suurus"
            >
              {zoomLevel}x
            </button>
            <button
              id="zoom-in-btn"
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.5))}
              disabled={zoomLevel >= 2.5}
              className="p-1.5 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-100"
              title="Suurenda näodetailide vaatamiseks"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset / New photo button */}
          <button
            id="new-photo-btn"
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Uus foto</span>
          </button>

          {/* Download button - Clean split dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            <div className="inline-flex rounded-lg shadow-2xs">
              <button
                id="download-btn"
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 rounded-l-lg transition-colors"
                title="Laadi alla taastatud foto"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-200" />
                    <span>Salvestatud!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Laadi alla (HD)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDownloadMenu((prev) => !prev)}
                className="px-2 py-2 text-xs text-teal-100 bg-teal-800 hover:bg-teal-900 border-l border-teal-700/60 rounded-r-lg transition-colors"
                title="Rohkem allalaadimise valikuid"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dropdown menu */}
            {showDownloadMenu && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white border border-stone-200 shadow-lg py-1.5 z-40">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-teal-700 shrink-0" />
                  <div>
                    <p className="font-semibold text-stone-900">Taastatud foto (PNG)</p>
                    <p className="text-[13px] text-stone-500">Täisresolutsioonis terav foto</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSideBySide}
                  disabled={isExportingSideBySide}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors border-t border-stone-100 disabled:opacity-50"
                >
                  {isExportingSideBySide ? (
                    <Loader2 className="w-4 h-4 text-teal-700 shrink-0 animate-spin" />
                  ) : (
                    <Layers className="w-4 h-4 text-teal-700 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-stone-900">Enne ja Pärast võrdluspilt</p>
                    <p className="text-[13px] text-stone-500">Kõrvuti originaal ja uus foto</p>
                  </div>
                </button>
              </div>
            )}
          </div>
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
              <div
                className="relative w-full h-full overflow-hidden flex items-center justify-center transition-transform duration-150"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                }}
              >
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
                    Enne (Originaal)
                  </span>
                </div>
                <div className="absolute top-3 right-3 pointer-events-none">
                  <span className="px-2.5 py-1 text-[13px] font-medium tracking-wide uppercase bg-emerald-950/80 text-emerald-100 rounded-md backdrop-blur-xs shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    Pärast (Taastatud)
                  </span>
                </div>
              </div>
            </div>

            {/* Slider Guidance Bar */}
            <div className="w-full max-w-md mt-4 flex items-center justify-between text-xs text-stone-500 px-2">
              <span>Lohista slaiderit vasakule või paremale</span>
              <span className="font-mono text-stone-700 font-medium">
                {Math.round(sliderPos)}%
              </span>
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
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
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
              Vajuta ja hoia pildil all, et näha algset mustvalget versiooni.
            </p>
          </div>
        )}
      </div>

      {/* Developer Coffee Appreciation Card */}
      <DeveloperCoffeeCard />

      {/* Resource & Energy Metrics Breakdown for Photo Restoration */}
      {result.devMetrics && (
        <DevMetricsCard
          metrics={result.devMetrics}
          errorDetails={result.errorDetails}
          title="Foto taastamise ressursi- & energiaraport"
          compact={true}
        />
      )}

      {/* Prominent Advertisement staying visible after restoration */}
      <CompanyAdCard variant="result" />

      {/* Video Generation Module: Turn this restored photo into lifelike video */}
      <VideoAnimator
        restoredImageUrl={result.restoredImage}
        originalImageUrl={result.originalImage}
        originalFileName={result.fileName}
        originalAspectRatio={result.originalAspectRatio}
      />
    </div>
  );
};


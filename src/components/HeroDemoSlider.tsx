import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { DEFAULT_DEMO_PHOTO } from "../data/demoPhotos";

interface HeroDemoSliderProps {
  beforeImage?: string;
  afterImage?: string;
  title?: string;
}

export const HeroDemoSlider: React.FC<HeroDemoSliderProps> = ({
  beforeImage = DEFAULT_DEMO_PHOTO.beforeImage,
  afterImage = DEFAULT_DEMO_PHOTO.afterImage,
  title = DEFAULT_DEMO_PHOTO.title,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const fallbackBefore = "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop&sat=-100&con=30";
  const fallbackAfter = "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop";

  const [currentBefore, setCurrentBefore] = useState(beforeImage);
  const [currentAfter, setCurrentAfter] = useState(afterImage);

  // Keep in sync if props change
  useEffect(() => {
    setCurrentBefore(beforeImage);
  }, [beforeImage]);

  useEffect(() => {
    setCurrentAfter(afterImage);
  }, [afterImage]);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const clampedPercent = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(clampedPercent);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    handleMove(clientX);
  };

  const handleStop = () => {
    setIsDragging(false);
  };

  return (
    <div id="hero-demo-section" className="w-full max-w-2xl mx-auto space-y-2 mb-6">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
          <span>{title}</span>
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1"
        >
          {isOpen ? (
            <>
              <EyeOff className="w-3 h-3" />
              <span>Peida näidis</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              <span>Vaata näidist</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          ref={containerRef}
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseUp={handleStop}
          onMouseLeave={handleStop}
          onMouseMove={handleMouseMove}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchEnd={handleStop}
          onTouchMove={handleTouchMove}
          className="relative w-full aspect-16/10 sm:aspect-16/9 rounded-2xl overflow-hidden shadow-xs border border-stone-200 select-none cursor-ew-resize bg-stone-100"
          style={{ touchAction: "none" }}
        >
          {/* AFTER (restored) image underneath */}
          <img
            src={currentAfter}
            alt="Taastatud foto näidis"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            loading="lazy"
            onError={() => {
              if (currentAfter !== fallbackAfter) {
                setCurrentAfter(fallbackAfter);
              }
            }}
          />

          {/* BEFORE (original black & white) clipped on top */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={currentBefore}
              alt="Originaalfoto näidis enne taastamist"
              className="absolute top-0 left-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current
                  ? `${containerRef.current.offsetWidth}px`
                  : "100%",
                height: "100%",
              }}
              loading="lazy"
              onError={() => {
                if (currentBefore !== fallbackBefore) {
                  setCurrentBefore(fallbackBefore);
                }
              }}
            />
          </div>

          {/* Slider divider line - NO percentage numbers */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Grabber thumb */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-stone-700 shadow-md border border-stone-200/80 flex items-center justify-center">
              <ChevronLeft className="w-3 h-3 -mr-1 stroke-[2.5]" />
              <ChevronRight className="w-3 h-3 -ml-1 stroke-[2.5]" />
            </div>
          </div>

          {/* Simple Enne / Pärast badges without any percentage text */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-stone-900/75 text-white backdrop-blur-xs">
              Enne
            </span>
          </div>
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-teal-950/75 text-teal-100 backdrop-blur-xs">
              Pärast
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

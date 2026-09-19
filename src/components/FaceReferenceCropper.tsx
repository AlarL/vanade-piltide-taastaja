import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Crosshair, Minus, Plus, X } from "lucide-react";
import {
  cropSquareToDataUrl,
  loadImage,
  REFERENCE_OUTPUT_SIZE,
  SquareCrop,
} from "../utils/faceReference";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const KEYBOARD_STEP = 16;

interface FaceReferenceCropperProps {
  /** Downscaled working copy of the picked photo. */
  imageSrc: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const averagePoint = (points: Point[]): Point => ({
  x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
  y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
});

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Square crop view with drag-to-pan and pinch-to-zoom, so the user can keep just the
 * face before the reference photo is sent. The image is transformed for preview only;
 * the actual pixels are cut once, on confirm.
 */
export const FaceReferenceCropper: React.FC<FaceReferenceCropperProps> = ({
  imageSrc,
  onConfirm,
  onCancel,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [viewSize, setViewSize] = useState(0);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);

  // The gesture math must read the freshest values; React state lags one render behind.
  const imageRef = useRef<HTMLImageElement | null>(null);
  const viewSizeRef = useRef(0);
  const zoomRef = useRef(MIN_ZOOM);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<{ zoom: number; offset: Point; center: Point; spread: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    loadImage(imageSrc)
      .then((img) => {
        if (cancelled) return;
        imageRef.current = img;
        setImage(img);
        zoomRef.current = MIN_ZOOM;
        offsetRef.current = { x: 0, y: 0 };
        setZoom(MIN_ZOOM);
        setOffset({ x: 0, y: 0 });
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  // On a phone the crop view opens far below the fold, right after the camera closes
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, []);

  // The viewport is fluid (it shrinks on narrow phones), so every crop calculation
  // starts from its measured size rather than a hardcoded one.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const measure = () => {
      const size = node.getBoundingClientRect().width;
      viewSizeRef.current = size;
      setViewSize(size);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /** Image size on screen at the current zoom, and how far it may be panned. */
  const getMetrics = useCallback((nextZoom: number) => {
    const img = imageRef.current;
    const size = viewSizeRef.current;
    if (!img || size <= 0) return null;

    const baseScale = size / Math.min(img.naturalWidth, img.naturalHeight);
    const scale = baseScale * nextZoom;
    const displayWidth = img.naturalWidth * scale;
    const displayHeight = img.naturalHeight * scale;
    return {
      scale,
      displayWidth,
      displayHeight,
      maxOffsetX: Math.max(0, (displayWidth - size) / 2),
      maxOffsetY: Math.max(0, (displayHeight - size) / 2),
    };
  }, []);

  /** Keeps the square fully covered by image - no empty corners can be cropped. */
  const clampOffset = useCallback(
    (next: Point, nextZoom: number): Point => {
      const metrics = getMetrics(nextZoom);
      if (!metrics) return { x: 0, y: 0 };
      return {
        x: clamp(next.x, -metrics.maxOffsetX, metrics.maxOffsetX),
        y: clamp(next.y, -metrics.maxOffsetY, metrics.maxOffsetY),
      };
    },
    [getMetrics]
  );

  const apply = useCallback(
    (nextZoom: number, nextOffset: Point) => {
      const boundedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const boundedOffset = clampOffset(nextOffset, boundedZoom);
      zoomRef.current = boundedZoom;
      offsetRef.current = boundedOffset;
      setZoom(boundedZoom);
      setOffset(boundedOffset);
    },
    [clampOffset]
  );

  /** Re-baselines the gesture whenever a finger is added or lifted. */
  const beginGesture = useCallback(() => {
    const points = [...pointersRef.current.values()];
    if (points.length === 0) {
      gestureRef.current = null;
      return;
    }
    gestureRef.current = {
      zoom: zoomRef.current,
      offset: offsetRef.current,
      center: averagePoint(points),
      spread: points.length >= 2 ? distance(points[0], points[1]) : 0,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    beginGesture();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || !pointersRef.current.has(e.pointerId)) return;

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const points = [...pointersRef.current.values()];
    const center = averagePoint(points);

    let nextZoom = gesture.zoom;
    if (points.length >= 2 && gesture.spread > 0) {
      nextZoom = clamp(gesture.zoom * (distance(points[0], points[1]) / gesture.spread), MIN_ZOOM, MAX_ZOOM);
    }

    // Zoom grows around the crop square's centre, then the whole image follows the finger.
    const zoomFactor = nextZoom / gesture.zoom;
    apply(nextZoom, {
      x: gesture.offset.x * zoomFactor + (center.x - gesture.center.x),
      y: gesture.offset.y * zoomFactor + (center.y - gesture.center.y),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    beginGesture();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, Point> = {
      ArrowLeft: { x: KEYBOARD_STEP, y: 0 },
      ArrowRight: { x: -KEYBOARD_STEP, y: 0 },
      ArrowUp: { x: 0, y: KEYBOARD_STEP },
      ArrowDown: { x: 0, y: -KEYBOARD_STEP },
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    apply(zoomRef.current, {
      x: offsetRef.current.x + move.x,
      y: offsetRef.current.y + move.y,
    });
  };

  const handleZoomInput = (value: number) => apply(value, offsetRef.current);

  const handleReset = () => apply(MIN_ZOOM, { x: 0, y: 0 });

  const handleConfirm = () => {
    const img = imageRef.current;
    const metrics = getMetrics(zoomRef.current);
    const size = viewSizeRef.current;
    if (!img || !metrics || size <= 0) return;

    // Translate the on-screen square back into source pixels.
    const cropSize = size / metrics.scale;
    const sourceCenterX = img.naturalWidth / 2 - offsetRef.current.x / metrics.scale;
    const sourceCenterY = img.naturalHeight / 2 - offsetRef.current.y / metrics.scale;
    const crop: SquareCrop = {
      x: clamp(sourceCenterX - cropSize / 2, 0, Math.max(0, img.naturalWidth - cropSize)),
      y: clamp(sourceCenterY - cropSize / 2, 0, Math.max(0, img.naturalHeight - cropSize)),
      size: cropSize,
    };

    try {
      onConfirm(cropSquareToDataUrl(img, crop, REFERENCE_OUTPUT_SIZE));
    } catch (err: any) {
      setLoadError(err?.message || "Foto töötlemine ebaõnnestus.");
    }
  };

  const metrics = getMetrics(zoom);
  const isReady = Boolean(image) && viewSize > 0 && Boolean(metrics);

  return (
    <div className="face-crop space-y-3">
      <div
        ref={viewportRef}
        role="group"
        aria-label="Kohanda näo kärbet: lohista pilti ja muuda suurendust"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="face-crop-viewport"
      >
        {image && metrics && (
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="face-crop-image"
            style={{
              width: `${metrics.displayWidth}px`,
              height: `${metrics.displayHeight}px`,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
            }}
          />
        )}
        <div className="face-crop-guide" aria-hidden="true" />
        {!image && !loadError && <p className="face-crop-status">Foto avaneb…</p>}
      </div>

      <p className="face-crop-hint">
        Lohista pilti ja suurenda, kuni raamis on ainult nägu. Puutetundlikul ekraanil töötab ka näpistus.
      </p>

      <div className="face-crop-zoom">
        <button
          type="button"
          onClick={() => handleZoomInput(zoom - 0.25)}
          disabled={!isReady || zoom <= MIN_ZOOM}
          className="face-crop-zoom-btn"
          aria-label="Vähenda suurendust"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={!isReady}
          onChange={(e) => handleZoomInput(Number(e.target.value))}
          aria-label="Suurendus"
        />
        <button
          type="button"
          onClick={() => handleZoomInput(zoom + 0.25)}
          disabled={!isReady || zoom >= MAX_ZOOM}
          className="face-crop-zoom-btn"
          aria-label="Suurenda"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {loadError && (
        <p role="alert" className="album-error">
          {loadError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={handleReset}
          disabled={!isReady}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
        >
          <Crosshair className="w-4 h-4" />
          <span>Keskele</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Tühista</span>
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isReady}
            className="btn-forest inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            <span>Kinnita nägu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

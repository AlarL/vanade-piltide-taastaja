import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { HeroDemoSlider } from "./components/HeroDemoSlider";
import { PhotoUploader } from "./components/PhotoUploader";
import { RestoringState } from "./components/RestoringState";
import { PhotoCompareSlider } from "./components/PhotoCompareSlider";
import { AlternativeServicesBanner } from "./components/AlternativeServicesBanner";
import { LegalFooter } from "./components/LegalFooter";
import { RestoredPhotoResult, RestorationFilterId, ApiErrorDetails, FaceReferencePhoto } from "./types";
import { AlertCircle, RefreshCw, KeyRound, ShieldAlert } from "lucide-react";
import { DevMetricsCard } from "./components/DevMetricsCard";

interface QuotaStatus {
  photosRemaining: number;
  photosMax: number;
  videosRemaining: number;
  videosMax: number;
  photoResetHours: number;
  videoResetHours: number;
}

const REQUEST_TIMEOUT_MS = 4 * 60 * 1000;

// Kept in module scope so a browser with blocked storage still reports one stable id per tab
let fallbackClientId: string | null = null;

function getOrCreateClientId(): string {
  try {
    let id = localStorage.getItem("vf_client_id");
    if (!id) {
      id = "client_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("vf_client_id", id);
    }
    return id;
  } catch {
    if (!fallbackClientId) {
      fallbackClientId = "client_fallback_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    }
    return fallbackClientId;
  }
}

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    type: string;
    aspectRatio: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [result, setResult] = useState<RestoredPhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiErrorDetails, setApiErrorDetails] = useState<ApiErrorDetails | null>(null);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);
  const [isRateLimitError, setIsRateLimitError] = useState<boolean>(false);

  const [activeUserNote, setActiveUserNote] = useState<string | undefined>(undefined);
  const [activeFilterId, setActiveFilterId] = useState<RestorationFilterId>("modern_hd");
  // Kept so "Proovi uuesti" resends the same identity reference photo
  const [activeFaceReference, setActiveFaceReference] = useState<FaceReferencePhoto | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // On narrow screens the demo slider belongs under the intro text, not in a side column
  const [isNarrowLayout, setIsNarrowLayout] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 800px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 800px)");
    const onChange = (e: MediaQueryListEvent) => setIsNarrowLayout(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const fetchQuota = useCallback(async () => {
    try {
      const clientId = getOrCreateClientId();
      const res = await fetch("/api/rate-limit-status", {
        headers: { "x-client-id": clientId },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch (e) {
      console.warn("Could not fetch rate limit status:", e);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Bring the finished photo (or an error) into view - on mobile the page is long
  useEffect(() => {
    if (!result && !error) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [result, error]);

  const handleImageSelected = async (
    base64: string,
    info?: { name: string; type: string; aspectRatio: string },
    filterId?: RestorationFilterId,
    userNote?: string,
    faceReference?: FaceReferencePhoto | null
  ) => {
    setOriginalImage(base64);
    const chosenInfo = info || {
      name: "foto.jpg",
      type: "image/jpeg",
      aspectRatio: "1:1",
    };
    setFileInfo(chosenInfo);
    setActiveFilterId(filterId || "modern_hd");
    setActiveUserNote(userNote);
    setActiveFaceReference(faceReference || null);
    setError(null);
    setApiErrorDetails(null);
    setIsQuotaError(false);
    setIsRateLimitError(false);
    setIsLoading(true);

    const startTimestamp = Date.now();
    setStartTime(startTimestamp);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    // Without a ceiling a stalled mobile connection leaves isLoading true forever and the
    // upload screen never comes back.
    const timeoutId = window.setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

    try {
      const clientId = getOrCreateClientId();
      const response = await fetch("/api/restore-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        cache: "no-store",
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: chosenInfo.type,
          aspectRatio: chosenInfo.aspectRatio,
          filterId: filterId || "modern_hd",
          userNote: userNote?.trim() || undefined,
          // Optional present-day photo of the same person, already cropped and
          // downscaled in the browser so it stays a cheap single image input
          referenceImageBase64: faceReference?.base64 || undefined,
          referenceMimeType: faceReference?.mimeType || undefined,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.restoredImage) {
        if (data.isRateLimit || response.status === 429) {
          if (data.isRateLimit || data.errorCode === "DAILY_LIMIT_EXCEEDED") {
            setIsRateLimitError(true);
          } else {
            setIsQuotaError(true);
          }
        }
        if (data.errorDetails) {
          setApiErrorDetails(data.errorDetails);
        }
        throw new Error(data.error || "Pildi taastamine ebaõnnestus.");
      }

      const elapsedMs = Date.now() - startTimestamp;

      setResult({
        originalImage: base64,
        restoredImage: data.restoredImage,
        fileName: chosenInfo.name,
        originalAspectRatio: chosenInfo.aspectRatio,
        notes: data.notes,
        userNote: data.userNote || userNote,
        timestamp: Date.now(),
        durationMs: elapsedMs,
        appliedFilter: data.appliedFilter || filterId || "modern_hd",
        devMetrics: data.devMetrics,
        errorDetails: data.errorDetails,
      });

      // Update quota status
      fetchQuota();
    } catch (err: any) {
      if (err.name === "AbortError") {
        // A superseded request - the newer one owns the UI state now
        if (abortControllerRef.current !== abortController) return;
        setError(
          "Päring võttis liiga kaua aega ja katkestati. Palun proovi uuesti – võimalusel nõrgema võrgu korral väiksema fotoga."
        );
        return;
      }
      console.error("Error during restoration:", err);

      const isQuota =
        err.message?.includes("Quota exceeded") ||
        err.message?.includes("RESOURCE_EXHAUSTED") ||
        err.message?.includes("limit: 0");

      if (isQuota) {
        setIsQuotaError(true);
      }

      setError(
        err.message ||
          "Foto taastamisel tekkis tõrge. Palun veenduge, et foto on selge ning proovige uuesti."
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStartTime(null);
    setOriginalImage(null);
    setResult(null);
    setError(null);
    setApiErrorDetails(null);
    setIsQuotaError(false);
    setIsRateLimitError(false);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResult(null);
    setError(null);
    setApiErrorDetails(null);
    setIsQuotaError(false);
    setIsRateLimitError(false);
    setIsLoading(false);
    setStartTime(null);
    setActiveUserNote(undefined);
    setActiveFaceReference(null);
    fetchQuota();
  };

  const handleRetry = () => {
    if (originalImage && fileInfo) {
      handleImageSelected(originalImage, fileInfo, activeFilterId, activeUserNote, activeFaceReference);
    }
  };

  return (
    <div className="album-app min-h-screen bg-[#f7f4ee] text-stone-900 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Flat Nordic Header */}
      <Header onHome={handleReset} />

      {/* 2. Main Content Area */}
      <main className="album-main flex-1 w-full mx-auto px-5 sm:px-8">
        {/* Error notification banner */}
        {error && (
          <div
            id="error-banner"
            role="alert"
            className="max-w-2xl mx-auto mb-6 w-full p-5 rounded-2xl bg-white border border-stone-200 text-stone-800 text-xs space-y-3 shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                {isRateLimitError ? (
                  <ShieldAlert className="w-4 h-4 text-amber-800" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-800" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="font-semibold text-stone-900 text-sm">
                  {isRateLimitError
                    ? "Päevane kasutuslimiit on saavutatud"
                    : isQuotaError
                    ? "Teenus pole praegu saadaval"
                    : "Päringut ei saanud lõpule viia"}
                </p>
                <p className="leading-relaxed text-stone-700">{isQuotaError ? "Foto töötlemine on ajutiselt peatatud." : error}</p>

                {isQuotaError && <p className="text-sm text-stone-600">Teenuse kasutusmaht on ajutiselt täis. Palun proovi hiljem uuesti.</p>}

                {/* Diagnostics and pricing breakdown */}
                {apiErrorDetails && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">Tehnilised üksikasjad</summary>
                    <DevMetricsCard
                      errorDetails={apiErrorDetails}
                      title="Tehniline diagnostika ja veateade"
                    />
                  </details>
                )}

                <div className="pt-2 flex items-center gap-3">
                  {!isRateLimitError && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-medium transition-colors text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Proovi uuesti</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-stone-600 hover:text-stone-900 text-xs underline underline-offset-2"
                  >
                    Vali teine foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 1: Upload state (with Hero Demo Slider directly in header area) */}
        {!isLoading && !result && (
          <div className="album-workspace">
            {/* Interactive example photo slider in header area without percentage display */}
            {!isNarrowLayout && <HeroDemoSlider />}

            {/* Photo upload and customization flow */}
            <PhotoUploader
              onImageSelected={handleImageSelected}
              isLoading={isLoading}
              inlineDemo={isNarrowLayout ? <HeroDemoSlider /> : null}
              quota={quota}
            />
          </div>
        )}

        {/* View 2: Restoring & Colorizing state with live timer */}
        {isLoading && originalImage && (
          <RestoringState
            originalImage={originalImage}
            startTime={startTime || undefined}
            onCancel={handleCancel}
          />
        )}

        {/* View 3: Result comparison state (Interactive Slider with duration) */}
        {!isLoading && result && (
          <PhotoCompareSlider result={result} onReset={handleReset} />
        )}
      </main>

      {/* 4. Cross-promotional bottom banner (Alternative AI restoration & Estonian Kahoot alternative) */}
      <AlternativeServicesBanner />

      {/* 5. Legal & GDPR Footer with "Olemegi meie" and full disclaimers */}
      <LegalFooter />
    </div>
  );
}


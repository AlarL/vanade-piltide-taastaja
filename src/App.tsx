import { useState, useRef } from "react";
import { Header } from "./components/Header";
import { PhotoUploader } from "./components/PhotoUploader";
import { RestoringState } from "./components/RestoringState";
import { PhotoCompareSlider } from "./components/PhotoCompareSlider";
import { PromptEditorModal } from "./components/PromptEditorModal";
import { DEFAULT_RESTORATION_PROMPT } from "./restorationPrompt";
import { RestoredPhotoResult, RestorationFilterId, ApiErrorDetails } from "./types";
import { AlertCircle, RefreshCw, KeyRound, ExternalLink } from "lucide-react";
import { DevMetricsCard } from "./components/DevMetricsCard";

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

  const [activeUserNote, setActiveUserNote] = useState<string | undefined>(undefined);
  const [activeFilterId, setActiveFilterId] = useState<RestorationFilterId>("modern_hd");

  // System Prompt customization state for live testing
  const [customPrompt, setCustomPrompt] = useState<string>(
    DEFAULT_RESTORATION_PROMPT
  );
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const isPromptCustomized =
    customPrompt.trim() !== DEFAULT_RESTORATION_PROMPT.trim();

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleImageSelected = async (
    base64: string,
    info?: { name: string; type: string; aspectRatio: string },
    filterId?: RestorationFilterId,
    userNote?: string
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
    setError(null);
    setApiErrorDetails(null);
    setIsQuotaError(false);
    setIsLoading(true);

    const startTimestamp = Date.now();
    setStartTime(startTimestamp);

    // Prepare abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/restore-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: chosenInfo.type,
          aspectRatio: chosenInfo.aspectRatio,
          customPrompt: isPromptCustomized ? customPrompt : undefined,
          filterId: filterId || "modern_hd",
          userNote: userNote?.trim() || undefined,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.restoredImage) {
        if (response.status === 429 || data.isQuotaError) {
          setIsQuotaError(true);
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
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Restoration cancelled by user.");
        return;
      }
      console.error("Error during restoration:", err);

      const isQuota =
        err.message?.includes("429") ||
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
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setStartTime(null);
    setOriginalImage(null);
    setResult(null);
    setError(null);
    setApiErrorDetails(null);
    setIsQuotaError(false);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResult(null);
    setError(null);
    setApiErrorDetails(null);
    setIsQuotaError(false);
    setIsLoading(false);
    setStartTime(null);
    setActiveUserNote(undefined);
  };

  const handleRetry = () => {
    if (originalImage && fileInfo) {
      handleImageSelected(originalImage, fileInfo, activeFilterId, activeUserNote);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-stone-900 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Flat Nordic Header */}
      <Header
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
        isPromptCustomized={isPromptCustomized}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {/* Error notification banner with flat styling */}
        {error && (
          <div
            id="error-banner"
            className="max-w-2xl mx-auto mb-8 w-full p-5 rounded-xl bg-white border border-red-200 text-stone-800 text-xs space-y-3 shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="font-semibold text-red-950 text-sm">
                  {isQuotaError
                    ? "Google Gemini API kvoot: Arveldusega võti on vajalik"
                    : "Viga foto taastamisel"}
                </p>
                <p className="leading-relaxed text-stone-700">{error}</p>

                {isQuotaError && (
                  <div className="mt-3 p-3.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-800 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-stone-900">
                      <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                      <span>Miks see viga tekib ja kuidas seda lahendada?</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-600">
                      Google&apos;i reeglite kohaselt on pilditöötluse ja fotode taastamise
                      mudelitel (nt <code>gemini-3.1-flash-image</code>) tasuta proovipaketis
                      päringulimiit <strong>0 (limit: 0)</strong>. Nende mudelite kasutamiseks on vaja
                      projekti, millel on aktiveeritud Google Cloud Billing (Pay-as-you-go).
                    </p>
                    <div className="text-[11px] font-medium text-stone-800 pt-1">
                      Kuidas lisada:
                      <ol className="list-decimal list-inside mt-1 space-y-0.5 text-stone-600">
                        <li>Avage vasakult AI Studio menüüst <strong>Settings &gt; Secrets</strong></li>
                        <li>Valige või siduge Google Cloudi projekt, millel on arvelduskonto aktiveeritud</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* Developer diagnostics card for photo restoration error */}
                {apiErrorDetails && (
                  <div className="mt-2">
                    <DevMetricsCard
                      errorDetails={apiErrorDetails}
                      title="Arendaja veateade ja diagnostika"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Proovi uuesti</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-stone-600 hover:text-stone-900 underline underline-offset-2"
                  >
                    Vali teine foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 1: Upload state */}
        {!isLoading && !result && (
          <PhotoUploader
            onImageSelected={handleImageSelected}
            isLoading={isLoading}
            onOpenPromptModal={() => setIsPromptModalOpen(true)}
            isPromptCustomized={isPromptCustomized}
          />
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

      {/* Modal for viewing & testing the system prompt */}
      <PromptEditorModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        currentPrompt={customPrompt}
        onSavePrompt={(p) => setCustomPrompt(p)}
        onResetPrompt={() => setCustomPrompt(DEFAULT_RESTORATION_PROMPT)}
      />

      {/* Clean Flat Nordic footer */}
      <footer className="w-full border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Vanade fotode taastaja • Ärata vanad pildid ellu
          </span>
          <span className="text-stone-400">
            Mälupõhine töötlemine
          </span>
        </div>
      </footer>
    </div>
  );
}

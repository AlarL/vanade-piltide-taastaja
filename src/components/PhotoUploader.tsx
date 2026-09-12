import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  SlidersHorizontal,
  Sparkles,
  Smartphone,
  History,
  Camera,
  X,
  RefreshCw,
  ArrowRight,
  Check,
  Palette,
  Leaf,
  ShieldCheck,
  Zap,
  ChevronDown,
} from "lucide-react";
import { RestorationFilterId } from "../types";
import { RESTORATION_FILTERS } from "../filters";

interface PhotoUploaderProps {
  onImageSelected: (
    base64: string,
    fileInfo?: { name: string; type: string; aspectRatio: string },
    filterId?: RestorationFilterId,
    userNote?: string
  ) => void;
  isLoading: boolean;
  /** Rendered right under the intro text - used for the mobile layout */
  inlineDemo?: React.ReactNode;
  quota?: {
    photosRemaining: number;
    photosMax: number;
    videosRemaining: number;
    videosMax: number;
    photoResetHours?: number;
    videoResetHours?: number;
  } | null;
}

const MAX_NOTE_LENGTH = 120;

const QUICK_SUGGESTIONS = [
  "Kleit helesinine",
  "Loomulikud soojad värvid",
  "Sinised silmad",
  "Tumedad juuksed",
  "Säilita mustvalge toon",
];

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onImageSelected,
  isLoading,
  inlineDemo,
  quota,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<RestorationFilterId>("modern_hd");
  const [shortNote, setShortNote] = useState<string>("");
  const [showExtras, setShowExtras] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<{
    base64: string;
    info: { name: string; type: string; aspectRatio: string };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploadedImage || !window.matchMedia("(max-width: 800px)").matches) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [uploadedImage]);
  // Helper to determine aspect ratio from loaded Image
  const calculateAspectRatio = (
    width: number,
    height: number
  ): "1:1" | "3:4" | "4:3" | "16:9" => {
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.15) return "1:1";
    if (ratio < 0.85) return "3:4";
    if (ratio >= 0.85 && ratio < 1.45) return "4:3";
    return "16:9";
  };

  const processFile = (file: File) => {
    setErrorMsg(null);

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Palun valige pildifail (JPG, PNG, WebP või TIFF).");
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("Pilt on liiga suur. Maksimaalne lubatud suurus on 20 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (!base64) return;

      const img = new Image();
      img.onload = () => {
        const detectedAspect = calculateAspectRatio(
          img.naturalWidth,
          img.naturalHeight
        );
        setUploadedImage({
          base64,
          info: {
            name: file.name,
            type: file.type,
            aspectRatio: detectedAspect,
          },
        });
      };
      img.onerror = () => {
        setUploadedImage({
          base64,
          info: {
            name: file.name,
            type: file.type,
            aspectRatio: "1:1",
          },
        });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleStartRestoration = () => {
    if (!uploadedImage) return;
    onImageSelected(
      uploadedImage.base64,
      uploadedImage.info,
      selectedFilter,
      shortNote.trim() || undefined
    );
  };

  const handleQuickSuggestionClick = (suggestion: string) => {
    if (!shortNote.trim()) {
      setShortNote(suggestion);
    } else if (!shortNote.toLowerCase().includes(suggestion.toLowerCase())) {
      const combined = `${shortNote.trim()}, ${suggestion}`.slice(0, MAX_NOTE_LENGTH);
      setShortNote(combined);
    }
  };

  return (
    <div
      id="photo-uploader-section"
      className="photo-uploader w-full max-w-2xl mx-auto space-y-6"
    >
      {/* Hidden native input */}
      <input
        id="file-input"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/tiff"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      <div className="upload-heading">
        <h1>{uploadedImage ? <>Taasta <span className="brand-accent">vana</span> pilt</> : <>Vanad fotod.<br /><em>Uued värvid.</em></>}</h1>
        <p className="upload-description">
          {uploadedImage ? (
            "Vali stiil ja lisa soovi korral värvisoov."
          ) : (
            <>
              Ärata vanad pildid ellu!
              <br />
              Eemalda kulumisjäljed, too detailid esile ja lisa värvid.
            </>
          )}
        </p>
      </div>

      {!uploadedImage && inlineDemo && (
        <div className="album-example-inline">{inlineDemo}</div>
      )}

      {!uploadedImage && (
        <div className="space-y-4">
          <div
            id="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`album-drop-zone ${isDragOver ? "is-dragging" : ""}`}
          >
            <div className="album-cta-wrap">
              <button type="button" className="album-primary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-5 h-5" aria-hidden="true" />
                Vali foto. Proovi tasuta.
              </button>
              <p className="file-hint">JPG, PNG, WebP · kuni 20 MB · üks korraga</p>
            </div>
            {errorMsg && <p role="alert" className="album-error">{errorMsg}</p>}
          </div>
          {quota && (
            <p className="quota-note">
              {quota.photosRemaining > 0 ? (
                <>
                  Täna saad tasuta taastada veel{" "}
                  <strong>
                    {quota.photosRemaining} {quota.photosRemaining === 1 ? "foto" : "fotot"}
                  </strong>{" "}
                  (limiit {quota.photosMax}).
                </>
              ) : (
                <>
                  Tänane tasuta limiit ({quota.photosMax}) on täis.
                  {quota.photoResetHours ? ` Uued taastamised avanevad ~${quota.photoResetHours} h pärast.` : ""}
                </>
              )}
            </p>
          )}
          <div className="album-notice">
            <Leaf className="w-4 h-4 shrink-0" aria-hidden="true" />
            <p>
              Kasutage vastutustundlikult. Taastamine kasutab arvutusressursse.
              <br />
              Vali foto, mida soovid päriselt taastada.
            </p>
          </div>
        </div>
      )}

      {/* FLOW STEP 2: Image is uploaded, configure style and short note */}
      {uploadedImage && (
        <div className="upload-settings bg-white rounded-xl border border-stone-200 p-5 sm:p-7 space-y-6">
          {/* Top bar: Uploaded image summary */}
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-900 border border-stone-200 shrink-0 shadow-2xs">
              <img
                src={uploadedImage.base64}
                alt="Valitud foto"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-900 truncate">
                {uploadedImage.info.name}
              </p>
              <p className="text-[13px] text-stone-500 truncate">
                Valmis töötlemiseks · {uploadedImage.info.aspectRatio}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors shrink-0"
              title="Vali teine foto"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Vaheta foto</span>
              <span className="sr-only sm:hidden">Vaheta foto</span>
            </button>
          </div>

          {/* Style Selector */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
              <label className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <span>2. VALI STIIL</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {RESTORATION_FILTERS.map((f) => {
                const isSelected = selectedFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedFilter(f.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-teal-700 bg-teal-50/70 text-teal-950 ring-1 ring-teal-700/30 shadow-2xs"
                        : "border-stone-200 bg-white hover:border-stone-300 text-stone-700 hover:bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {f.id === "modern_hd" && (
                          <Smartphone
                            className={`w-4 h-4 ${
                              isSelected ? "text-teal-700" : "text-sky-600"
                            }`}
                          />
                        )}
                        {f.id === "authentic_restore" && (
                          <History
                            className={`w-4 h-4 ${
                              isSelected ? "text-amber-700" : "text-amber-600"
                            }`}
                          />
                        )}
                        {f.id === "studio_portrait" && (
                          <Camera
                            className={`w-4 h-4 ${
                              isSelected ? "text-rose-700" : "text-rose-600"
                            }`}
                          />
                        )}
                        <span className="text-xs font-semibold">{f.label}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      )}
                    </div>
                    <p className="text-[13px] text-stone-500 mt-1 leading-snug">
                      {f.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Note / Lisainfo - collapsed by default, it is purely optional */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/60">
            <button
              type="button"
              onClick={() => setShowExtras((prev) => !prev)}
              aria-expanded={showExtras}
              aria-controls="extra-settings-panel"
              className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Palette className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-stone-900">
                    3. LISASEADED (valikuline)
                  </span>
                  <span className="block text-[13px] text-stone-500 truncate">
                    {shortNote.trim() ? `„${shortNote.trim()}“` : "Lisa värvisoov või lühike märkus"}
                  </span>
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-500 shrink-0 transition-transform ${
                  showExtras ? "rotate-180" : ""
                }`}
              />
            </button>

            {showExtras && (
              <div id="extra-settings-panel" className="px-3.5 pb-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <label htmlFor="short-note-input" className="text-[13px] text-stone-500">
                    Värvisoov või lisainfo
                  </label>
                  <span className="text-[13px] font-mono text-stone-400">
                    {shortNote.length} / {MAX_NOTE_LENGTH}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="short-note-input"
                    type="text"
                    maxLength={MAX_NOTE_LENGTH}
                    value={shortNote}
                    onChange={(e) => setShortNote(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="nt kleit peab olema helesinine, auto tumepunane, silmad sinised..."
                    className="w-full text-xs text-stone-900 px-3.5 py-2.5 pr-8 rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                  />

                  {shortNote.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShortNote("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors"
                      title="Tühjenda väli"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Inspiration Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] text-stone-400 mr-1">Näited:</span>
                  {QUICK_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleQuickSuggestionClick(sug)}
                      className="quick-suggestion-chip min-h-0 h-8 px-2.5 py-1 rounded-md text-[13px] leading-none bg-white hover:bg-stone-100 text-stone-600 transition-colors border border-stone-200"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button: Start Restoration */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setUploadedImage(null)}
              className="order-2 w-full sm:order-1 sm:w-auto px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors text-center"
            >
              Tühista
            </button>

            <div className="order-1 w-full sm:order-2 sm:w-auto sm:flex sm:flex-col sm:items-end">
              {quota && quota.photosRemaining <= 0 ? (
                <div className="w-full sm:w-auto text-xs text-amber-900 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-center">
                  Päevane limiit ({quota.photosMax || 5} fotot) on täis. Uus limiit vabaneb umbes {quota.photoResetHours || 24} h pärast.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRestoration}
                  disabled={isLoading}
                  className="btn-forest w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold transition-all shadow-xs"
                >
                  <Sparkles className="w-4 h-4 fill-current text-white/70" />
                  <span>Taasta foto tasuta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <p className="file-hint mt-2">
                Alustades nõustute{" "}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-legal-terms"))}
                  className="underline underline-offset-2 hover:text-stone-700 transition-colors"
                >
                  kasutustingimustega
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


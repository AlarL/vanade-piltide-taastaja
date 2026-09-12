import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  RotateCcw,
  Download,
  Sparkles,
  Timer,
  AlertCircle,
  Film,
  Check,
  Camera,
  Layers,
  Smile,
  Eye,
  ArrowUpRight,
  RotateCw,
  MessageSquare,
  Wind,
  UserCheck,
  Loader2,
  Copy,
  Crop,
  ShieldAlert,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Wand2,
} from "lucide-react";
import { VideoState, DynamicVideoSuggestion } from "../types";
import { VIDEO_PRESETS, VideoPreset } from "../videoPresets";
import { captureVideoFrame, downloadDataUrl, cropImageBase64 } from "../utils/imageExport";
import { DevMetricsCard } from "./DevMetricsCard";
import { CompanyAdCard } from "./CompanyAdCard";
import { DeveloperCoffeeCard } from "./DeveloperCoffeeCard";

export type CropPresetType = "full" | "center" | "left" | "right" | "custom";

interface VideoAnimatorProps {
  restoredImageUrl: string;
  originalImageUrl?: string;
  originalFileName?: string;
  originalAspectRatio?: string;
}

export const VideoAnimator: React.FC<VideoAnimatorProps> = ({
  restoredImageUrl,
  originalImageUrl,
  originalFileName,
  originalAspectRatio,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("warm_smile");
  const [promptText, setPromptText] = useState<string>(VIDEO_PRESETS[0].userPrompt);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Dynamic Scene-Aware Suggestions from Gemini
  const [dynamicSuggestions, setDynamicSuggestions] = useState<DynamicVideoSuggestion[]>([]);
  const [sceneDescription, setSceneDescription] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasFetchedSuggestions, setHasFetchedSuggestions] = useState(false);
  const [showAllStaticPresets, setShowAllStaticPresets] = useState(false);

  // Focus & Crop settings
  const [cropMode, setCropMode] = useState<CropPresetType>("full");
  const [cropStartX, setCropStartX] = useState<number>(0.0);
  const [cropEndX, setCropEndX] = useState<number>(1.0);

  const [videoState, setVideoState] = useState<VideoState>({
    isGenerating: false,
    elapsedSeconds: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const waitingSectionRef = useRef<HTMLDivElement>(null);
  const videoResultRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 800px)").matches) return;

    const target = videoState.isGenerating
      ? waitingSectionRef.current
      : videoState.videoUrl
        ? videoResultRef.current
        : null;
    if (!target) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }, videoState.isGenerating ? 500 : 250);

    return () => window.clearTimeout(timeout);
  }, [videoState.isGenerating, videoState.videoUrl]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch dynamic safe video suggestions analyzed directly from the photo
  const fetchDynamicSuggestions = async () => {
    const targetImage = restoredImageUrl || originalImageUrl;
    if (!targetImage || isLoadingSuggestions) return;

    setIsLoadingSuggestions(true);
    try {
      const res = await fetch("/api/suggest-video-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: targetImage }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setDynamicSuggestions(data.suggestions);
        if (data.sceneDescription) {
          setSceneDescription(data.sceneDescription);
        }
        // Auto-select 1st dynamic suggestion if user has not yet customized the prompt
        setSelectedPresetId(data.suggestions[0].id);
        setPromptText(data.suggestions[0].userPrompt);
      }
    } catch (e) {
      console.warn("Could not fetch dynamic video suggestions:", e);
    } finally {
      setIsLoadingSuggestions(false);
      setHasFetchedSuggestions(true);
    }
  };

  // Automatically fetch dynamic suggestions when animator opens
  useEffect(() => {
    if (isOpen && !hasFetchedSuggestions && !isLoadingSuggestions) {
      fetchDynamicSuggestions();
    }
  }, [isOpen, hasFetchedSuggestions, restoredImageUrl]);

  const handleSelectPreset = (preset: VideoPreset) => {
    setSelectedPresetId(preset.id);
    setPromptText(preset.userPrompt);
  };

  const handleSelectDynamicSuggestion = (suggestion: DynamicVideoSuggestion) => {
    setSelectedPresetId(suggestion.id);
    setPromptText(suggestion.userPrompt);
  };

  // Resolve active item (either from dynamic suggestions or static presets)
  const getActiveItem = ():
    | { id: string; title: string; tagline: string; userPrompt: string; apiPrompt: string; isDynamic?: boolean }
    | undefined => {
    const dyn = dynamicSuggestions.find((s) => s.id === selectedPresetId);
    if (dyn) {
      return {
        id: dyn.id,
        title: dyn.title,
        tagline: dyn.tagline,
        userPrompt: dyn.userPrompt,
        apiPrompt: dyn.apiPrompt,
        isDynamic: true,
      };
    }
    const stat = VIDEO_PRESETS.find((p) => p.id === selectedPresetId);
    if (stat) {
      return {
        id: stat.id,
        title: stat.title,
        tagline: stat.tagline,
        userPrompt: stat.userPrompt,
        apiPrompt: stat.apiPrompt,
        isDynamic: false,
      };
    }
    return undefined;
  };

  const getActivePreset = (): VideoPreset | undefined => {
    return VIDEO_PRESETS.find((p) => p.id === selectedPresetId);
  };

  const handleStartGeneration = async (overrideCropMode?: CropPresetType) => {
    const effectiveCropMode = overrideCropMode || cropMode;
    const activeItem = getActiveItem();
    const fallbackPrompt = dynamicSuggestions[0]?.userPrompt || VIDEO_PRESETS[0].userPrompt;
    const finalUserPrompt = promptText.trim() || fallbackPrompt;

    // If user kept the suggestion/preset prompt unchanged or very similar, use the specialized apiPrompt for maximum realism
    const shouldUseApiPrompt =
      activeItem &&
      (promptText.trim() === activeItem.userPrompt.trim() || promptText.trim().length === 0);

    const apiPrompt = shouldUseApiPrompt ? activeItem.apiPrompt : finalUserPrompt;

    let sX = cropStartX;
    let eX = cropEndX;
    if (effectiveCropMode === "center") {
      sX = 0.15;
      eX = 0.85;
    } else if (effectiveCropMode === "left") {
      sX = 0.0;
      eX = 0.70;
    } else if (effectiveCropMode === "right") {
      sX = 0.30;
      eX = 1.0;
    } else if (effectiveCropMode === "full") {
      sX = 0.0;
      eX = 1.0;
    }

    setVideoState({
      isGenerating: true,
      statusText: effectiveCropMode !== "full" ? "Kärbin valitud kaadrit..." : "Käivitan video loomist...",
      elapsedSeconds: 0,
      prompt: finalUserPrompt,
      error: undefined,
      videoUrl: undefined,
    });

    const startTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setVideoState((prev) => ({
        ...prev,
        elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    try {
      // Apply crop if needed to focus on desired scene elements
      let imageToSend = restoredImageUrl;
      if (effectiveCropMode !== "full") {
        try {
          imageToSend = await cropImageBase64(restoredImageUrl, sX, eX);
        } catch (cropErr) {
          console.warn("Crop failed, falling back to original:", cropErr);
        }
      }

      // Step 1: Request video generation
      const startRes = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageToSend,
          prompt: finalUserPrompt,
          apiPrompt,
          aspectRatio: "16:9",
        }),
      });

      const startData = await startRes.json();
      if (!startRes.ok || !startData.operationName) {
        if (timerRef.current) clearInterval(timerRef.current);
        setVideoState({
          isGenerating: false,
          elapsedSeconds: 0,
          error: startData.error || "Video loomise käivitamine ebaõnnestus.",
          errorDetails: startData.errorDetails,
          devMetrics: startData.devMetrics,
        });
        return;
      }

      const operationName = startData.operationName;
      setVideoState((prev) => ({
        ...prev,
        operationName,
        statusText: "Video genereerimine käib (tehisintellekt animeerib pilti)...",
        devMetrics: startData.devMetrics,
      }));

      // Step 2: Poll status with transient retry tolerance
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      let consecutivePollErrors = 0;

      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetch("/api/video-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName }),
          });

          const statusData = await statusRes.json();
          consecutivePollErrors = 0; // reset on successful HTTP response

          if (statusData.error) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (timerRef.current) clearInterval(timerRef.current);

            setVideoState((prev) => ({
              ...prev,
              isGenerating: false,
              error: statusData.error,
              errorDetails: statusData.errorDetails,
            }));
            return;
          }

          if (statusData.done) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (timerRef.current) clearInterval(timerRef.current);

            // If operation finished but no videos were created (e.g. filtered by safety)
            if (statusData.hasVideos === false) {
              setVideoState((prev) => ({
                ...prev,
                isGenerating: false,
                error: statusData.error || "Video genereerimine lõppes ilma videofailita.",
                errorDetails: statusData.errorDetails,
              }));
              return;
            }

            setVideoState((prev) => ({
              ...prev,
              statusText: "Laadin valmis videot alla...",
            }));

            // Step 3: Download video blob
            const downloadRes = await fetch("/api/video-download", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ operationName }),
            });

            if (!downloadRes.ok) {
              const errJson = await downloadRes.json().catch(() => ({}));
              setVideoState((prev) => ({
                ...prev,
                isGenerating: false,
                error: errJson.error || "Video faili allalaadimine ebaõnnestus.",
                errorDetails: errJson.errorDetails,
              }));
              return;
            }

            const videoBlob = await downloadRes.blob();
            const objectUrl = URL.createObjectURL(videoBlob);
            const totalDuration = Date.now() - startTime;

            setVideoState({
              isGenerating: false,
              videoUrl: objectUrl,
              durationMs: totalDuration,
              elapsedSeconds: Math.floor(totalDuration / 1000),
              prompt: finalUserPrompt,
              devMetrics: startData.devMetrics
                ? {
                    ...startData.devMetrics,
                    durationMs: totalDuration,
                  }
                : undefined,
            });
          }
        } catch (pollErr: any) {
          console.error("Poll error:", pollErr);
          consecutivePollErrors++;
          // Only abort if network fails 5 consecutive times (25+ seconds)
          if (consecutivePollErrors >= 5) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (timerRef.current) clearInterval(timerRef.current);

            setVideoState((prev) => ({
              ...prev,
              isGenerating: false,
              error: pollErr?.message || "Ühenduse viga video staatuse kontrollimisel.",
              errorDetails: {
                statusCode: 500,
                errorCode: "POLL_TIMEOUT_OR_NETWORK_ERROR",
                rawMessage: pollErr?.message || "Serveri ühendus katkes korduvalt.",
                actionableAdvice: "Kontrollige internetiühendust ja proovige uuesti.",
                endpoint: "/api/video-status",
              },
            }));
          }
        }
      }, 5000);
    } catch (err: any) {
      console.error("Generate video error:", err);
      if (timerRef.current) clearInterval(timerRef.current);
      setVideoState((prev) => ({
        ...prev,
        isGenerating: false,
        error: err?.message || "Video loomine ebaõnnestus.",
      }));
    }
  };

  // Download Option 1: Main MP4 video
  const handleDownloadVideo = () => {
    if (!videoState.videoUrl) return;
    const baseName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, "")
      : "foto";
    const filename = `taastatud-video-${baseName}.mp4`;
    const a = document.createElement("a");
    a.href = videoState.videoUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess("video");
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // Download Option 2: Still Frame from Video (PNG)
  const handleCaptureStillFrame = () => {
    if (!videoRef.current) return;
    const frameData = captureVideoFrame(videoRef.current);
    if (!frameData) return;

    const baseName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, "")
      : "foto";
    downloadDataUrl(frameData, `video-kaader-${baseName}.png`);

    setDownloadSuccess("frame");
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // Download Option 3: Combo (Both Restored Photo + Video)
  const handleDownloadCombo = () => {
    if (!videoState.videoUrl) return;
    const baseName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, "")
      : "foto";

    // 1. Download Video
    const videoLink = document.createElement("a");
    videoLink.href = videoState.videoUrl;
    videoLink.download = `taastatud-video-${baseName}.mp4`;
    document.body.appendChild(videoLink);
    videoLink.click();
    document.body.removeChild(videoLink);

    // 2. Download Restored Photo
    setTimeout(() => {
      const imgLink = document.createElement("a");
      imgLink.href = restoredImageUrl;
      imgLink.download = `taastatud-foto-${baseName}.png`;
      document.body.appendChild(imgLink);
      imgLink.click();
      document.body.removeChild(imgLink);
    }, 400);

    setDownloadSuccess("combo");
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "Smile":
        return <Smile className={className} />;
      case "Eye":
        return <Eye className={className} />;
      case "ArrowUpRight":
        return <ArrowUpRight className={className} />;
      case "RotateCw":
        return <RotateCw className={className} />;
      case "MessageSquare":
        return <MessageSquare className={className} />;
      case "Wind":
        return <Wind className={className} />;
      case "UserCheck":
        return <UserCheck className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  let effectiveCropStartX = cropStartX;
  let effectiveCropEndX = cropEndX;
  if (cropMode === "center") {
    effectiveCropStartX = 0.15;
    effectiveCropEndX = 0.85;
  } else if (cropMode === "left") {
    effectiveCropStartX = 0.0;
    effectiveCropEndX = 0.70;
  } else if (cropMode === "right") {
    effectiveCropStartX = 0.30;
    effectiveCropEndX = 1.0;
  } else if (cropMode === "full") {
    effectiveCropStartX = 0.0;
    effectiveCropEndX = 1.0;
  }

  const isChildFilterDetected = Boolean(
    videoState.error?.toLowerCase().includes("children") ||
    videoState.error?.toLowerCase().includes("child") ||
    videoState.errorDetails?.technicalInfo?.isChildSafety ||
    videoState.errorDetails?.rawMessage?.toLowerCase().includes("children")
  );

  return (
    <div
      id="video-animator-card"
      className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5"
    >
      {/* Header section with toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200 shrink-0">
            <Film className="w-5 h-5 text-teal-800" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Loo sellest fotost video
            </h3>
            <p className="text-xs text-stone-500">
              Ärata pilt ellu: vali liikumine (naeratus, pilkkontakt, peapööre) või kirjuta oma idee
            </p>
          </div>
        </div>

        {!isOpen && !videoState.videoUrl && !videoState.isGenerating && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-white transition-colors shadow-2xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alusta video tegemist</span>
          </button>
        )}
      </div>

      {/* Main input & generator body */}
      {(isOpen || videoState.isGenerating || videoState.videoUrl) && (
        <div className="space-y-5 pt-1">
          {/* Dynamic AI Suggestions & Quick choices */}
          {!videoState.isGenerating && !videoState.videoUrl && (
            <div className="space-y-3">
              {isLoadingSuggestions && (
                <div className="p-3.5 rounded-xl border border-teal-200/80 bg-teal-50/50 flex items-center justify-between gap-3 text-xs text-teal-900">
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 text-teal-700 animate-spin shrink-0" />
                    <span>Tehisintellekt analüüsib fotot ja koostab turvalisi liikumissoovitusi...</span>
                  </div>
                </div>
              )}

              {dynamicSuggestions.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                        <span>AI analüüsitud soovitused sellele fotole:</span>
                      </span>
                      {sceneDescription && (
                        <span className="text-[13px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 font-medium">
                          Tuvastatud: {sceneDescription}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={fetchDynamicSuggestions}
                      disabled={isLoadingSuggestions}
                      className="inline-flex items-center gap-1 text-[13px] text-stone-500 hover:text-stone-800 transition-colors self-start sm:self-auto"
                      title="Uuenda AI soovitusi"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingSuggestions ? "animate-spin" : ""}`} />
                      <span>Uuenda soovitusi</span>
                    </button>
                  </div>

                  {/* Grid of dynamic suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {dynamicSuggestions.map((suggestion) => {
                      const isSelected = selectedPresetId === suggestion.id;
                      return (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleSelectDynamicSuggestion(suggestion)}
                          className={`text-left p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? "border-teal-700 bg-teal-50/80 text-teal-950 shadow-2xs ring-1 ring-teal-700/20"
                              : "border-stone-200 bg-stone-50/40 hover:bg-white hover:border-stone-300 text-stone-700"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-white text-stone-500 border border-stone-200"
                                }`}
                              >
                                {renderIcon(suggestion.iconName || "Sparkles", "w-4 h-4")}
                              </div>
                              <span className="text-xs font-semibold text-stone-900">
                                {suggestion.title}
                              </span>
                            </div>

                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-teal-700 shrink-0 mt-1" />
                            )}
                          </div>

                          <p className="text-[13px] text-stone-500 mt-1.5 leading-snug">
                            {suggestion.tagline}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Toggle button to see general portrait presets */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowAllStaticPresets((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors"
                    >
                      {showAllStaticPresets ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                          <span>Peida üldised portree-eelseadistused</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                          <span>Vaata ka üldiseid portree-eelseadistusi ({VIDEO_PRESETS.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Static presets (shown if no dynamic suggestions or if user toggled) */}
              {(dynamicSuggestions.length === 0 || showAllStaticPresets) && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      <span>{dynamicSuggestions.length > 0 ? "Üldised portree-valikud:" : "Videokiir-valikud (klõpsa sobival liigutusel):"}</span>
                    </span>
                    <span className="text-[13px] text-stone-400">
                      Vali etteantud või kohanda all
                    </span>
                  </div>

                  {/* Grid of quick choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {VIDEO_PRESETS.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`text-left p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? "border-teal-700 bg-teal-50/80 text-teal-950 shadow-2xs ring-1 ring-teal-700/20"
                              : "border-stone-200 bg-stone-50/40 hover:bg-white hover:border-stone-300 text-stone-700"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-white text-stone-500 border border-stone-200"
                                }`}
                              >
                                {renderIcon(preset.iconName, "w-4 h-4")}
                              </div>
                              <span className="text-xs font-semibold text-stone-900">
                                {preset.title}
                              </span>
                            </div>

                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-teal-700 shrink-0 mt-1" />
                            )}
                          </div>

                          <p className="text-[13px] text-stone-500 mt-1.5 leading-snug">
                            {preset.tagline}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Kaadri fookusala valik */}
          {!videoState.isGenerating && !videoState.videoUrl && (
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Crop className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-semibold text-stone-900">
                    Kaadri fookusala (valikuline):
                  </span>
                </div>
                <span className="text-[13px] text-stone-500">
                  Vali soovitud fookus enne video genereerimist
                </span>
              </div>

              {/* Crop Mode Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCropMode("full");
                    setCropStartX(0);
                    setCropEndX(1.0);
                  }}
                  className={`p-2.5 rounded-lg text-xs text-left border transition-all ${
                    cropMode === "full"
                      ? "bg-white border-teal-700 text-teal-950 ring-1 ring-teal-700/20 shadow-2xs font-semibold"
                      : "bg-white/70 border-stone-200 text-stone-700 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Terve foto</span>
                    {cropMode === "full" && <Check className="w-3.5 h-3.5 text-teal-700" />}
                  </div>
                  <p className="text-[13px] text-stone-500 mt-1">Kogu foto (100%)</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCropMode("center");
                    setCropStartX(0.15);
                    setCropEndX(0.85);
                  }}
                  className={`p-2.5 rounded-lg text-xs text-left border transition-all ${
                    cropMode === "center"
                      ? "bg-white border-teal-700 text-teal-950 ring-1 ring-teal-700/20 shadow-2xs font-semibold"
                      : "bg-white/70 border-stone-200 text-stone-700 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Keskosa</span>
                    {cropMode === "center" && <Check className="w-3.5 h-3.5 text-teal-700" />}
                  </div>
                  <p className="text-[13px] text-stone-500 mt-1">Fookus keskel (15%–85%)</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCropMode("left");
                    setCropStartX(0.0);
                    setCropEndX(0.70);
                  }}
                  className={`p-2.5 rounded-lg text-xs text-left border transition-all ${
                    cropMode === "left"
                      ? "bg-white border-teal-700 text-teal-950 ring-1 ring-teal-700/20 shadow-2xs font-semibold"
                      : "bg-white/70 border-stone-200 text-stone-700 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Vasak pool</span>
                    {cropMode === "left" && <Check className="w-3.5 h-3.5 text-teal-700" />}
                  </div>
                  <p className="text-[13px] text-stone-500 mt-1">Vasak pool (0%–70%)</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCropMode("right");
                    setCropStartX(0.30);
                    setCropEndX(1.0);
                  }}
                  className={`p-2.5 rounded-lg text-xs text-left border transition-all ${
                    cropMode === "right"
                      ? "bg-white border-teal-700 text-teal-950 ring-1 ring-teal-700/20 shadow-2xs font-semibold"
                      : "bg-white/70 border-stone-200 text-stone-700 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Parem pool</span>
                    {cropMode === "right" && <Check className="w-3.5 h-3.5 text-teal-700" />}
                  </div>
                  <p className="text-[13px] text-stone-500 mt-1">Parem pool (30%–100%)</p>
                </button>
              </div>

              {/* Visual Crop Frame indicator */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[13px] text-stone-600">
                  <span className="font-medium">Kaadri eelvaade:</span>
                  <span className="font-mono text-stone-500">
                    Laius: {Math.round((effectiveCropEndX - effectiveCropStartX) * 100)}%
                  </span>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-stone-300 bg-stone-900 h-28 sm:h-32 flex items-center justify-center select-none">
                  <img
                    src={restoredImageUrl}
                    alt="Kärpe eelvaade"
                    className="absolute inset-0 w-full h-full object-contain"
                  />

                  {/* Dim left excluded area */}
                  {effectiveCropStartX > 0.01 && (
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-stone-950/80 backdrop-blur-[1px] border-r-2 border-stone-400 flex items-center justify-center text-[13px] text-stone-300 font-medium px-1 text-center"
                      style={{ width: `${effectiveCropStartX * 100}%` }}
                    >
                      <span className="hidden sm:inline">Välja jäetud</span>
                    </div>
                  )}

                  {/* Active crop window */}
                  <div
                    className="absolute top-0 bottom-0 border-2 border-teal-400 bg-teal-500/15 flex flex-col justify-between p-1.5 pointer-events-none transition-all"
                    style={{
                      left: `${effectiveCropStartX * 100}%`,
                      width: `${(effectiveCropEndX - effectiveCropStartX) * 100}%`,
                    }}
                  >
                    <span className="self-start px-2 py-0.5 rounded bg-teal-900/90 text-teal-100 text-[13px] font-semibold tracking-wide shadow-xs">
                      {cropMode === "full" ? "Kogu foto" : "Valitud kaader videoks"}
                    </span>
                  </div>

                  {/* Dim right excluded area */}
                  {effectiveCropEndX < 0.99 && (
                    <div
                      className="absolute top-0 bottom-0 right-0 bg-stone-950/80 backdrop-blur-[1px] border-l-2 border-stone-400 flex items-center justify-center text-[13px] text-stone-300 font-medium px-1 text-center"
                      style={{ width: `${(1 - effectiveCropEndX) * 100}%` }}
                    >
                      <span>Välja jäetud</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prompt textarea */}
          {!videoState.isGenerating && !videoState.videoUrl && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="video-prompt-input"
                  className="text-xs font-medium text-stone-700"
                >
                  Täpne juhis tehisintellektile (saad ise teksti muuta või lisada):
                </label>
                <div className="flex items-center gap-2.5">
                  {promptText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPromptText("");
                        setSelectedPresetId("custom");
                      }}
                      className="text-[13px] text-stone-500 hover:text-stone-900 underline transition-colors"
                      title="Puhasta tekstiväli uue teksti sisestamiseks"
                    >
                      Puhasta väli
                    </button>
                  )}
                  <span className="text-[13px] text-stone-400">
                    {promptText.length} tähte
                  </span>
                </div>
              </div>

              <textarea
                id="video-prompt-input"
                rows={3}
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  setSelectedPresetId("custom");
                }}
                onFocus={(e) => e.target.select()}
                disabled={videoState.isGenerating}
                placeholder="Kirjelda oma sõnadega, mida soovid videos näha... (nt: Inimene naeratab soojalt, pöörab aeglaselt pead ja pilgutab silmi)"
                className="w-full text-xs text-stone-900 p-3 rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition-all placeholder:text-stone-400 leading-relaxed resize-none shadow-2xs"
              />
            </div>
          )}

          {/* Action buttons */}
          {!videoState.isGenerating && !videoState.videoUrl && (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto px-3 py-2.5 text-xs text-stone-500 hover:text-stone-800 text-center"
              >
                Peida video aken
              </button>

              <button
                type="button"
                onClick={handleStartGeneration}
                className="btn-forest w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {selectedPresetId !== "custom" && getActiveItem()
                    ? `Genereeri video: ${getActiveItem()?.title}`
                    : "Genereeri video"}
                </span>
              </button>
            </div>
          )}

          {/* Loading state during video generation */}
          {videoState.isGenerating && (
            <div ref={waitingSectionRef} className="scroll-mt-4 space-y-3">
              <div className="p-5 sm:p-6 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-3">
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 text-teal-700 animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-mono font-medium">
                    <Timer className="w-3.5 h-3.5 text-teal-700" />
                    <span>Kulunud aeg: {videoState.elapsedSeconds}s</span>
                  </div>
                  <p className="text-sm font-semibold text-stone-900 pt-1">
                    {videoState.statusText || "Video loomine käib..."}
                  </p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Tehisintellekt arvutab näoliigutusi ja valgust. Video renderdamine võtab tavaliselt umbes 30–60 sekundit.
                  </p>
                </div>
              </div>
              <CompanyAdCard variant="generating" />
            </div>
          )}

          {/* Error display */}
          {videoState.error && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold text-red-900">Video loomine ebaõnnestus</p>
                  <p className="text-red-700 text-[13px] leading-relaxed">{videoState.error}</p>
                  <button
                    type="button"
                    onClick={() => handleStartGeneration()}
                    className="font-semibold underline text-red-900 hover:text-red-950 block pt-0.5"
                  >
                    Proovi uuesti
                  </button>
                </div>
              </div>

              {/* Specialized Subject / Safety Alert Box */}
              {isChildFilterDetected && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-3 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <p className="font-semibold text-amber-900 text-sm">
                        Automaatne turvakontroll (Responsible AI) piiras video genereerimist
                      </p>
                      <p className="text-[12px] text-amber-900/90 leading-relaxed">
                        Tehisintellektil on automaatsed turvareeglid, mis võivad piirata teatud isikute või alaealiste animeerimist arhiivifotodel (deepfake ja lastekaitse reeglid).
                      </p>
                      <p className="text-[12px] text-amber-900/90 leading-relaxed">
                        Soovitus: Kui fotol on teisi isikuid või elemente servades, saate üleval valida kaadri fookuse (nt <strong>Keskosa</strong>, <strong>Vasak pool</strong> või <strong>Parem pool</strong>) või proovida teist fotot.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={() => {
                        setCropMode("center");
                        setCropStartX(0.15);
                        setCropEndX(0.85);
                        handleStartGeneration("center");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-white transition-all shadow-xs"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Fookusta keskosa & proovi uuesti</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Resource & diagnostics card with error details & pricing info */}
              {(videoState.errorDetails || videoState.devMetrics) && (
                <DevMetricsCard
                  metrics={videoState.devMetrics}
                  errorDetails={videoState.errorDetails}
                  title="Video vea- ja kuluaruanne"
                />
              )}
            </div>
          )}

          {/* Generated Video Player & Rich Download Choices (Alla laadimine valikud) */}
          {videoState.videoUrl && (
            <div ref={videoResultRef} className="scroll-mt-4 space-y-4 pt-1">
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-stone-100">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-mono font-semibold">
                  <Timer className="w-3.5 h-3.5 text-teal-700" />
                  <span>
                    Video valmis:{" "}
                    {videoState.durationMs
                      ? `${(videoState.durationMs / 1000).toFixed(1)}s`
                      : `${videoState.elapsedSeconds}s`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setVideoState({
                      isGenerating: false,
                      elapsedSeconds: 0,
                      videoUrl: undefined,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tee uus video teise liigutusega</span>
                </button>
              </div>

              {/* Video Player Display */}
              <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[440px] shadow-xs">
                <video
                  ref={videoRef}
                  src={videoState.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-auto max-h-[440px] object-contain"
                />
              </div>

              {/* Download Options Panel (Alla laadimine valikud) */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-teal-700" />
                    <span>Allalaadimise valikud:</span>
                  </span>
                  {downloadSuccess && (
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Fail alla laaditud!</span>
                    </span>
                  )}
                </div>

                {/* Download Buttons Grid - 3 ephemeral download options, no persistent sharing */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: MP4 Video */}
                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    className="flex items-center gap-2 p-3 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-semibold transition-colors shadow-2xs text-left"
                  >
                    <Download className="w-4 h-4 shrink-0 text-teal-200" />
                    <div>
                      <p className="leading-tight">Laadi video alla</p>
                      <p className="text-[13px] text-teal-200 font-normal">HD MP4 fail</p>
                    </div>
                  </button>

                  {/* Option 2: Still Frame from Video */}
                  <button
                    type="button"
                    onClick={handleCaptureStillFrame}
                    className="flex items-center gap-2 p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-medium transition-colors text-left"
                    title="Pildista praegune videohetk eraldi fotona"
                  >
                    <Camera className="w-4 h-4 shrink-0 text-stone-600" />
                    <div>
                      <p className="leading-tight font-semibold">Salvesta kaader</p>
                      <p className="text-[13px] text-stone-500">Külmutatud PNG foto</p>
                    </div>
                  </button>

                  {/* Option 3: Combo (Photo + Video) */}
                  <button
                    type="button"
                    onClick={handleDownloadCombo}
                    className="flex items-center gap-2 p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-medium transition-colors text-left"
                    title="Laadi korraga alla nii taastatud foto kui video"
                  >
                    <Layers className="w-4 h-4 shrink-0 text-teal-700" />
                    <div>
                      <p className="leading-tight font-semibold">Foto + Video komplekt</p>
                      <p className="text-[13px] text-stone-500">Mõlemad failid korraga</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Resource metrics & environmental impact for completed video */}
              {videoState.devMetrics && (
                <DevMetricsCard
                  metrics={videoState.devMetrics}
                  title="Video genereerimise ressursi- & energiaraport"
                  compact={true}
                />
              )}

              <DeveloperCoffeeCard />
            </div>
          )}
        </div>
      )}
    </div>
  );
};


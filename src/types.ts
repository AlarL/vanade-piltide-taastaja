export type CompareMode = "slider" | "side-by-side" | "diff-toggle";

export type RestorationFilterId = "modern_hd" | "authentic_restore" | "studio_portrait";

export interface RestorationFilter {
  id: RestorationFilterId;
  label: string;
  tagline: string;
  description: string;
  promptAddon: string;
}

/**
 * Optional present-day photo of the same person, cropped to the face in the browser
 * and used only as an identity reference for the restoration.
 */
export interface FaceReferencePhoto {
  /** Square JPEG data URL, already downscaled client-side. */
  base64: string;
  mimeType: string;
  /** Approximate upload size, shown to the user so the cost stays visible. */
  bytes: number;
}

export interface DevMetrics {
  timestamp: string;
  formattedTime: string;
  model: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  durationMs?: number;
  inputCostEur: number;
  outputCostEur: number;
  totalCostEur: number;
  formattedCost: string;
  pricingBasis: string;
  operationName?: string;
  energyWh?: number;
  formattedEnergy?: string;
  co2GramsEstonia?: number;
  formattedCo2?: string;
  ecoComparison?: string;
}

export interface ApiErrorDetails {
  statusCode?: number;
  errorCode?: string;
  rawMessage?: string;
  actionableAdvice?: string;
  endpoint?: string;
}

export interface RestoredPhotoResult {
  originalImage: string; // data URL
  restoredImage: string; // data URL
  fileName?: string;
  originalAspectRatio?: string;
  notes?: string;
  userNote?: string;
  timestamp: number;
  durationMs?: number;
  appliedFilter?: RestorationFilterId;
  devMetrics?: DevMetrics;
  errorDetails?: ApiErrorDetails;
}

export interface DynamicVideoSuggestion {
  id: string;
  title: string;
  tagline: string;
  userPrompt: string;
  apiPrompt: string;
}

export interface VideoSuggestionsResponse {
  sceneDescription?: string;
  suggestions: DynamicVideoSuggestion[];
}

export interface VideoState {
  isGenerating: boolean;
  operationName?: string;
  statusText?: string;
  elapsedSeconds: number;
  videoUrl?: string;
  prompt?: string;
  error?: string;
  errorDetails?: ApiErrorDetails;
  devMetrics?: DevMetrics;
  durationMs?: number;
}


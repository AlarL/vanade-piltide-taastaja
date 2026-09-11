import React from "react";
import { ShieldCheck, Leaf, Zap } from "lucide-react";

interface ResponsibilityBannerProps {
  quota?: {
    photosRemaining: number;
    photosMax: number;
    videosRemaining: number;
    videosMax: number;
    photoResetHours?: number;
    videoResetHours?: number;
  } | null;
}

export const ResponsibilityBanner: React.FC<ResponsibilityBannerProps> = ({ quota }) => {
  return (
    <div
      id="responsibility-banner"
      className="w-full mb-6 rounded-lg bg-stone-50 border border-stone-200 p-4 text-xs text-stone-700"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Core statement: user explicit requirement */}
        <div className="flex items-center gap-2.5 text-center md:text-left">
          <Leaf className="w-4 h-4 text-amber-800 shrink-0" />
          <div>
            <span className="font-semibold tracking-tight">
              Taastamine kasutab arvutusressursse.
            </span>
            <span className="block sm:inline sm:ml-2 text-amber-900/80 font-normal">
              Vali foto, mida soovid päriselt taastada.
            </span>
          </div>
        </div>

        {/* Right side: In-memory processing & daily quota */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-[13px] text-amber-900/85">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-amber-200/80 text-stone-700">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Mälupõhine töötlemine • Faile ei salvestata</span>
          </div>

          {quota && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-amber-200/80 text-stone-800 font-mono text-[13px]">
              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Päevalimiit: <strong>{quota.photosRemaining}/{quota.photosMax}</strong> fotot •{" "}
                <strong>{quota.videosRemaining}/{quota.videosMax}</strong> video
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


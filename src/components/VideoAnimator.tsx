import React from "react";
import { Film } from "lucide-react";

interface VideoAnimatorProps {
  restoredImageUrl: string;
  originalImageUrl?: string;
  originalFileName?: string;
  originalAspectRatio?: string;
}

export const VideoAnimator: React.FC<VideoAnimatorProps> = () => {
  return (
    <div
      id="video-animator-card"
      className="mt-6 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 sm:p-5 text-center text-xs font-medium text-stone-600 flex items-center justify-center gap-2 shadow-2xs"
    >
      <Film className="w-4 h-4 text-stone-400 shrink-0" />
      <span>Video genereerimine on hetkel peatatud.</span>
    </div>
  );
};







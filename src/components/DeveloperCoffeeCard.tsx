import React, { useState } from "react";
import { Coffee, Heart, ExternalLink, Check, Sparkles } from "lucide-react";

export const DeveloperCoffeeCard: React.FC = () => {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const coffeeUrl = "https://buymeacoffee.com";

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://buymeacoffee.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <div
        id="developer-coffee-card"
        className="w-full rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 sm:p-5 shadow-2xs text-stone-800"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
              <Coffee className="w-5 h-5 text-amber-900" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-950 tracking-tight">
                  Tegelikult kulutas see foto taastamine ressursse
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-200/70 text-amber-900">
                  <Sparkles className="w-3 h-3 text-amber-800" />
                  <span>Arendaja teade</span>
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
                See pilt kulutas nii arendaja aega kui tema AI krediiti ja reaalset raha.
                Kui tahad teda tänada ning toetada tasuta taastamise pakkumist ka teistele, osta talle kohvi!
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
            <a
              id="buy-coffee-btn"
              href={coffeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-white text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02]"
            >
              <Coffee className="w-4 h-4 text-amber-200" />
              <span>Osta talle kohvi</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-200/80" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

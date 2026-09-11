import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, X, ShieldCheck } from "lucide-react";

export const Header: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);

  // Close modal on Escape key and prevent background scroll
  useEffect(() => {
    if (!showInfo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowInfo(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showInfo]);

  return (
    <header className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-white text-xs font-serif font-bold tracking-tight shadow-2xs">
            <span>TP</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-stone-900 leading-none">
              Taasta vana pilt
            </h1>
            <p className="text-[11px] text-stone-500 font-normal mt-1">
              taastavanapilt.ee
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Info Modal Button */}
          <button
            id="how-it-works-btn"
            type="button"
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors border border-stone-200"
            title="Kuidas see töötab ja privaatsus"
          >
            <Info className="w-3.5 h-3.5 text-teal-700" />
            <span>Kuidas töötab?</span>
          </button>
        </div>
      </div>

      {/* Info Modal escaped from header context into document.body */}
      {showInfo && typeof document !== "undefined" && createPortal(
        <div
          id="how-it-works-modal-backdrop"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setShowInfo(false)}
        >
          <div
            id="how-it-works-modal-content"
            className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Info className="w-4 h-4 text-teal-800" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-900">
                    Kuidas rakendus töötab?
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Fotode taastamise põhimõtted ja andmekaitse
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Sulge aken"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-stone-600 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              <p>
                <strong className="text-stone-900">Eksperimentaalne leht:</strong> Tegemist on tehisintellekti katseprojektiga arhiivifotode taastamiseks ja testimiseks.
              </p>
              <p>
                <strong className="text-stone-900">Tipptasemel fototöötlus:</strong> Tehisintellekt eemaldab kriimustused, müra ja taastab tuhmunud fotode kontrastsuse ning detailid.
              </p>
              <p>
                <strong className="text-stone-900">Näojoonte säilitamine:</strong> Töötlus säilitab rangelt originaalsed näojooned, silmad ja loomuliku ilme ilma liigse silumiseta.
              </p>
              <p>
                <strong className="text-stone-900">Loomulikud värvid:</strong> Mustvalgele või seepiafotole lisatakse pehmed, ajastutruud ja autentsed värvitoonid.
              </p>
              <div className="p-3.5 bg-teal-50/90 rounded-xl border border-teal-200/80 text-teal-950 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  <strong className="font-semibold text-teal-950">Privaatsus:</strong> Pilte ja videoid ei salvestata serveritesse ega andmebaasidesse. Töötlemine toimub vahemälus ja failid kustuvad koheselt.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 text-right">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors shadow-xs"
              >
                Sain aru
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

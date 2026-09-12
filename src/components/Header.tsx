import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, X, ShieldCheck, Mail } from "lucide-react";

interface HeaderProps {
  onHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHome }) => {
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
    <header className="album-header w-full border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-24 flex items-center justify-between">
        {/* Logo & Name */}
        <button
          id="brand-home-btn"
          type="button"
          onClick={onHome}
          className="flex items-center gap-3 rounded-lg text-left hover:opacity-80 transition-opacity"
          title="Tagasi esilehele"
        >
          <img src="/camera-logo.png" alt="" className="brand-camera" width="52" height="52" />
          <p className="brand-name">
            taasta<span className="brand-accent">vana</span>pilt.ee
          </p>
        </button>

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
            role="dialog" aria-modal="true" aria-label="Kuidas rakendus töötab?"
            className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 text-teal-800" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-stone-900">
                    Kuidas rakendus töötab?
                  </h3>
                  <p className="text-[13px] text-stone-500">
                    Fotode taastamise põhimõtted ja andmekaitse
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
                title="Sulge aken"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-stone-600 leading-relaxed max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              <p>
                <strong className="text-stone-900">Eksperimentaalne leht:</strong> Tegemist on tehisintellekti katseprojektiga arhiivifotode taastamiseks ja testimiseks.
              </p>
              <p>
                <strong className="text-stone-900">Tipptasemel fototöötlus:</strong> Tehisintellekt eemaldab kriimustused, müra ja taastab tuhmunud fotode kontrastsuse ning detailid.
              </p>
              <p>
                <strong className="text-stone-900">Näojoonte säilitamine:</strong> Töötluse eesmärk on säilitada näojooned ja loomulik ilme. Tehisintellekt võib siiski detaile muuta – võrdle tulemust alati originaaliga.
              </p>
              <p>
                <strong className="text-stone-900">Tehisintellekt eksib:</strong> Mudel ei tea, mis fotol tegelikult oli – ta arvab. Aeg-ajalt läheb tulemus täiesti sürreaalseks: võivad tekkida veidrad näod, lisanduvad käed või olematud esemed. See on normaalne. Proovi uuesti või vali teine filter.
              </p>
              <p>
                <strong className="text-stone-900">Loomulikud värvid:</strong> Mustvalgele või seepiafotole lisatakse pehmed, ajastutruud ja autentsed värvitoonid.
              </p>
              <p>
                <strong className="text-stone-900">Video taastatud fotost:</strong> Taastatud pildist saab teha ka lühikese liikuva video – see võimalus on ajutiselt tasuta proovimiseks avatud.
              </p>
              <div className="p-3.5 bg-teal-50/90 rounded-xl border border-teal-200/80 text-teal-950">
                <p className="flex items-center gap-2 text-xs font-semibold text-teal-950 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-800 shrink-0" />
                  <span>Privaatsus</span>
                </p>
                <p className="text-xs leading-relaxed">
                  Me ei salvesta pilte ega videoid oma serveritesse ega andmebaasidesse – töötlemine toimub vahemälus ja failid kustuvad koheselt. Taastamiseks saadetakse foto API kaudu tehisintellekti mudelile, kus seda töödeldakse ajutiselt ega kasutata mudelite treenimiseks.
                </p>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <p className="flex items-center gap-2 text-xs font-semibold text-stone-900 mb-1.5">
                  <Mail className="w-4 h-4 text-teal-800 shrink-0" />
                  <span>Tahad arendust?</span>
                </p>
                <p className="text-xs leading-relaxed text-stone-700">
                  Kui sul on idee, mida saaks paremini teha, või soovid sarnast lahendust,{" "}
                  <a
                    href="mailto:taastavanapilt@gmail.com"
                    className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900"
                  >
                    saada e-kiri
                  </a>
                  .
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


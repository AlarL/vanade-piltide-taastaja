import React from "react";
import { ExternalLink, Sparkles, Gamepad2, Image as ImageIcon } from "lucide-react";

export const AlternativeServicesBanner: React.FC = () => {
  return (
    <div
      id="alternative-services-banner"
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-8"
    >
      <div className="relative rounded-2xl border-2 border-stone-300/90 bg-[#f7f5f0] shadow-sm overflow-hidden p-6 sm:p-8">
        {/* Subtle decorative woven top accent strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-teal-800 via-amber-600 to-stone-800" />

        <div className="space-y-6">
          {/* Header section of banner */}
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-teal-700" />
            <span>Soovitused ja kasulikud alternatiivid</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            {/* Block 1: Vanapilt.ee */}
            <div className="space-y-3 md:pr-6 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
                  <ImageIcon className="w-3.5 h-3.5 text-teal-700" />
                  <span>Teine piltide taastamise koht</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                  Tahad proovida mõnda teist piltide taastamise kohta ja testida teist AI mudelit?
                </h4>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  Proovi ja vaata ka{" "}
                  <a
                    href="https://www.vanapilt.ee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-teal-900 hover:text-teal-950 underline underline-offset-4 decoration-teal-600 hover:decoration-teal-900"
                  >
                    www.vanapilt.ee
                  </a>
                  , et võrrelda erinevaid mudeleid ning leida oma vanafoto jaoks parim tulemus.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="https://www.vanapilt.ee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <span>Vaata www.vanapilt.ee</span>
                  <ExternalLink className="w-3.5 h-3.5 text-teal-200" />
                </a>
              </div>
            </div>

            {/* Block 2: Games For Crowds (Kahoot alternative) */}
            <div className="space-y-3 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-800" />
                  <span>Eesti oma Kahooti alternatiiv</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                  Või vajad hoopis Kahooti alternatiivi, mis tehtud Eestis?
                </h4>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  Hetkel <strong>täiesti tasuta!</strong> Sünnipäevamängudele, firmaüritusele, koosolekule või peole – palju meeskonnamänge otse telefonis. Testi ja anna tagasisidet! Kõik on tasuta:{" "}
                  <a
                    href="https://gamesforcrowds.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-stone-900 hover:text-black underline underline-offset-4 decoration-amber-600 hover:decoration-amber-900"
                  >
                    gamesforcrowds.com
                  </a>
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <a
                  href="https://gamesforcrowds.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:bg-black text-white text-xs font-semibold transition-all shadow-xs group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Mängi tasuta gamesforcrowds.com</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

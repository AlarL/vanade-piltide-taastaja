import React from "react";
import { ExternalLink, Gamepad2, Image as ImageIcon } from "lucide-react";

export const AlternativeServicesBanner: React.FC = () => {
  return (
    <div
      id="alternative-services-banner"
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-2 sm:my-3"
    >
      <div className="album-recommendations border-t border-stone-300/80 pt-3 sm:pt-4 pb-2">
        <div className="space-y-3">
          {/* Header section of banner */}
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider">
            <span>Kasulikud alternatiivid</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            {/* Block 1: Vanapilt.ee */}
            <div className="space-y-2 md:pr-4 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
                  <ImageIcon className="w-3.5 h-3.5 text-teal-700" />
                  <span>Teine piltide taastamise koht</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                  Tahad proovida teist piltide taastamise kohta ja testida teist AI mudelit?
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Proovi ja vaata ka{" "}
                  <a
                    href="https://www.vanapilt.ee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-teal-900 hover:text-teal-950 underline underline-offset-2 decoration-teal-600 hover:decoration-teal-900"
                  >
                    www.vanapilt.ee
                  </a>
                  , et võrrelda erinevaid mudeleid ning leida oma fotole parim tulemus.
                </p>
              </div>

              <div className="pt-1">
                <a
                  href="https://www.vanapilt.ee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-semibold transition-all shadow-2xs"
                >
                  <span>Vaata www.vanapilt.ee</span>
                  <ExternalLink className="w-3.5 h-3.5 text-teal-200" />
                </a>
              </div>
            </div>

            {/* Block 2: Games For Crowds (Kahoot alternative) */}
            <div className="space-y-2 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-800" />
                  <span>Eesti oma Kahooti alternatiiv</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                  Vajad hoopis Kahooti alternatiivi, mis tehtud Eestis?
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Hetkel <strong>täiesti tasuta!</strong> Sünnipäevadele, peole või meeskonnale – palju mänge gruppidele:{" "}
                  <a
                    href="https://gamesforcrowds.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-stone-900 hover:text-black underline underline-offset-2 decoration-amber-600 hover:decoration-amber-900"
                  >
                    gamesforcrowds.com
                  </a>
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <a
                  href="https://gamesforcrowds.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 active:bg-black text-white text-xs font-semibold transition-all shadow-2xs group"
                >
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


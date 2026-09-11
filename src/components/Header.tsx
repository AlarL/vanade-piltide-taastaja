import React, { useState } from "react";
import { ShieldCheck, Info, X, SlidersHorizontal, Sparkles } from "lucide-react";

interface HeaderProps {
  onOpenPromptModal?: () => void;
  isPromptCustomized?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPromptModal,
  isPromptCustomized,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Name */}
        <div className="flex items-center gap-3">
          {/* Nordic glyph in deep fjord teal */}
          <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-white text-xs font-serif font-bold tracking-tight shadow-2xs">
            <span>VF</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-stone-900 leading-none">
              Vanade fotode taastaja
            </h1>
            <p className="text-[11px] text-stone-500 font-normal mt-1">
              Ärata vanad pildid ellu
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Prompt editor trigger button */}
          {onOpenPromptModal && (
            <button
              id="header-prompt-btn"
              type="button"
              onClick={onOpenPromptModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                isPromptCustomized
                  ? "bg-teal-50 text-teal-900 border-teal-300 shadow-2xs"
                  : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300"
              }`}
              title="Vaata ja muuda AI süsteemiprompti testimiseks"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">AI Süsteemiprompt</span>
              <span className="sm:hidden">Prompt</span>
              {isPromptCustomized && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              )}
            </button>
          )}

          {/* Info Modal Button */}
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="p-2 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            title="Info ja privaatsus"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">
                Kuidas rakendus töötab?
              </h3>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>
                <strong>Tipptasemel pilditöötlus:</strong> Kasutame Google'i
                uusimat visuaalset mudelit, mis on spetsiaalselt optimeeritud vanade
                fotode taastamiseks ja värvimiseks.
              </p>
              <p>
                <strong>Näojoonte säilitamine:</strong> Mudelile edastatav juhis
                nõuab ranget inimeste näo kuju, silmade, nina ja loomulike ilmete
                säilitamist ilma moonutuste ja plastmassise silumiseta.
              </p>
              <p>
                <strong>Automaatne värvituvastus:</strong> Süsteem saab ise aru,
                kui tegu on mustvalge või seepiatoonides fotoga, ning lisab
                ajastutruud loomulikud värvid ja nahatoonid.
              </p>
              <p className="p-3 bg-teal-50/80 rounded-xl border border-teal-200/80 text-teal-950">
                <strong>Privaatsusgarantii:</strong> Fotosid ei salvestata ühessegi
                serverisse ega andmebaasi. Töötlemine toimub reaalajas ainult
                mälupuhvris ning failid kustuvad kohe pärast sessiooni.
              </p>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors"
              >
                Sain aru
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

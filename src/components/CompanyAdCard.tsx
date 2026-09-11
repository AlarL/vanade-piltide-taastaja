import React from "react";
import { Users, PartyPopper, ExternalLink, Sparkles, Gamepad2 } from "lucide-react";

interface CompanyAdCardProps {
  className?: string;
  variant?: "generating" | "result";
}

export const CompanyAdCard: React.FC<CompanyAdCardProps> = ({
  className = "",
  variant = "generating",
}) => {
  return (
    <div
      id="company-promo-ad-card"
      className={`rounded-2xl border border-stone-200 bg-linear-to-br from-amber-50/70 via-stone-50 to-teal-50/50 p-5 sm:p-6 text-stone-800 shadow-xs transition-all relative overflow-hidden ${className}`}
    >
      {/* Decorative subtle texture/accent badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-amber-950 text-[13px] font-semibold tracking-wide">
          <Gamepad2 className="w-3.5 h-3.5 text-amber-800" />
          <span>Eesti oma Kahooti alternatiiv</span>
        </div>

        <span className="text-[13px] font-medium text-stone-500 uppercase tracking-wider">
          {variant === "generating" ? "Ootamise ajal soovitus" : "Partneri soovitus"}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Games For Crowds</span>
            <span className="text-xs font-normal text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
              100% Tasuta
            </span>
          </h4>
          <p className="text-xs sm:text-sm text-stone-700 font-medium mt-1 leading-relaxed">
            Vajad hoopis Kahooti alternatiivi, mis on tehtud Eestis? Sünnipäevamängudeks, firmaüritusele, koosolekule või peole – palju kaasahaaravaid meeskonnamänge!
          </p>
        </div>

        {/* Feature points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 pt-1">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Sünnipäevad, peod & koosolekud</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Mängi koos seltskonnaga nutitelefonis</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-stone-200/80">
          <div className="text-[13px] text-stone-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Hetkel täiesti tasuta – testi ja anna tagasisidet!</span>
          </div>

          <a
            href="https://gamesforcrowds.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:bg-black text-white text-xs font-semibold transition-all shadow-2xs hover:shadow-xs group"
          >
            <span>Ava GamesForCrowds.com</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};


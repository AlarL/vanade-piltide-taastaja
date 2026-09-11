import React from "react";
import { Coffee } from "lucide-react";

const COFFEE_URL = "https://www.buymeacoffee.com/taastavanapilt";

export const DeveloperCoffeeCard: React.FC = () => {
  return (
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
            <p className="text-xs font-semibold text-amber-950 tracking-tight">
              Selle foto taastamine maksis päris raha
            </p>
            <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
              Iga taastamine kulutab arendaja aega ja tema AI-krediiti. Kui tulemus meeldis ja
              soovid, et taastamine jääks ka teistele tasuta, osta talle kohv.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <a
            id="buy-coffee-btn"
            href={COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bmc-button w-full sm:w-auto"
          >
            <span aria-hidden="true">☕</span>
            <span>Osta mulle üks kohv</span>
          </a>
        </div>
      </div>
    </div>
  );
};


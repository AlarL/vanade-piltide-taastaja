import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, Scale, X, Lock, FileText, Mail } from "lucide-react";

export const LegalFooter: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">("privacy");

  useEffect(() => {
    if (!modalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen]);

  return (
    <>
      <footer
        id="app-legal-footer"
        className="w-full border-t border-stone-200/90 bg-white/90 py-5 text-center text-xs text-stone-500"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand & copyright */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800 text-xs">
              © {new Date().getFullYear()} taastavanapilt.ee
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-500 text-[13px]">
              Eksperimentaalne vanade piltide taastaja
            </span>
          </div>

          {/* Links to Email, Privacy & Terms modal */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[13px]">
            {/* Email Contact Link - links to taastavanapilt@gmail.com without printing the address as text */}
            <a
              id="footer-email-link"
              href="mailto:taastavanapilt@gmail.com"
              className="text-stone-600 hover:text-stone-900 underline underline-offset-2 transition-colors flex items-center gap-1 font-medium"
              title="Võta ühendust e-posti teel"
            >
              <Mail className="w-3.5 h-3.5 text-teal-700" />
              <span>E-post</span>
            </a>

            <span className="text-stone-300">•</span>

            <button
              id="footer-privacy-btn"
              type="button"
              onClick={() => {
                setActiveTab("privacy");
                setModalOpen(true);
              }}
              className="text-stone-600 hover:text-stone-900 underline underline-offset-2 transition-colors flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-teal-700" />
              <span>Privaatsus & GDPR</span>
            </button>

            <span className="text-stone-300">•</span>

            <button
              id="footer-terms-btn"
              type="button"
              onClick={() => {
                setActiveTab("terms");
                setModalOpen(true);
              }}
              className="text-stone-600 hover:text-stone-900 underline underline-offset-2 transition-colors flex items-center gap-1"
            >
              <Scale className="w-3 h-3 text-stone-500" />
              <span>Kasutustingimused & Vastutus</span>
            </button>
          </div>
        </div>
      </footer>

      {/* GDPR & Legal Terms Modal portal */}
      {modalOpen && typeof document !== "undefined" && createPortal(
        <div
          id="legal-modal-backdrop"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            id="legal-modal-content"
            role="dialog" aria-modal="true" aria-label="Privaatsus ja kasutustingimused"
            className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-teal-800" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    taastavanapilt.ee • Andmekaitse ja õigused
                  </h3>
                  <p className="text-[13px] text-stone-500">
                    Õiguslikud alused ja privaatsustingimused
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-stone-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === "privacy"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Andmekaitse & GDPR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("terms")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === "terms"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Vastutuse välistus & Reeglid
              </button>
            </div>

            {/* Tab Content: Privacy & GDPR */}
            {activeTab === "privacy" && (
              <div className="space-y-3 text-xs text-stone-600 leading-relaxed pt-1">
                <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200/80 text-teal-950 font-medium">
                  🔒 <strong>Pilti ei salvestata, videot ei salvestata:</strong> Üleslaaditud fotod ja loodud videod kustutatakse serverist koheselt pärast töötlemise lõppu.
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-stone-900 text-xs">
                    1. Isikuandmete mittesalvestamine
                  </h4>
                  <p>
                    Teenus taastavanapilt.ee ei säilita kasutajate üleslaaditud faile, näokujutisi ega seonduvaid metaandmeid. Töötlemine toimub reaalajas vahemälus (RAM).
                  </p>

                  <h4 className="font-semibold text-stone-900 text-xs pt-1">
                    2. Mudelite treenimine
                  </h4>
                  <p>
                    Teie perepilte ega fotosid ei kasutata tehisintellekti mudelite treenimiseks ega edastata kolmandatele osapooltele väljaspool konkreetse pilditöötluspäringu teostamist.
                  </p>

                  <h4 className="font-semibold text-stone-900 text-xs pt-1">
                    3. Küpsised ja tehnilised andmed
                  </h4>
                  <p>
                    Rakendus ei kasuta reklaamiküpsiseid ega kasutajate profileerimist. Vajalikke tehnilisi andmeid kasutatakse üksnes veebilehe turvaliseks, stabiilseks ja sujuvaks tehniliseks toimimiseks.
                  </p>
                </div>
              </div>
            )}

            {/* Tab Content: Terms of Service & Disclaimer */}
            {activeTab === "terms" && (
              <div className="space-y-3 text-xs text-stone-600 leading-relaxed pt-1">
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-amber-950">
                  ⚠️ <strong>Tegu on eksperimentaalse lehega:</strong> Teenus taastavanapilt.ee on eksperimentaalne tehisintellekti katseprojekt. Teenuse pakkuja ei vastuta loodud tulemuste, võimalike vigade ega piltide sisu eest – kogu vastutus lasub kasutajal.
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-stone-900 text-xs">
                    1. Eksperimentaalne leht ja vastutuse piirang
                  </h4>
                  <p>
                    Tegu on eksperimentaalse lehega. Teenust pakutakse testimiseks ja meelelahutuslikuks kasutamiseks põhimõttel &quot;nagu on&quot; (as-is). Teenuse pakkuja loobub igasugusest otsesest või kaudsest vastutusest võimalike vigade, andmekao, tehniliste katkestuste või loodud tulemuste eest.
                  </p>

                  <h4 className="font-semibold text-stone-900 text-xs pt-1">
                    2. Autoriõigused ja kasutusõigus
                  </h4>
                  <p>
                    Kasutaja kinnitab, et tal on seaduslik õigus üleslaaditud fotot töödelda. Keelatud on laadida üles kolmandate isikute pilte ilma nõusolekuta või materjale, mis rikuvad autoriõigusi või kehtivaid seadusi.
                  </p>

                  <h4 className="font-semibold text-stone-900 text-xs pt-1">
                    3. Tehisintellekti tulemuste eksperimentaalne iseloom
                  </h4>
                  <p>
                    Kuna tegu on eksperimentaalse lehega, on genereeritud värvid ja näoliigutused tehisintellekti matemaatiline interpretatsioon ega pruugi 100% vastata ajaloolisele tegelikkusele. Teenuse pakkuja ei vastuta anatoomiliste või esteetiliste moonutuste eest.
                  </p>
                </div>
              </div>
            )}

            {/* Footer button */}
            <div className="pt-2 border-t border-stone-100 text-right">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors"
              >
                Sulge
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};


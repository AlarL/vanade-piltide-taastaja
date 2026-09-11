import React, { useState } from "react";
import {
  Sliders,
  RotateCcw,
  Copy,
  Check,
  X,
  FileCode,
  Lightbulb,
} from "lucide-react";
import { PROMPT_PRESETS, DEFAULT_RESTORATION_PROMPT } from "../restorationPrompt";

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
  onSavePrompt: (prompt: string) => void;
  onResetPrompt: () => void;
}

export const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  onClose,
  currentPrompt,
  onSavePrompt,
  onResetPrompt,
}) => {
  const [editedText, setEditedText] = useState(currentPrompt);
  const [copied, setCopied] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  // Sync if currentPrompt changes externally
  React.useEffect(() => {
    setEditedText(currentPrompt);
  }, [currentPrompt]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleApply = () => {
    onSavePrompt(editedText);
    setAppliedNotice(true);
    setTimeout(() => {
      setAppliedNotice(false);
      onClose();
    }, 900);
  };

  const handleSelectPreset = (promptStr: string) => {
    setEditedText(promptStr);
  };

  const isModified = editedText.trim() !== DEFAULT_RESTORATION_PROMPT.trim();

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-stone-900">
                  AI Süsteemiprompt (Testimine & Kohandamine)
                </h3>
                {isModified && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-100 text-teal-900 rounded-md border border-teal-300">
                    Kohandatud
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                Asub ka eraldi failis: <code className="bg-stone-200/70 px-1 py-0.2 rounded font-mono text-[10px]">/src/restorationPrompt.ts</code> ja <code className="bg-stone-200/70 px-1 py-0.2 rounded font-mono text-[10px]">/restorationPrompt.txt</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="px-6 pt-3 pb-2 bg-stone-50/70 border-b border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mr-1">
            Eelseadistused:
          </span>
          {PROMPT_PRESETS.map((preset) => {
            const isActive = editedText.trim() === preset.prompt.trim();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.prompt)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-white text-stone-700 border border-stone-200/80 hover:bg-stone-100/80"
                }`}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Editor Body */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-stone-400" />
              Mudelile edastatav juhendtekst
            </span>
            <div className="flex items-center gap-3">
              {editedText.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEditedText("")}
                  className="text-[11px] text-stone-500 hover:text-stone-900 underline"
                >
                  Puhasta väli
                </button>
              )}
              <span className="font-mono text-[11px] text-stone-400">
                {editedText.length} tähemärki
              </span>
            </div>
          </div>

          <textarea
            id="prompt-textarea"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onFocus={(e) => e.target.select()}
            rows={12}
            className="w-full font-mono text-xs leading-relaxed p-3.5 rounded-xl border border-stone-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-hidden bg-stone-50/40 text-stone-800 transition-all resize-y"
            placeholder="Kirjuta siia täpne juhend Gemini mudelile..."
          />

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Testimisnõuanne:</strong> Kui soovid katsetada tugevamat näodetailide esiletõstmist, konkreetsete riiete värvimist või kulumise silumist, muuda siin teksti ja vajuta <em>„Rakenda testimiseks“</em>. Seda prompti kasutatakse kohe järgmise foto taastamisel.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetPrompt();
                setEditedText(DEFAULT_RESTORATION_PROMPT);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Taasta vaikeväärtus</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-teal-700">Kopeeritud!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopeeri prompt</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
            >
              Sulge
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors"
            >
              {appliedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-200" />
                  <span>Rakendatud!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Rakenda testimiseks</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

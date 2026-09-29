"use client";

import { LANGUAGES } from "@/lib/i18n";
import { useFlow } from "@/lib/state";

/** Switches language without touching answers or the current step. */
export function LanguageToggle() {
  const { lang, setLang } = useFlow();
  return (
    <div className="flex rounded-full border border-line bg-white p-1 text-sm font-semibold" role="group" aria-label="Language">
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-w-11 rounded-full px-3 py-1.5 transition-colors ${
            lang === l ? "bg-navy-900 text-white" : "text-muted hover:text-navy-900"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

"use client";

import { createT, LANGUAGES } from "@/lib/i18n";
import { useFlow } from "@/lib/state";

export function LanguageScreen() {
  const { setLang } = useFlow();
  const labels = LANGUAGES.map((l) => ({ lang: l, t: createT(l) }));

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-12 text-center animate-enter">
      <p className="text-xs font-semibold tracking-[0.3em] text-accent-600">METRICA</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">HUMAN VALUE MAP</h1>
      <p className="mt-6 text-muted">{labels.map(({ t }) => t("language.prompt")).join(" · ")}</p>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        {labels.map(({ lang, t }) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLang(lang)}
            lang={lang}
            className="group flex min-h-24 flex-col items-center justify-center rounded-3xl border-2 border-transparent bg-white shadow-card transition-all hover:border-navy-900 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <span className="text-xl font-bold tracking-wider text-navy-900">{t("language.name")}</span>
            <span className="mt-1 text-sm font-medium text-muted">{lang.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

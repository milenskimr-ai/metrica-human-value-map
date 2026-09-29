"use client";

import type { JourneyMode } from "@/config/journey";
import type { JourneyStageResult } from "@/lib/engine";
import { useFlow } from "@/lib/state";
import { MODE_ICONS, MODE_STYLES } from "./icons";

const MODES: JourneyMode[] = ["automate", "ai_human", "human"];

export function Recommendations({ journey }: { journey: JourneyStageResult[] }) {
  const { t } = useFlow();
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{t("recommendations.title")}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {MODES.map((m) => {
          const Icon = MODE_ICONS[m];
          const yours = journey.filter((s) => s.mode === m && s.relevant);
          const dark = m === "human";
          return (
            <article
              key={m}
              className={`flex flex-col rounded-3xl p-6 shadow-card ${dark ? "bg-navy-900 text-white" : "bg-white"}`}
            >
              <span className={`grid size-11 place-items-center rounded-xl ${MODE_STYLES[m].dot}`}>
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <h3 className={`mt-4 text-sm font-bold tracking-[0.16em] ${dark ? "text-accent-400" : "text-accent-700"}`}>
                {t(`recommendations.${m}.title`)}
              </h3>
              <p className={`mt-2 leading-relaxed ${dark ? "text-white/85" : "text-navy-800"}`}>{t(`recommendations.${m}.text`)}</p>
              {yours.length > 0 && (
                <div className={`mt-auto pt-5 text-xs font-medium ${dark ? "text-white/60" : "text-muted"}`}>
                  {t("recommendations.forYou")}{" "}
                  <span className={`font-semibold ${dark ? "text-white" : "text-navy-900"}`}>
                    {yours.map((s) => t(`journey.stages.${s.stage}.name`)).join(" · ")}
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

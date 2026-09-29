"use client";

import type { JourneyMode } from "@/config/journey";
import type { JourneyStageResult } from "@/lib/engine";
import { useFlow } from "@/lib/state";
import { MODE_ICONS, MODE_STYLES, STAGE_ICONS } from "./icons";

const MODES: JourneyMode[] = ["automate", "ai_human", "human"];

export function JourneyMap({ stages }: { stages: JourneyStageResult[] }) {
  const { t } = useFlow();

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{t("journey.title")}</h2>
      <p className="mt-2 text-muted">{t("journey.subtitle")}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {MODES.map((m) => {
          const Icon = MODE_ICONS[m];
          return (
            <span key={m} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide ${MODE_STYLES[m].badge}`}>
              <Icon className="size-3.5" strokeWidth={2} />
              {t(`journey.modes.${m}`)}
            </span>
          );
        })}
      </div>

      {/* Mobile / tablet portrait: vertical timeline. Desktop: horizontal row. */}
      <ol className="relative mt-8 grid gap-3 lg:grid-cols-7 lg:gap-2">
        <span className="absolute top-6 bottom-6 left-[27px] w-px bg-line lg:top-[27px] lg:right-[7%] lg:bottom-auto lg:left-[7%] lg:h-px lg:w-auto" aria-hidden />
        {stages.map((s, i) => {
          const StageIcon = STAGE_ICONS[s.stage];
          const ModeIcon = MODE_ICONS[s.mode];
          const style = MODE_STYLES[s.mode];
          return (
            <li
              key={s.stage}
              className="relative flex items-center gap-4 animate-enter lg:flex-col lg:items-center lg:gap-3 lg:text-center"
              style={{ animationDelay: `${150 + i * 70}ms` }}
            >
              <span
                className={`relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl ${style.dot} ${
                  s.relevant ? "ring-4 ring-accent-400/40" : ""
                }`}
              >
                <StageIcon className="size-6" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1 lg:flex lg:flex-col lg:items-center">
                <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                  <span className="text-sm font-bold tracking-wider text-navy-900">{t(`journey.stages.${s.stage}.name`)}</span>
                </div>
                <p className="text-sm text-muted lg:mt-1 lg:min-h-10 lg:text-xs">{t(`journey.stages.${s.stage}.hint`)}</p>
                <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${style.badge}`}>
                  <ModeIcon className="size-3" strokeWidth={2.2} />
                  {t(`journey.modes.${s.mode}`)}
                </span>
                {s.relevant && (
                  <span className="mt-1.5 block text-[11px] font-semibold text-accent-700 lg:mt-2">● {t("journey.relevant")}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

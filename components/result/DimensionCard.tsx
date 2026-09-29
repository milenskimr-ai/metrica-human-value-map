"use client";

import type { Level } from "@/config/scoring";
import { explanationKeys, type DimensionResult } from "@/lib/engine";
import { useFlow } from "@/lib/state";
import { DIMENSION_ICONS } from "./icons";

const LEVELS: Level[] = ["low", "medium", "high"];

export function DimensionCard({ result, delay = 0 }: { result: DimensionResult; delay?: number }) {
  const { t, has } = useFlow();
  const Icon = DIMENSION_ICONS[result.dimension];
  const filled = LEVELS.indexOf(result.level) + 1;
  const reasons = explanationKeys(result, has);
  const key = `dimensions.${result.dimension}`;

  return (
    <article
      className="flex flex-col rounded-3xl bg-white p-6 shadow-card animate-enter sm:p-7"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-50 text-accent-600">
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        <h3 className="text-[13px] leading-tight font-semibold tracking-[0.12em] text-muted">{t(`${key}.name`)}</h3>
      </div>

      <p className="mt-6 text-4xl font-extrabold tracking-tight text-navy-900">{t(`${key}.levels.${result.level}`)}</p>

      <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden>
        {LEVELS.map((l, i) => (
          <span key={l} className={`h-2 rounded-full ${i < filled ? "bg-accent-500" : "bg-navy-100"}`} />
        ))}
      </div>

      <p className="mt-5 leading-relaxed font-medium text-navy-800">{t(`${key}.summary.${result.level}`)}</p>
      {reasons.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line pt-4">
          {reasons.map((r) => (
            <li key={r} className="flex gap-2.5 text-[15px] leading-relaxed text-muted">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent-500" />
              {t(r)}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

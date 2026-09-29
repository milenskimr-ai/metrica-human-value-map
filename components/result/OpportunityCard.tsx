"use client";

import { Target } from "lucide-react";
import type { OpportunityCategory } from "@/config/opportunity";
import { useFlow } from "@/lib/state";

export function OpportunityCard({ category }: { category: OpportunityCategory }) {
  const { t } = useFlow();
  return (
    <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 text-white shadow-lift sm:p-9 animate-enter">
      <span className="absolute -top-16 -right-16 size-48 rounded-full border-[28px] border-accent-500/15" aria-hidden />
      <div className="relative flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-accent-400">
        <Target className="size-4" />
        {t("opportunity.title")}
      </div>
      <h2 className="relative mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t(`opportunity.categories.${category}.name`)}
      </h2>
      <p className="relative mt-4 max-w-3xl text-lg leading-relaxed text-white/80">
        {t(`opportunity.categories.${category}.text`)}
      </p>
    </section>
  );
}

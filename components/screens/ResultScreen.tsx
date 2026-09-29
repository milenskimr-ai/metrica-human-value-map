"use client";

import { RotateCcw } from "lucide-react";
import { DIMENSIONS } from "@/config/scoring";
import { useFlow } from "@/lib/state";
import { DimensionCard } from "../result/DimensionCard";
import { JourneyMap } from "../result/JourneyMap";
import { LeadForm } from "../result/LeadForm";
import { OpportunityCard } from "../result/OpportunityCard";
import { Recommendations } from "../result/Recommendations";
import { Services } from "../result/Services";
import { Button } from "../ui/Button";

export function ResultScreen() {
  const { t, result, conferenceMode, resetForNextVisitor } = useFlow();
  if (!result) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-5 py-8 sm:space-y-14 sm:px-8 sm:py-12">
      <header className="animate-enter">
        <p className="text-xs font-semibold tracking-[0.28em] text-accent-600">{t("result.eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">{t("result.title")}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{t("result.intro")}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {DIMENSIONS.map((d, i) => (
          <DimensionCard key={d} result={result.dimensions[d]} delay={i * 90} />
        ))}
      </div>

      <JourneyMap stages={result.journey} />
      <OpportunityCard category={result.opportunity} />
      <Recommendations journey={result.journey} />
      <LeadForm />

      {conferenceMode && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={resetForNextVisitor}>
            <RotateCcw className="size-4" />
            {t("common.nextVisitor")}
          </Button>
        </div>
      )}

      <Services />
    </div>
  );
}

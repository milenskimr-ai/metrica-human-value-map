"use client";

import { ArrowRight } from "lucide-react";
import { useFlow } from "@/lib/state";
import { Button } from "../ui/Button";

export function WelcomeScreen() {
  const { t, start } = useFlow();
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-10 sm:px-8 sm:py-16 animate-enter">
      <p className="text-xs font-semibold tracking-[0.28em] text-accent-600">{t("welcome.title")}</p>
      <h1 className="mt-4 text-[2.6rem] leading-[1.02] font-extrabold tracking-tight text-navy-900 sm:text-6xl">
        {t("welcome.tagline")}
      </h1>
      <p className="mt-5 text-xl font-medium text-navy-700 sm:text-2xl">
        {t("welcome.subline1")}
        <br />
        <span className="text-accent-600">{t("welcome.subline2")}</span>
      </p>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-semibold text-navy-900 sm:text-xl">{t("welcome.question")}</h2>
        <p className="mt-3 leading-relaxed text-muted">{t("welcome.intro")}</p>
        <p className="mt-5 text-sm font-semibold tracking-wide text-accent-700">{t("welcome.facts")}</p>
      </div>

      <Button onClick={start} className="mt-8 w-full sm:w-auto sm:self-start">
        {t("welcome.start")}
        <ArrowRight className="size-5" />
      </Button>
    </section>
  );
}

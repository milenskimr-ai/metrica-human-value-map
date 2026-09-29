"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useFlow } from "@/lib/state";
import { Button } from "../ui/Button";

export function InsightScreen() {
  const { t, showResult, back } = useFlow();
  return (
    <section className="flex flex-1 flex-col bg-navy-900 text-white animate-enter">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-12 sm:px-8">
        <span className="h-1 w-12 rounded-full bg-accent-400" />
        <p className="mt-8 text-2xl leading-snug font-semibold sm:text-3xl">{t("insight.text1")}</p>
        <p className="mt-6 text-xl leading-snug text-accent-400 sm:text-2xl">{t("insight.text2")}</p>
        <div className="mt-12 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" onClick={back} className="px-3 text-white/60 hover:text-white">
            <ArrowLeft className="size-5" />
            {t("common.back")}
          </Button>
          <Button onClick={showResult} className="bg-accent-500 text-navy-950 hover:bg-accent-400 active:bg-accent-600 sm:ml-auto">
            {t("insight.cta")}
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

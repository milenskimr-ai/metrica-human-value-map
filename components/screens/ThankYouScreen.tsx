"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { useFlow } from "@/lib/state";
import { Button, buttonClass } from "../ui/Button";

export function ThankYouScreen() {
  const { t, conferenceMode, resetForNextVisitor, goTo } = useFlow();

  return (
    <section className="flex flex-1 flex-col bg-navy-900 text-white animate-enter">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-14 text-center sm:px-8">
        <CheckCircle2 className="size-14 text-accent-400" strokeWidth={1.5} />
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">{t("thankYou.title")}</h1>
        <p className="mt-5 text-xl leading-snug text-white/80">
          {conferenceMode ? t("thankYou.conferenceText") : t("thankYou.text")}
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto">
          {conferenceMode ? (
            <Button variant="accent" onClick={resetForNextVisitor} className="min-h-16 px-10 text-lg">
              <RotateCcw className="size-5" />
              {t("common.nextVisitor")}
            </Button>
          ) : (
            <a
              href={APP_CONFIG.contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("accent")}
            >
              {t("thankYou.talkToMetrica")}
              <ArrowRight className="size-5" />
            </a>
          )}
          <Button variant="ghost" onClick={() => goTo("result")} className="text-white/60 hover:text-white">
            <ArrowLeft className="size-4" />
            {t("thankYou.backToResult")}
          </Button>
        </div>
      </div>
    </section>
  );
}

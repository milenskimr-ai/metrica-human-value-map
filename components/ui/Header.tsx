"use client";

import { useFlow } from "@/lib/state";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
  const { state, conferenceMode, t } = useFlow();
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          {conferenceMode && state.lang && (
            <span className="hidden rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700 sm:inline">
              {t("common.conferenceMode")}
            </span>
          )}
          {state.lang && <LanguageToggle />}
        </div>
      </div>
    </header>
  );
}

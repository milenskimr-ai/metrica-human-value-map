"use client";

import { useEffect, useRef, useState } from "react";
import { Hand } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { useFlow } from "@/lib/state";
import { Button } from "./ui/Button";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;

/**
 * Conference mode only. After `idleTimeoutSeconds` without interaction, shows a
 * "Still there?" warning; if nobody reacts within `idleWarningSeconds`, resets the
 * session for the next visitor (saved records are not touched).
 */
export function IdleGuard() {
  const { t, resetForNextVisitor } = useFlow();
  const lastActivity = useRef(Date.now());
  const overlay = useRef<HTMLDivElement>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const keepGoing = () => {
    lastActivity.current = Date.now();
    setSecondsLeft(null);
  };

  useEffect(() => {
    const onActivity = (e: Event) => {
      // Taps on the warning itself are handled by its onClick, so the same tap
      // can't fall through and select an answer underneath.
      if (overlay.current?.contains(e.target as Node)) return;
      lastActivity.current = Date.now();
      setSecondsLeft(null);
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }));

    const timer = setInterval(() => {
      const idle = (Date.now() - lastActivity.current) / 1000;
      const { idleTimeoutSeconds: timeout, idleWarningSeconds: warning } = APP_CONFIG;
      if (idle >= timeout + warning) resetForNextVisitor();
      else if (idle >= timeout) setSecondsLeft(Math.ceil(timeout + warning - idle));
    }, 250);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }));
      clearInterval(timer);
    };
  }, [resetForNextVisitor]);

  if (secondsLeft === null) return null;

  return (
    <div ref={overlay} onClick={keepGoing}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 px-5 backdrop-blur-sm animate-enter">
      <div role="alertdialog" aria-modal="true" aria-labelledby="idle-title"
        className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lift">
        <Hand className="mx-auto size-10 text-accent-600" strokeWidth={1.6} />
        <h2 id="idle-title" className="mt-4 text-3xl font-extrabold tracking-tight text-navy-900">{t("idle.title")}</h2>
        <p className="mt-3 text-lg text-muted" aria-live="polite">{t("idle.text", { seconds: secondsLeft })}</p>
        <Button className="mt-8 w-full" autoFocus>{t("idle.continue")}</Button>
      </div>
    </div>
  );
}

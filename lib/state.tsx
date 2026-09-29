"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { APP_CONFIG } from "@/config/app";
import { QUESTIONS, type Answers, type QuestionId } from "@/config/questions";
import { computeResult, type DiagnosticResult } from "./engine";
import { createT, hasKey, LANGUAGES, type Lang, type Translate } from "./i18n";
import { saveCompletedTest, saveLead, type LeadPayload } from "./persistence";

export type Screen = "language" | "welcome" | "question" | "insight" | "result" | "thanks";

interface FlowState {
  sessionId: string;
  lang: Lang | null;
  screen: Screen;
  questionIndex: number;
  answers: Answers;
  completedAt: string | null;
  leadSubmitted: boolean;
}

const FLOW_KEY = "mhvm:flow:v1";
const CONFERENCE_KEY = "mhvm:conference";

const newSessionId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const freshState = (): FlowState => ({
  sessionId: newSessionId(),
  lang: null,
  screen: "language",
  questionIndex: 0,
  answers: {},
  completedAt: null,
  leadSubmitted: false,
});

type LeadInput = Omit<LeadPayload, "sessionId" | "language" | "conferenceMode" | "answers" | "consent">;

interface FlowContextValue {
  state: FlowState;
  lang: Lang;
  t: Translate;
  has: (key: string) => boolean;
  conferenceMode: boolean;
  result: DiagnosticResult | null;
  setLang: (lang: Lang) => void;
  start: () => void;
  setAnswer: (questionId: QuestionId, answerIds: string[]) => void;
  next: () => void;
  back: () => void;
  showResult: () => void;
  submitLead: (lead: LeadInput) => Promise<void>;
  goTo: (screen: Screen) => void;
  resetForNextVisitor: () => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowState | null>(null);
  const [conferenceMode, setConferenceMode] = useState<boolean>(APP_CONFIG.conferenceModeDefault);

  // Hydrate from sessionStorage (survives refresh, cleared when the browser session ends).
  useEffect(() => {
    let restored: FlowState | null = null;
    try {
      const raw = sessionStorage.getItem(FLOW_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FlowState;
        if (parsed.lang === null || LANGUAGES.includes(parsed.lang)) restored = parsed;
      }
    } catch {}
    setState(restored ?? freshState());

    // Conference mode: ?conference=1 / ?conference=0 is remembered on this device.
    try {
      const param = new URLSearchParams(window.location.search).get("conference");
      if (param === "1" || param === "0") localStorage.setItem(CONFERENCE_KEY, param);
      const stored = localStorage.getItem(CONFERENCE_KEY);
      if (stored === "1" || stored === "0") setConferenceMode(stored === "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      sessionStorage.setItem(FLOW_KEY, JSON.stringify(state));
    } catch {}
    if (state.lang) document.documentElement.lang = state.lang;
  }, [state]);

  const update = useCallback((fn: (s: FlowState) => FlowState) => {
    setState((s) => (s ? fn(s) : s));
  }, []);

  const lang: Lang = state?.lang ?? "en";
  const t = useMemo(() => createT(lang), [lang]);
  const has = useCallback((key: string) => hasKey(lang, key), [lang]);

  const result = useMemo(
    () => (state && (state.screen === "result" || state.screen === "thanks") ? computeResult(state.answers) : null),
    [state],
  );

  const value = useMemo<FlowContextValue | null>(() => {
    if (!state) return null;
    return {
      state,
      lang,
      t,
      has,
      conferenceMode,
      result,
      setLang: (l) =>
        update((s) => ({ ...s, lang: l, screen: s.screen === "language" ? "welcome" : s.screen })),
      start: () => update((s) => ({ ...s, screen: "question", questionIndex: 0 })),
      setAnswer: (questionId, answerIds) =>
        update((s) => ({ ...s, answers: { ...s.answers, [questionId]: answerIds } })),
      next: () =>
        update((s) => {
          const q = QUESTIONS[s.questionIndex];
          if ("insightAfter" in q && q.insightAfter) return { ...s, screen: "insight" };
          if (s.questionIndex < QUESTIONS.length - 1) return { ...s, questionIndex: s.questionIndex + 1 };
          return { ...s, screen: "insight" };
        }),
      back: () =>
        update((s) => {
          if (s.screen === "insight") return { ...s, screen: "question", questionIndex: QUESTIONS.length - 1 };
          if (s.screen === "question" && s.questionIndex > 0) return { ...s, questionIndex: s.questionIndex - 1 };
          if (s.screen === "question") return { ...s, screen: "welcome" };
          return s;
        }),
      showResult: () => {
        const completedAt = state.completedAt ?? new Date().toISOString();
        if (!state.completedAt && state.lang) {
          void saveCompletedTest({
            sessionId: state.sessionId,
            language: state.lang,
            conferenceMode,
            answers: state.answers,
          });
        }
        update((s) => ({ ...s, screen: "result", completedAt }));
        window.scrollTo({ top: 0 });
      },
      submitLead: async (lead) => {
        await saveLead({
          ...lead,
          sessionId: state.sessionId,
          language: lang,
          conferenceMode,
          answers: state.answers,
          consent: true, // the form only calls this when the box is ticked; consent time + text are set on the server
        });
        update((s) => ({ ...s, leadSubmitted: true, screen: "thanks" }));
        window.scrollTo({ top: 0 });
      },
      goTo: (screen) => {
        update((s) => ({ ...s, screen }));
        window.scrollTo({ top: 0 });
      },
      resetForNextVisitor: () => {
        // Clears local answers + contact data and starts a new session. Saved records are untouched.
        try {
          sessionStorage.removeItem(FLOW_KEY);
        } catch {}
        setState(freshState());
        window.scrollTo({ top: 0 });
      },
    };
  }, [state, lang, t, has, conferenceMode, result, update]);

  if (!value) return null; // brief moment before sessionStorage is read — avoids a flash of the wrong screen
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used inside FlowProvider");
  return ctx;
}

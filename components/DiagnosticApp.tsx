"use client";

import { FlowProvider, useFlow } from "@/lib/state";
import { Header } from "./ui/Header";
import { LanguageScreen } from "./screens/LanguageScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { QuestionScreen } from "./screens/QuestionScreen";
import { InsightScreen } from "./screens/InsightScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { ThankYouScreen } from "./screens/ThankYouScreen";

export function DiagnosticApp() {
  return (
    <FlowProvider>
      <Shell />
    </FlowProvider>
  );
}

function Shell() {
  const { state } = useFlow();
  const screens = {
    language: <LanguageScreen />,
    welcome: <WelcomeScreen />,
    question: <QuestionScreen />,
    insight: <InsightScreen />,
    result: <ResultScreen />,
    thanks: <ThankYouScreen />,
  };
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col">{screens[state.screen]}</main>
    </div>
  );
}

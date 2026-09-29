"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { QUESTIONS, TOTAL_QUESTIONS } from "@/config/questions";
import { useFlow } from "@/lib/state";
import { AnswerCard } from "../ui/AnswerCard";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";

const AUTO_ADVANCE_MS = 280;

export function QuestionScreen() {
  const { state, t, setAnswer, next, back } = useFlow();
  const question = QUESTIONS[state.questionIndex];
  const selected = state.answers[question.id] ?? [];
  const multi = question.type === "multi";
  const max = "maxSelections" in question ? question.maxSelections : undefined;
  const scenario = "variant" in question && question.variant === "scenario";
  const hasLead = scenario; // only the scenario question has a lead-in sentence
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, [state.questionIndex]);

  const toggle = (answerId: string) => {
    if (!multi) {
      setAnswer(question.id, [answerId]);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(next, AUTO_ADVANCE_MS);
      return;
    }
    const isOn = selected.includes(answerId);
    if (isOn) setAnswer(question.id, selected.filter((a) => a !== answerId));
    else if (!max || selected.length < max) setAnswer(question.id, [...selected, answerId]);
  };

  return (
    <section
      key={question.id}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-6 pb-8 sm:px-8 sm:pt-10 animate-enter"
    >
      <ProgressBar
        current={state.questionIndex + 1}
        total={TOTAL_QUESTIONS}
        label={t("common.questionOf", { current: state.questionIndex + 1, total: TOTAL_QUESTIONS })}
      />

      <div className="mt-8 sm:mt-10">
        {hasLead && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-navy-900 p-5 text-white">
            <Clock className="mt-0.5 size-6 shrink-0 text-accent-400" />
            <p className="text-lg leading-snug font-medium">{t(`questions.${question.id}.lead`)}</p>
          </div>
        )}
        <h1 className="text-2xl leading-tight font-bold tracking-tight text-navy-900 sm:text-3xl">
          {t(`questions.${question.id}.title`)}
        </h1>
        {multi && (
          <p className="mt-2 text-sm font-medium text-accent-700">
            {max ? t("common.selectUpTo", { max }) : t("common.selectAll")}
            {max ? ` · ${selected.length}/${max}` : ""}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-3" role={multi ? "group" : "radiogroup"}>
        {question.answers.map((answerId) => {
          const isOn = selected.includes(answerId);
          return (
            <AnswerCard
              key={answerId}
              label={t(`questions.${question.id}.answers.${answerId}`)}
              selected={isOn}
              multi={multi}
              large={scenario}
              disabled={multi && !!max && !isOn && selected.length >= max}
              onClick={() => toggle(answerId)}
            />
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-3 bg-gradient-to-t from-canvas via-canvas to-canvas/0 pt-8 pb-2">
        <Button variant="ghost" onClick={back} className="px-3">
          <ArrowLeft className="size-5" />
          {t("common.back")}
        </Button>
        {(multi || selected.length > 0) && (
          <Button onClick={next} disabled={selected.length === 0} className="flex-1 sm:flex-none">
            {t("common.continue")}
            <ArrowRight className="size-5" />
          </Button>
        )}
      </div>
    </section>
  );
}

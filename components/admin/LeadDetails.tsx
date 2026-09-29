"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { QUESTIONS } from "@/config/questions";
import type { AdminRow } from "@/lib/admin/types";
import { adminT as t, challengeName, formatDate, fullName, levelName, opportunityName } from "@/lib/admin/format";

export function LeadDetails({ row: r, onClose }: { row: AdminRow; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy-950/40" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Test details" onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-lift animate-enter sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-900">{fullName(r) || "Anonymous test"}</h2>
            <p className="text-sm text-muted">{r.company ?? ""}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-muted hover:bg-canvas">
            <X className="size-5" />
          </button>
        </div>

        <Section title="Contact">
          <Field k="Email" v={r.email} />
          <Field k="Phone" v={r.phone} />
          <Field k="Website" v={r.website} />
          <Field k="Lead submitted" v={formatDate(r.lead_submitted_at)} />
        </Section>

        <Section title="Result">
          <Field k="Automation" v={`${levelName(r.automation_level)} · ${r.automation_score}`} />
          <Field k="Human Value" v={`${levelName(r.human_value_level)} · ${r.human_value_score}`} />
          <Field k="CX Maturity" v={`${levelName(r.cx_maturity_level)} · ${r.cx_maturity_score}`} />
          <Field k="Biggest opportunity" v={opportunityName(r.biggest_opportunity)} />
          <Field k="Biggest challenge" v={challengeName(r.biggest_challenge)} />
        </Section>

        <Section title="Answers">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="py-2">
              <div className="text-xs text-muted">{t(`questions.${q.id}.title`)}</div>
              <div className="font-medium text-navy-900">
                {(r.answers[q.id] ?? []).map((a) => t(`questions.${q.id}.answers.${a}`)).join(" · ") || "—"}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Session & consent">
          <Field k="Completed" v={formatDate(r.completed_at)} />
          <Field k="Language" v={r.language.toUpperCase()} />
          <Field k="Source" v={r.conference_mode ? "Conference mode" : "Online"} />
          <Field k="Consent" v={r.consent_given ? `Yes · ${formatDate(r.consent_at)} · ${r.consent_version}` : "No"} />
          {r.consent_text && <p className="py-2 text-sm text-muted italic">“{r.consent_text}”</p>}
          <Field k="Scoring version" v={r.scoring_version} />
          <Field k="Session ID" v={r.id} />
        </Section>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 border-t border-line pt-4">
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-accent-700 uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted">{k}</span>
      <span className="text-right font-medium break-all text-navy-900">{v || "—"}</span>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Download, LogOut, RefreshCw, Search } from "lucide-react";
import { QUESTIONS } from "@/config/questions";
import { TIE_BREAK_ORDER } from "@/config/opportunity";
import type { Level } from "@/config/scoring";
import { toCsv } from "@/lib/admin/csv";
import type { AdminRow } from "@/lib/admin/types";
import { challengeName, dayKey, formatDate, fullName, levelName, opportunityName } from "@/lib/admin/format";
import { Logo } from "../ui/Logo";
import { LeadDetails } from "./LeadDetails";

type Period = "all" | "today" | "7d" | "30d";
type Source = "all" | "conference" | "online";

const CHALLENGES = QUESTIONS.find((q) => q.id === "biggest_challenge")!.answers;

export function AdminDashboard({ rows, onRefresh, onLogout }: { rows: AdminRow[]; onRefresh: () => void; onLogout: () => void }) {
  const [period, setPeriod] = useState<Period>("all");
  const [language, setLanguage] = useState<"all" | "bg" | "en">("all");
  const [source, setSource] = useState<Source>("all");
  const [view, setView] = useState<"leads" | "all">("leads");
  const [query, setQuery] = useState("");
  const [opportunity, setOpportunity] = useState("all");
  const [challenge, setChallenge] = useState("all");
  const [selected, setSelected] = useState<AdminRow | null>(null);

  // Segment = period + language + source. Stats are computed on the segment.
  const segment = useMemo(() => {
    const now = Date.now();
    const today = dayKey(now);
    const minTime = period === "7d" ? now - 7 * 864e5 : period === "30d" ? now - 30 * 864e5 : 0;
    return rows.filter(
      (r) =>
        (period === "all" || (period === "today" ? dayKey(r.completed_at) === today : Date.parse(r.completed_at) >= minTime)) &&
        (language === "all" || r.language === language) &&
        (source === "all" || r.conference_mode === (source === "conference")),
    );
  }, [rows, period, language, source]);

  const stats = useMemo(() => {
    const n = segment.length;
    const leads = segment.filter((r) => r.email).length;
    const avg = (k: "automation_score" | "human_value_score" | "cx_maturity_score") =>
      n ? Math.round(segment.reduce((s, r) => s + r[k], 0) / n) : null;
    return {
      tests: n,
      leads,
      conversion: n ? Math.round((leads / n) * 1000) / 10 : null,
      automation: avg("automation_score"),
      human: avg("human_value_score"),
      cx: avg("cx_maturity_score"),
    };
  }, [segment]);

  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return segment.filter(
      (r) =>
        (view === "all" || r.email) &&
        (opportunity === "all" || r.biggest_opportunity === opportunity) &&
        (challenge === "all" || r.biggest_challenge === challenge) &&
        (!q || [fullName(r), r.company, r.email, r.website, r.phone].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [segment, view, opportunity, challenge, query]);

  const exportCsv = () => {
    const header = [
      "completed_at", "lead_submitted_at", "language", "source", "first_name", "last_name", "company", "email", "phone", "website",
      "automation_score", "automation_level", "human_value_score", "human_value_level", "cx_maturity_score", "cx_maturity_level",
      "biggest_opportunity", "biggest_challenge",
      ...QUESTIONS.map((q) => `answer_${q.id}`),
      "consent_given", "consent_at", "consent_version", "scoring_version", "session_id",
    ];
    const body = tableRows.map((r) => [
      r.completed_at, r.lead_submitted_at, r.language, r.conference_mode ? "conference" : "online",
      r.first_name, r.last_name, r.company, r.email, r.phone, r.website,
      r.automation_score, r.automation_level, r.human_value_score, r.human_value_level, r.cx_maturity_score, r.cx_maturity_level,
      r.biggest_opportunity, r.biggest_challenge,
      ...QUESTIONS.map((q) => (r.answers[q.id] ?? []).join("|")),
      r.consent_given, r.consent_at, r.consent_version, r.scoring_version, r.id,
    ]);
    const blob = new Blob([toCsv(header, body)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `metrica-human-value-map-${view}-${dayKey(Date.now())}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const leadCount = segment.filter((r) => r.email).length;

  return (
    <div className="pb-16">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700">Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <IconButton onClick={onRefresh} label="Refresh">
              <RefreshCw className="size-4" />
            </IconButton>
            <IconButton onClick={onLogout} label="Sign out">
              <LogOut className="size-4" />
            </IconButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 pt-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Select label="Period" value={period} onChange={(v) => setPeriod(v as Period)}
            options={[["all", "All time"], ["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"]]} />
          <Select label="Language" value={language} onChange={(v) => setLanguage(v as "all" | "bg" | "en")}
            options={[["all", "All languages"], ["bg", "Bulgarian"], ["en", "English"]]} />
          <Select label="Source" value={source} onChange={(v) => setSource(v as Source)}
            options={[["all", "All sources"], ["conference", "Conference mode"], ["online", "Online"]]} />
        </div>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Statistics">
          <Stat label="Completed tests" value={stats.tests} />
          <Stat label="Leads" value={stats.leads} />
          <Stat label="Lead conversion" value={stats.conversion} unit="%" />
          <Stat label="Avg. Automation" value={stats.automation} unit="/100" />
          <Stat label="Avg. Human Value" value={stats.human} unit="/100" />
          <Stat label="Avg. CX Maturity" value={stats.cx} unit="/100" />
        </section>

        <section className="rounded-3xl bg-white shadow-card">
          <div className="flex flex-col gap-4 border-b border-line p-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex shrink-0 self-start rounded-full bg-canvas p-1 text-sm font-semibold whitespace-nowrap" role="tablist">
              {(
                [
                  ["leads", `Leads (${leadCount})`],
                  ["all", `All tests (${segment.length})`],
                ] as const
              ).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
                  className={`rounded-full px-4 py-2 ${view === id ? "bg-navy-900 text-white" : "text-muted hover:text-navy-900"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative w-full sm:w-auto">
                <span className="sr-only">Search</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, company, email…"
                  className="h-10 w-full rounded-xl sm:w-60 border border-line pr-3 pl-9 text-sm outline-none focus:border-accent-500" />
              </label>
              <Select label="Opportunity" value={opportunity} onChange={setOpportunity}
                options={[["all", "All opportunities"], ...TIE_BREAK_ORDER.map((o) => [o, opportunityName(o)] as [string, string])]} />
              <Select label="Challenge" value={challenge} onChange={setChallenge}
                options={[["all", "All challenges"], ...CHALLENGES.map((c) => [c, challengeName(c)] as [string, string])]} />
              <button onClick={exportCsv} disabled={tableRows.length === 0}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40">
                <Download className="size-4" /> Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="text-xs tracking-wide text-muted uppercase">
                <tr className="border-b border-line">
                  {["Date", "Lang", "Name", "Company", "Email", "Phone", "Website", "Automation", "Human Value", "CX Maturity", "Biggest opportunity", "Biggest challenge"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.id} onClick={() => setSelected(r)}
                    className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-canvas">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="text-left font-medium text-navy-900 hover:underline" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
                        {formatDate(r.completed_at)}
                      </button>
                    </td>
                    <td className="px-4 py-3 uppercase">{r.language}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fullName(r) || <Muted />}</td>
                    <td className="px-4 py-3">{r.company || <Muted />}</td>
                    <td className="px-4 py-3">{r.email || <Muted />}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.phone || <Muted />}</td>
                    <td className="px-4 py-3">{r.website || <Muted />}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><Score level={r.automation_level} score={r.automation_score} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><Score level={r.human_value_level} score={r.human_value_score} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><Score level={r.cx_maturity_level} score={r.cx_maturity_score} /></td>
                    <td className="px-4 py-3">{opportunityName(r.biggest_opportunity)}</td>
                    <td className="px-4 py-3">{challengeName(r.biggest_challenge)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tableRows.length === 0 && <p className="px-5 py-12 text-center text-muted">No results for these filters.</p>}
          </div>
        </section>
      </main>

      {selected && <LeadDetails row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</div>
      <div className="mt-2 text-3xl font-bold text-navy-900 tabular-nums">
        {value === null ? "—" : value.toLocaleString("en-GB")}
        {value !== null && unit && <span className="ml-0.5 text-base font-medium text-muted">{unit}</span>}
      </div>
    </div>
  );
}

function Score({ level, score }: { level: Level; score: number }) {
  return (
    <span className="font-medium text-navy-900">
      {levelName(level)} <span className="text-muted tabular-nums">· {score}</span>
    </span>
  );
}

const Muted = () => <span className="text-muted/60">—</span>;

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <label className="min-w-0 max-w-full">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full max-w-full truncate rounded-xl border border-line bg-white px-3 text-sm text-navy-900 outline-none focus:border-accent-500 sm:w-auto sm:max-w-56">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function IconButton({ label, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" title={label} aria-label={label} {...props}
      className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted hover:bg-canvas hover:text-navy-900">
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

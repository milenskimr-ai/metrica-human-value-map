export function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-muted">{label}</div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div className="h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

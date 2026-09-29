/**
 * Placeholder wordmark. Replace with the official Metrica logo
 * (e.g. <Image src="/brand/metrica-logo.svg" … />) once provided.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`} aria-label="Metrica">
      <span className="grid size-7 place-items-center rounded-lg bg-navy-900">
        <span className="size-2.5 rounded-full bg-accent-400" />
      </span>
      <span className="text-[17px] font-bold tracking-[0.18em] text-navy-900">METRICA</span>
    </span>
  );
}

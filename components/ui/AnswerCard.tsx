import { Check } from "lucide-react";

interface Props {
  label: string;
  selected: boolean;
  multi: boolean;
  disabled?: boolean;
  large?: boolean;
  onClick: () => void;
}

export function AnswerCard({ label, selected, multi, disabled, large, onClick }: Props) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border-2 bg-white text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
        large ? "min-h-20 px-5 py-5 text-[17px] sm:text-lg" : "min-h-16 px-5 py-4 text-base sm:text-[17px]"
      } ${
        selected
          ? "border-navy-900 shadow-lift"
          : "border-transparent shadow-card hover:border-navy-100 hover:shadow-lift disabled:opacity-45 disabled:hover:border-transparent disabled:hover:shadow-card"
      }`}
    >
      <span
        className={`grid size-6 shrink-0 place-items-center border-2 transition-colors ${multi ? "rounded-md" : "rounded-full"} ${
          selected ? "border-accent-500 bg-accent-500 text-white" : "border-navy-100 bg-white text-transparent"
        }`}
        aria-hidden
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      <span className={`font-medium leading-snug ${selected ? "text-navy-900" : "text-navy-800"}`}>{label}</span>
    </button>
  );
}

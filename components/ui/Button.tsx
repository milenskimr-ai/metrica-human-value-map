import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-navy-900 text-white shadow-card hover:bg-navy-800 active:bg-navy-950 disabled:bg-navy-100 disabled:text-muted disabled:shadow-none",
  /** Teal call-to-action for dark (navy) backgrounds */
  accent: "bg-accent-500 text-navy-950 shadow-card hover:bg-accent-400 active:bg-accent-600 disabled:opacity-50",
  secondary: "border border-line bg-white text-navy-900 hover:border-navy-700 disabled:opacity-50",
  ghost: "text-muted hover:text-navy-900 disabled:opacity-40",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl px-7 text-[15px] font-semibold tracking-wide transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}

export const buttonClass = (variant: Variant = "primary", extra = "") =>
  `inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl px-7 text-[15px] font-semibold tracking-wide transition-all duration-200 ${styles[variant]} ${extra}`;

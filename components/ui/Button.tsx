import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "quiet" | "paper";

const styles: Record<Variant, string> = {
  primary:
    "bg-signal text-white hover:bg-signal-hi active:translate-y-px shadow-[0_10px_30px_-12px_rgb(229_56_44/0.8)] disabled:bg-ink-3 disabled:text-dim disabled:shadow-none",
  ghost: "border border-line-strong text-cream hover:border-cream/50 hover:bg-white/[0.03] disabled:text-dim disabled:border-line",
  quiet: "text-muted hover:text-cream disabled:text-dim",
  paper: "bg-paper text-paper-ink hover:bg-white active:translate-y-px disabled:opacity-50",
};

export function Button({
  variant = "primary",
  size = "md",
  busy,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  busy?: boolean;
  children: ReactNode;
}) {
  const sizing =
    size === "lg"
      ? "h-14 px-7 text-[26px]"
      : size === "sm"
        ? "h-9 px-3.5 text-[17px]"
        : "h-12 px-5 text-[21px]";
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex select-none items-center whitespace-nowrap justify-center gap-2 rounded-md font-display font-bold uppercase leading-none tracking-[0.02em] transition-[background,color,border-color,transform,box-shadow] duration-150 disabled:cursor-not-allowed ${sizing} ${styles[variant]} ${className}`}
    >
      {busy ? <span className="dots">{children}</span> : children}
    </button>
  );
}

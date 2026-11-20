import type { InputHTMLAttributes } from "react";

export function Field({ label, className = "", ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label mb-2 block">{label}</span>
      <input
        {...rest}
        className="h-12 w-full rounded-md border border-line-strong bg-ink-1/80 px-4 text-[16px] text-cream placeholder:text-dim transition focus:border-amber/70 focus:bg-ink-1 focus:outline-none"
      />
    </label>
  );
}

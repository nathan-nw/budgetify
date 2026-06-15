import type { ReactNode } from "react";

// Wealthsimple-calm surface: near-white card on the cream page, rounded with a
// single hairline border (no shadow), airy padding.
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

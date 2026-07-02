"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  icon,
  children,
  iconOnly = false,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  iconOnly?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      aria-label={typeof children === "string" ? children : undefined}
      className={`flex items-center justify-center rounded-full px-2.5 py-1.5 text-sm transition-colors sm:px-3 ${
        active ? "bg-card text-text" : "text-muted hover:text-text"
      }`}
    >
      {iconOnly ? (
        // Icon at every breakpoint (used for the settings gear).
        icon
      ) : (
        <>
          {/* Icon on mobile, text label from sm up. */}
          <span className="sm:hidden">{icon}</span>
          <span className="hidden sm:inline">{children}</span>
        </>
      )}
    </Link>
  );
}

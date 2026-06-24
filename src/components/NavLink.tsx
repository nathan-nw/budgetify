"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`rounded-full px-2.5 py-1.5 text-sm transition-colors sm:px-3 ${
        active ? "bg-card text-text" : "text-muted hover:text-text"
      }`}
    >
      {children}
    </Link>
  );
}

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SignOutButton } from "./SignOutButton";
import { NavLink } from "./NavLink";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-page/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Budgetify
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/categories">Categories</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

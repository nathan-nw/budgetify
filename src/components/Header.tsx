import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SignOutButton } from "./SignOutButton";
import { NavLink } from "./NavLink";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-page/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight"
          >
            Budgetify
          </Link>
          <nav className="flex items-center">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/categories">Categories</NavLink>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

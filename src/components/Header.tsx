import Link from "next/link";
import { ArrowLeftRight, LayoutDashboard, Settings, Tags } from "lucide-react";
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
          <nav className="flex items-center gap-0.5 sm:gap-0">
            <NavLink href="/" icon={<LayoutDashboard size={18} />}>
              Dashboard
            </NavLink>
            <NavLink href="/transactions" icon={<ArrowLeftRight size={18} />}>
              Transactions
            </NavLink>
            <NavLink href="/categories" icon={<Tags size={18} />}>
              Categories
            </NavLink>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NavLink href="/settings" icon={<Settings size={18} />} iconOnly>
            Settings
          </NavLink>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

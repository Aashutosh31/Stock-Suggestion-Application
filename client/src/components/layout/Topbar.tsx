import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarketStatusPill } from "@/components/layout/MarketStatusPill";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Topbar({
  onOpenSidebar,
  onOpenCommand,
}: {
  onOpenSidebar: () => void;
  onOpenCommand: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line px-3 sm:px-5 transition-colors",
        scrolled ? "bg-bg/85 backdrop-blur-md" : "bg-bg",
      )}
    >
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar} aria-label="Open navigation">
        <Menu />
      </Button>

      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <span className="font-display text-sm font-semibold text-ink">Nivesh</span>
      </Link>

      <button
        type="button"
        onClick={onOpenCommand}
        className="group flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-line bg-surface-2 px-3 text-sm text-subtle transition-colors hover:border-line-strong hover:text-muted"
      >
        <Search className="size-4" />
        <span className="truncate">Search stocks, screens, actions…</span>
        <kbd className="ml-auto hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-subtle sm:block">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <MarketStatusPill className="hidden xl:flex" />
        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}

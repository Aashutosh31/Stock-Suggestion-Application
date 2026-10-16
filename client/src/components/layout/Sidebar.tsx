import { NavLink } from "react-router-dom";
import { ChevronsLeft, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/config/navigation";
import { useUiStore } from "@/stores/uiStore";
import { useCurrentUser } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MarketStatusPill } from "@/components/layout/MarketStatusPill";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const user = useCurrentUser();
  const { data: notifications } = useNotifications();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || user?.role === "admin"),
  })).filter((g) => g.items.length > 0);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-line bg-bg-elevated transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
          <TrendingUp className="size-4.5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold leading-tight text-ink">Nivesh Terminal</p>
            <p className="truncate text-[10px] uppercase tracking-wider text-subtle">Research Console</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.title} className="mb-3">
            {!collapsed ? (
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-subtle">{group.title}</p>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const unread = item.badge === "notifications" ? notifications?.unread ?? 0 : 0;
                const link = (
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-brand-soft text-brand"
                          : "text-muted hover:bg-surface-2 hover:text-ink",
                        collapsed && "justify-center px-0",
                      )
                    }
                  >
                    <Icon className="size-4.5 shrink-0" />
                    {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                    {unread > 0 ? (
                      <span className={cn("flex h-4 min-w-4 items-center justify-center rounded-full bg-down px-1 text-[10px] font-semibold text-white", collapsed && "absolute right-1.5 top-1.5 size-2 min-w-0 p-0")}>
                        {collapsed ? "" : unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                  </NavLink>
                );
                return (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-line p-3">
        {!collapsed ? <MarketStatusPill /> : null}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={toggle}
          className={cn("w-full", collapsed && "mx-auto")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft className={cn("transition-transform", collapsed && "rotate-180")} />
          {!collapsed ? "Collapse" : null}
        </Button>
      </div>
    </aside>
  );
}

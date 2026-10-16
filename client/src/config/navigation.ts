import {
  Activity,
  Bell,
  Bookmark,
  Briefcase,
  Calculator,
  Compass,
  Gauge,
  GitCompareArrows,
  LayoutDashboard,
  Newspaper,
  NotebookPen,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: "notifications";
  adminOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
      { label: "Market", to: "/market", icon: Activity },
    ],
  },
  {
    title: "Discovery",
    items: [
      { label: "Suggestions", to: "/suggestions", icon: Sparkles },
      { label: "Screener", to: "/screener", icon: Compass },
      { label: "Compare", to: "/compare", icon: GitCompareArrows },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { label: "Watchlists", to: "/watchlists", icon: Star },
      { label: "Portfolio", to: "/portfolio", icon: Briefcase },
      { label: "Paper Trading", to: "/paper", icon: Gauge },
    ],
  },
  {
    title: "Research",
    items: [
      { label: "News", to: "/news", icon: Newspaper },
      { label: "Notes", to: "/notes", icon: NotebookPen },
      { label: "Tools", to: "/tools", icon: Calculator },
    ],
  },
  {
    title: "Activity",
    items: [{ label: "Alerts", to: "/alerts", icon: Bell, badge: "notifications" }],
  },
  {
    title: "Account",
    items: [
      { label: "Saved Screens", to: "/saved-screens", icon: Bookmark },
      { label: "Settings", to: "/settings", icon: Settings },
      { label: "Admin", to: "/admin", icon: ShieldCheck, adminOnly: true },
    ],
  },
];

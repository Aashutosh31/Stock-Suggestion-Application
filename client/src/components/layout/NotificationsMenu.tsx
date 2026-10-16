import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/feedback";
import { useMarkAllNotificationsRead, useNotifications } from "@/hooks/queries";
import { timeAgo } from "@/lib/format";

export function NotificationsMenu() {
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const unread = data?.unread ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex size-2.5 items-center justify-center rounded-full bg-down ring-2 ring-bg" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 ? <Badge variant="down">{unread} new</Badge> : null}
          </div>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAll.mutate()}
              loading={markAll.isPending}
            >
              <CheckCheck className="size-3.5" /> Mark all
            </Button>
          ) : null}
        </div>
        <div className="max-h-[22rem] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !data || data.notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="Alerts you create will appear here when they trigger." className="border-0 bg-transparent" />
          ) : (
            <ul className="divide-y divide-line">
              {data.notifications.slice(0, 12).map((n) => (
                <li key={n._id} className="flex gap-3 px-4 py-3">
                  <span className={n.read ? "mt-1.5 size-2 shrink-0 rounded-full bg-line-strong" : "mt-1.5 size-2 shrink-0 rounded-full bg-brand"} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-subtle">{timeAgo(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-line p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/alerts">Manage alerts</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

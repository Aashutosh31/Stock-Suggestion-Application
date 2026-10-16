import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteScreen, useSavedScreens } from "@/hooks/queries";
import { formatDateTime } from "@/lib/format";

export default function SavedScreens() {
  const screens = useSavedScreens();
  const deleteScreen = useDeleteScreen();
  const navigate = useNavigate();

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Saved screens"
        description="Rerun a stored set of screener filters in one click."
        actions={
          <Button asChild>
            <Link to="/screener">
              <Bookmark /> New screen
            </Link>
          </Button>
        }
      />

      <Async
        query={screens}
        loading={
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        }
        empty={(list) => list.length === 0}
        emptyTitle="No saved screens"
        emptyDescription="Build a screen and use Save to store it here."
      >
        {(list) => (
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((screen) => (
              <Card key={screen._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{screen.name}</p>
                      <p className="mt-0.5 text-[11px] text-subtle">Saved {formatDateTime(screen.createdAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete screen"
                      onClick={() => deleteScreen.mutate(screen._id, { onSuccess: () => toast.success("Screen deleted") })}
                    >
                      <Trash2 className="size-3.5 text-down" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(screen.filters)
                      .filter(([k]) => !["page", "pageSize", "sortBy", "sortDir"].includes(k))
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <Badge key={k} variant="neutral" size="sm">
                          {k}: {String(v)}
                        </Badge>
                      ))}
                  </div>
                  <Button
                    className="mt-4"
                    size="sm"
                    onClick={() => navigate(`/screener?screen=${encodeURIComponent(JSON.stringify(screen.filters))}`)}
                  >
                    <Play className="size-3.5" /> Run screen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Async>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Activity, Cpu, Database, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, StatBlock } from "@/components/ui/feedback";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useCurrentUser } from "@/hooks/useAuth";
import { formatDateTime, timeAgo } from "@/lib/format";

interface AdminHealth {
  status: string;
  database: string;
  provider: { provider: string; label: string; status: string; latencyMs: number | null; checkedAt: string; demo: boolean };
  cache: Record<string, number>;
  checkedAt: string;
}

interface AdminDiagnostics {
  environment: string;
  appName: string;
  provider: { id: string; label: string; demo: boolean };
  configured: Record<string, boolean>;
  clientOrigins: string[];
  cache: Record<string, number>;
  uptimeSeconds: number;
}

export default function Admin() {
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";

  const health = useQuery({
    queryKey: qk.adminHealth,
    queryFn: () => api.get<AdminHealth>("/admin/health"),
    enabled: isAdmin,
    retry: false,
  });
  const diagnostics = useQuery({
    queryKey: qk.adminDiagnostics,
    queryFn: () => api.get<AdminDiagnostics>("/admin/diagnostics"),
    enabled: isAdmin,
    retry: false,
  });

  if (!isAdmin) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Admin console" />
        <EmptyState
          icon={ShieldCheck}
          title="Administrator access required"
          description="Your account does not have administrator privileges. Ask an administrator to grant access."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Admin console"
        description="Runtime health, cache statistics and configuration presence."
        actions={
          <Button variant="outline" onClick={() => { void health.refetch(); void diagnostics.refetch(); }}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Async query={health} loading={<Skeleton className="h-24" />} empty={() => false}>
          {(h) => (
            <>
              <StatBlock label="Service status" value={h.status} valueClassName={h.status === "ok" ? "text-up" : "text-warn"} hint={`checked ${timeAgo(h.checkedAt)}`} />
              <StatBlock label="Database" value={h.database} valueClassName={h.database === "connected" ? "text-up" : "text-down"} />
              <StatBlock
                label="Provider"
                value={h.provider.label}
                hint={`${h.provider.status} · ${h.provider.latencyMs ?? "—"} ms`}
                valueClassName={h.provider.status === "ok" ? "text-up" : h.provider.status === "degraded" ? "text-warn" : "text-down"}
              />
              <StatBlock label="Cache keys" value={String(h.cache.keys ?? Object.values(h.cache)[0] ?? 0)} hint="TTL cache entries" />
            </>
          )}
        </Async>
      </div>

      <Async query={diagnostics} loading={<Skeleton className="h-64" />} empty={() => false}>
        {(d) => (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="size-4 text-brand" /> Runtime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Application" value={d.appName} />
                <Row label="Environment" value={d.environment} />
                <Row label="Provider" value={`${d.provider.label}${d.provider.demo ? " (demo)" : ""}`} />
                <Row label="Uptime" value={`${Math.floor(d.uptimeSeconds / 60)} min`} />
                <Row label="Checked" value={formatDateTime(new Date().toISOString())} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-4 text-brand" /> Configuration presence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-subtle">Only presence is reported — secret values are never exposed.</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(d.configured).map(([key, present]) => (
                    <Badge key={key} variant={present ? "up" : "neutral"}>
                      {key}: {present ? "set" : "unset"}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4 text-brand" /> CORS allowlist
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {d.clientOrigins.length === 0 ? (
                  <span className="text-sm text-subtle">No explicit origins configured.</span>
                ) : (
                  d.clientOrigins.map((origin) => (
                    <Badge key={origin} variant="neutral">
                      {origin}
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Async>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

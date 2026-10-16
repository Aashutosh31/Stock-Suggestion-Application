import { useMemo, useState } from "react";
import { Bell, BellRing, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { SymbolLink } from "@/components/common/values";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import {
  useAlerts,
  useCreateAlert,
  useDeleteAlert,
  useEvaluateAlerts,
  useNotifications,
  useSearch,
  useUpdateAlert,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDateTime, formatNumber, timeAgo } from "@/lib/format";

const ALERT_TYPES = [
  { value: "price_above", label: "Price rises above" },
  { value: "price_below", label: "Price falls below" },
  { value: "pct_change_above", label: "Day change above (%)" },
  { value: "pct_change_below", label: "Day change below (%)" },
  { value: "volume_above", label: "Volume above" },
  { value: "rsi_above", label: "RSI above" },
  { value: "rsi_below", label: "RSI below" },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(ALERT_TYPES.map((t) => [t.value, t.label]));

export default function Alerts() {
  const alerts = useAlerts();
  const notifications = useNotifications();
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();
  const evaluate = useEvaluateAlerts();

  const [open, setOpen] = useState(false);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Alerts"
        description="Get notified when price, momentum or volume conditions are met. The server evaluates alerts on a schedule."
        actions={
          <>
            <Button
              variant="outline"
              loading={evaluate.isPending}
              onClick={() =>
                evaluate.mutate(undefined, {
                  onSuccess: (data) => toast.success(`Evaluated ${data.evaluated} alerts · ${data.triggered} triggered`),
                  onError: () => toast.error("Could not evaluate alerts"),
                })
              }
            >
              <RefreshCw /> Evaluate now
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus /> New alert
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create alert</DialogTitle>
                  <DialogDescription>Alerts are checked against the latest available price.</DialogDescription>
                </DialogHeader>
                <AlertForm
                  onSubmit={(values) =>
                    createAlert.mutate(values, {
                      onSuccess: () => {
                        toast.success("Alert created");
                        setOpen(false);
                      },
                      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create alert"),
                    })
                  }
                  pending={createAlert.isPending}
                />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-brand" /> Your alerts
            </CardTitle>
            <span className="text-xs text-muted">
              {alerts.data?.emailEnabled ? "Email delivery enabled" : "In-app only"}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Async
              query={alerts}
              loading={<Skeleton className="m-5 h-40" />}
              empty={(d) => d.alerts.length === 0}
              emptyTitle="No alerts yet"
              emptyDescription="Create your first alert to monitor a condition."
            >
              {(data) => (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Last checked</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.alerts.map((alert) => (
                      <TableRow key={alert._id}>
                        <TableCell>
                          <SymbolLink symbol={alert.symbol} />
                          {alert.note ? <p className="mt-0.5 max-w-40 truncate text-[10px] text-subtle">{alert.note}</p> : null}
                        </TableCell>
                        <TableCell className="text-xs text-muted">{TYPE_LABEL[alert.type] ?? alert.type}</TableCell>
                        <TableCell className="text-right text-sm tnum text-ink">{formatNumber(alert.threshold, 2)}</TableCell>
                        <TableCell>
                          <Badge variant={alert.status === "active" ? "up" : alert.status === "triggered" ? "warn" : "neutral"} className="capitalize">
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-subtle lg:table-cell">
                          {alert.lastCheckedAt ? timeAgo(alert.lastCheckedAt) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Toggle"
                              onClick={() =>
                                updateAlert.mutate({
                                  id: alert._id,
                                  status: alert.status === "active" ? "paused" : "active",
                                })
                              }
                            >
                              {alert.status === "active" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Delete"
                              onClick={() => deleteAlert.mutate(alert._id, { onSuccess: () => toast.success("Alert deleted") })}
                            >
                              <Trash2 className="size-3.5 text-down" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Async>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-brand" /> Trigger history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Async query={notifications} loading={<Skeleton className="h-40" />} empty={(d) => d.notifications.length === 0} emptyTitle="No notifications">
              {(data) => (
                <ul className="space-y-3">
                  {data.notifications.slice(0, 12).map((n) => (
                    <li key={n._id} className="border-b border-line pb-2.5 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="text-xs text-muted">{n.body}</p>
                      <p className="mt-0.5 text-[10px] text-subtle">{formatDateTime(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Async>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AlertForm({
  onSubmit,
  pending,
}: {
  onSubmit: (values: { symbol: string; type: string; threshold: number; note?: string }) => void;
  pending: boolean;
}) {
  const [symbol, setSymbol] = useState("");
  const [term, setTerm] = useState("");
  const [type, setType] = useState("price_above");
  const [threshold, setThreshold] = useState("");
  const [note, setNote] = useState("");
  const debounced = useDebouncedValue(term, 220);
  const search = useSearch(debounced, 5);
  const results = useMemo(() => search.data ?? [], [search.data]);

  return (
    <div className="space-y-4">
      <Field label="Instrument">
        <div className="relative">
          <Input
            value={symbol || term}
            onChange={(e) => {
              setSymbol("");
              setTerm(e.target.value.toUpperCase());
            }}
            placeholder="Search symbol…"
          />
          {term && !symbol && results.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-[var(--nv-shadow)]">
              {results.map((s) => (
                <li key={s.symbol}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs hover:bg-surface-2"
                    onClick={() => {
                      setSymbol(s.symbol);
                      setTerm("");
                    }}
                  >
                    <span className="font-medium text-ink">{s.symbol}</span>
                    <span className="truncate text-[10px] text-subtle">{s.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Condition">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {ALERT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Threshold">
          <Input type="number" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="0.00" />
        </Field>
      </div>
      <Field label="Note (optional)">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this level matters…" />
      </Field>
      <DialogFooter>
        <Button
          disabled={!symbol || threshold === ""}
          loading={pending}
          onClick={() => onSubmit({ symbol, type, threshold: Number(threshold), note: note.trim() || undefined })}
        >
          Create alert
        </Button>
      </DialogFooter>
    </div>
  );
}

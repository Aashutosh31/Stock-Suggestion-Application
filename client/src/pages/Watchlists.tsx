import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { ChangePill, SymbolLink } from "@/components/common/values";
import { DemoBadge } from "@/components/common/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import {
  useAddWatchlistItem,
  useCreateWatchlist,
  useDeleteWatchlist,
  useRenameWatchlist,
  useRemoveWatchlistItem,
  useSearch,
  useWatchlists,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAppMeta } from "@/hooks/queries";
import { formatCurrency, formatPercent, formatVolume } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Watchlists() {
  const meta = useAppMeta();
  const watchlists = useWatchlists();
  const createList = useCreateWatchlist();
  const renameList = useRenameWatchlist();
  const deleteList = useDeleteWatchlist();
  const addItem = useAddWatchlistItem();
  const removeItem = useRemoveWatchlistItem();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [symbolTerm, setSymbolTerm] = useState("");
  const debounced = useDebouncedValue(symbolTerm, 220);
  const search = useSearch(debounced, 6);

  const selected = useMemo(
    () => watchlists.data?.find((w) => w.id === selectedId) ?? watchlists.data?.[0],
    [watchlists.data, selectedId],
  );

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Watchlists"
        description={
          <span className="flex items-center gap-2">
            Organise instruments into themed lists and monitor them at a glance.
            {meta.data ? <DemoBadge demo={meta.data.provider.demo} /> : null}
          </span>
        }
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus /> New watchlist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create watchlist</DialogTitle>
              </DialogHeader>
              <Field label="Name">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="High conviction" />
              </Field>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!newName.trim()}
                  loading={createList.isPending}
                  onClick={() =>
                    createList.mutate(newName.trim(), {
                      onSuccess: (data) => {
                        toast.success("Watchlist created");
                        setNewName("");
                        setCreateOpen(false);
                        if (data?.watchlist) setSelectedId(data.watchlist.id);
                      },
                      onError: () => toast.error("Could not create watchlist"),
                    })
                  }
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Async
        query={watchlists}
        loading={<Skeleton className="h-96" />}
        empty={(d) => d.length === 0}
        emptyTitle="No watchlists yet"
        emptyDescription="Create your first watchlist to start tracking instruments."
      >
        {(lists) => (
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <Card className="h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your lists</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-2">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className={cn(
                      "group flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors",
                      selected?.id === list.id ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2",
                    )}
                  >
                    <button className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left" onClick={() => setSelectedId(list.id)}>
                      <Star className="size-3.5 shrink-0" />
                      <span className="truncate">{list.name}</span>
                      <Badge variant="neutral" size="sm">
                        {list.items.length}
                      </Badge>
                    </button>
                    <button
                      className="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Delete ${list.name}`}
                      onClick={() =>
                        deleteList.mutate(list.id, {
                          onSuccess: () => {
                            toast.success("Watchlist deleted");
                            if (selected?.id === list.id) setSelectedId(null);
                          },
                        })
                      }
                    >
                      <Trash2 className="size-3.5 text-down" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selected ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CardTitle>{selected.name}</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Rename
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Rename watchlist</DialogTitle>
                          </DialogHeader>
                          <RenameForm
                            initial={selected.name}
                            onSubmit={(name) =>
                              renameList.mutate(
                                { id: selected.id, name },
                                { onSuccess: () => toast.success("Renamed") },
                              )
                            }
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="relative w-full max-w-xs">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
                        <Input
                          value={symbolTerm}
                          onChange={(e) => setSymbolTerm(e.target.value)}
                          placeholder="Add instrument…"
                          className="pl-8"
                        />
                      </div>
                      {symbolTerm && search.data && search.data.length > 0 ? (
                        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-[var(--nv-shadow)]">
                          {search.data.map((s) => (
                            <li key={s.symbol}>
                              <button
                                className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-surface-2"
                                onClick={() =>
                                  addItem.mutate(
                                    { id: selected.id, symbol: s.symbol },
                                    {
                                      onSuccess: () => {
                                        toast.success(`Added ${s.symbol}`);
                                        setSymbolTerm("");
                                      },
                                      onError: () => toast.message("Already in this watchlist"),
                                    },
                                  )
                                }
                              >
                                <span className="font-medium text-ink">{s.symbol}</span>
                                <span className="truncate text-[10px] text-subtle">{s.name}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {selected.items.length === 0 ? (
                      <EmptyState icon={Star} title="This watchlist is empty" description="Search above to add instruments." className="border-0" />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Instrument</TableHead>
                            <TableHead className="hidden md:table-cell">Sector</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                            <TableHead className="hidden text-right lg:table-cell">Volume</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.items.map((item) => (
                            <TableRow key={item.symbol}>
                              <TableCell>
                                <SymbolLink symbol={item.symbol} name={item.name} showName />
                              </TableCell>
                              <TableCell className="hidden text-xs text-muted md:table-cell">{item.sector ?? "—"}</TableCell>
                              <TableCell className="text-right text-sm tnum text-ink">{formatCurrency(item.quote?.price)}</TableCell>
                              <TableCell className="text-right">
                                <ChangePill value={item.quote?.changePercent} size="sm" />
                              </TableCell>
                              <TableCell className="hidden text-right text-sm tnum text-muted lg:table-cell">{formatVolume(item.quote?.volume)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button asChild variant="ghost" size="sm">
                                    <Link to={`/stocks/${item.symbol}`}>Open</Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Remove ${item.symbol}`}
                                    onClick={() =>
                                      removeItem.mutate(
                                        { id: selected.id, symbol: item.symbol },
                                        { onSuccess: () => toast.success("Removed") },
                                      )
                                    }
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
                  </CardContent>
                </Card>

                <p className="text-right text-xs text-subtle">
                  Total change unavailable · prices {selected.items.some((i) => i.quote?.stale) ? "may be delayed" : "as of latest tick"}
                  {selected.items.length > 0
                    ? ` · avg move ${formatPercent(
                        selected.items.reduce((acc, i) => acc + (i.quote?.changePercent ?? 0), 0) / selected.items.length,
                        { sign: true },
                      )}`
                    : ""}
                </p>
              </div>
            ) : (
              <EmptyState title="Select a watchlist" />
            )}
          </div>
        )}
      </Async>
    </div>
  );
}

function RenameForm({ initial, onSubmit }: { initial: string; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(initial);
  return (
    <>
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <DialogFooter>
        <Button disabled={!name.trim()} onClick={() => onSubmit(name.trim())}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

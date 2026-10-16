import { useMemo, useState } from "react";
import { Briefcase, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { SymbolLink } from "@/components/common/values";
import { DemoBadge } from "@/components/common/badges";
import { AllocationDonut } from "@/components/charts/AllocationDonut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatBlock } from "@/components/ui/feedback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useAddTransaction,
  useAllocation,
  useAppMeta,
  useCreatePortfolio,
  useDeletePortfolio,
  useDeleteTransaction,
  useHoldings,
  usePortfolios,
  useSearch,
  useTransactions,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCurrency, formatDateTime, formatNumber, formatPercent, trendOf } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Portfolio() {
  const meta = useAppMeta();
  const portfolios = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const deletePortfolio = useDeletePortfolio();
  const addTransaction = useAddTransaction();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [txOpen, setTxOpen] = useState(false);

  const activeId =
    selectedId ?? (portfolios.data?.find((p) => p.isDefault) ?? portfolios.data?.[0])?.id ?? null;

  const holdings = useHoldings(activeId ?? undefined);
  const allocation = useAllocation(activeId ?? undefined);
  const transactions = useTransactions(activeId ?? undefined);
  const deleteTransaction = useDeleteTransaction(activeId ?? "");

  const totals = holdings.data?.totals;

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Portfolio"
        description={
          <span className="flex items-center gap-2">
            Track holdings, cost basis and unrealised P&L across your accounts.
            {meta.data ? <DemoBadge demo={meta.data.provider.demo} /> : null}
          </span>
        }
        actions={
          <>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus /> New portfolio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create portfolio</DialogTitle>
                </DialogHeader>
                <Field label="Name">
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Long term" />
                </Field>
                <DialogFooter>
                  <Button
                    disabled={!newName.trim()}
                    loading={createPortfolio.isPending}
                    onClick={() =>
                      createPortfolio.mutate(newName.trim(), {
                        onSuccess: () => {
                          toast.success("Portfolio created");
                          setNewName("");
                          setCreateOpen(false);
                        },
                      })
                    }
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button disabled={!activeId} onClick={() => setTxOpen(true)}>
              <Plus /> Add transaction
            </Button>
          </>
        }
      />

      <Async query={portfolios} loading={<Skeleton className="h-12" />} empty={(d) => d.length === 0} emptyTitle="No portfolios">
        {(list) => (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted">Account:</span>
              {list.map((p) => (
                <Button
                  key={p.id}
                  variant={activeId === p.id ? "subtle" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedId(p.id)}
                >
                  {p.name}
                  {p.isDefault ? <Badge variant="outline" size="sm">default</Badge> : null}
                </Button>
              ))}
              {list.length > 1 && activeId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-down"
                  onClick={() =>
                    deletePortfolio.mutate(activeId, {
                      onSuccess: () => {
                        toast.success("Portfolio deleted");
                        setSelectedId(null);
                      },
                    })
                  }
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatBlock label="Current value" value={formatCurrency(totals?.currentValue)} />
              <StatBlock
                label="Unrealised P&L"
                value={formatCurrency(totals?.unrealizedPnl)}
                valueClassName={cn(trendOf(totals?.unrealizedPnl) === "up" ? "text-up" : trendOf(totals?.unrealizedPnl) === "down" ? "text-down" : "text-ink")}
                hint={formatPercent(totals?.unrealizedPnlPercent, { sign: true })}
              />
              <StatBlock label="Invested" value={formatCurrency(totals?.investedValue)} />
              <StatBlock label="Realised P&L" value={formatCurrency(totals?.realizedPnl)} valueClassName={cn(trendOf(totals?.realizedPnl) === "up" ? "text-up" : trendOf(totals?.realizedPnl) === "down" ? "text-down" : "text-ink")} />
            </div>

            <Tabs defaultValue="holdings">
              <TabsList>
                <TabsTrigger value="holdings">Holdings</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="holdings">
                <Async
                  query={holdings}
                  loading={<Skeleton className="h-64" />}
                  empty={(d) => d.holdings.length === 0}
                  emptyTitle="No holdings"
                  emptyDescription="Add a buy transaction to start tracking this portfolio."
                >
                  {(data) => (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Instrument</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="hidden text-right md:table-cell">Avg cost</TableHead>
                              <TableHead className="text-right">LTP</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                              <TableHead className="text-right">P&L</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.holdings.map((h) => {
                              const t = trendOf(h.unrealizedPnl);
                              return (
                                <TableRow key={h.symbol}>
                                  <TableCell>
                                    <SymbolLink symbol={h.symbol} name={h.name} showName />
                                  </TableCell>
                                  <TableCell className="text-right text-sm tnum text-ink">{formatNumber(h.quantity, 0)}</TableCell>
                                  <TableCell className="hidden text-right text-sm tnum text-muted md:table-cell">{formatNumber(h.averageCost)}</TableCell>
                                  <TableCell className="text-right text-sm tnum text-ink">{formatCurrency(h.currentPrice)}</TableCell>
                                  <TableCell className="text-right text-sm tnum text-ink">{formatCurrency(h.currentValue)}</TableCell>
                                  <TableCell className="text-right">
                                    <span className={cn("flex flex-col items-end text-sm tnum", t === "up" ? "text-up" : t === "down" ? "text-down" : "text-muted")}>
                                      <span className="flex items-center gap-1">
                                        {t === "up" ? <TrendingUp className="size-3" /> : t === "down" ? <TrendingDown className="size-3" /> : null}
                                        {formatCurrency(h.unrealizedPnl)}
                                      </span>
                                      <span className="text-xs">{formatPercent(h.unrealizedPnlPercent, { sign: true })}</span>
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </Async>
              </TabsContent>

              <TabsContent value="allocation">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>By sector</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Async query={allocation} loading={<Skeleton className="h-52" />} empty={(d) => d.bySector.length === 0} emptyTitle="No holdings">
                        {(data) => <AllocationDonut data={data.bySector} />}
                      </Async>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>By instrument</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Async query={allocation} loading={<Skeleton className="h-52" />} empty={(d) => d.byInstrument.length === 0} emptyTitle="No holdings">
                        {(data) => <AllocationDonut data={data.byInstrument} />}
                      </Async>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="transactions">
                <Async query={transactions} loading={<Skeleton className="h-52" />} empty={(d) => d.length === 0} emptyTitle="No transactions">
                  {(txList) => (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Instrument</TableHead>
                              <TableHead>Side</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {txList.map((tx) => (
                              <TableRow key={tx._id}>
                                <TableCell className="text-xs text-muted">{formatDateTime(tx.tradedAt)}</TableCell>
                                <TableCell>
                                  <SymbolLink symbol={tx.symbol} />
                                </TableCell>
                                <TableCell>
                                  <Badge variant={tx.side === "buy" ? "up" : "down"} className="capitalize">
                                    {tx.side}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-sm tnum text-ink">{formatNumber(tx.quantity, 0)}</TableCell>
                                <TableCell className="text-right text-sm tnum text-ink">{formatCurrency(tx.price)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Delete transaction"
                                    onClick={() => deleteTransaction.mutate(tx._id, { onSuccess: () => toast.success("Transaction deleted") })}
                                  >
                                    <Trash2 className="size-3.5 text-down" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </Async>
              </TabsContent>
            </Tabs>

            <Dialog open={txOpen} onOpenChange={setTxOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add transaction</DialogTitle>
                  <DialogDescription>Record a buy or sell. Holdings and P&L update automatically.</DialogDescription>
                </DialogHeader>
                {activeId ? (
                  <TransactionForm
                    onSubmit={(values) =>
                      addTransaction.mutate(
                        { id: activeId, ...values },
                        {
                          onSuccess: () => {
                            toast.success("Transaction recorded");
                            setTxOpen(false);
                          },
                          onError: (err) => toast.error(err instanceof Error ? err.message : "Could not record transaction"),
                        },
                      )
                    }
                    pending={addTransaction.isPending}
                  />
                ) : null}
              </DialogContent>
            </Dialog>

            <p className="text-right text-xs text-subtle">Prices are indicative and may be delayed or simulated.</p>
          </>
        )}
      </Async>
    </div>
  );
}

function TransactionForm({
  onSubmit,
  pending,
}: {
  onSubmit: (values: { symbol: string; side: string; quantity: number; price: number; fees: number; tradedAt: string }) => void;
  pending: boolean;
}) {
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("buy");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [tradedAt, setTradedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term, 220);
  const search = useSearch(debounced, 5);

  const results = useMemo(() => search.data ?? [], [search.data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Symbol">
          <div className="relative">
            <Input
              value={symbol || term}
              onChange={(e) => {
                setSymbol("");
                setTerm(e.target.value.toUpperCase());
              }}
              placeholder="e.g. RELIANCE"
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
        <Field label="Side">
          <Select value={side} onChange={(e) => setSide(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </Select>
        </Field>
        <Field label="Quantity">
          <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Price">
          <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Fees">
          <Input type="number" min="0" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} />
        </Field>
        <Field label="Trade date">
          <Input type="date" value={tradedAt} onChange={(e) => setTradedAt(e.target.value)} />
        </Field>
      </div>
      <DialogFooter>
        <Button
          disabled={!symbol || !price || Number(quantity) <= 0}
          loading={pending}
          onClick={() =>
            onSubmit({
              symbol,
              side,
              quantity: Number(quantity),
              price: Number(price),
              fees: Number(fees) || 0,
              tradedAt: new Date(tradedAt).toISOString(),
            })
          }
        >
          <Briefcase className="size-4" /> Record {side}
        </Button>
      </DialogFooter>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Gauge, RotateCcw, Settings2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Async } from "@/components/common/Async";
import { SymbolLink } from "@/components/common/values";
import { DisclaimerNote } from "@/components/common/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, StatBlock } from "@/components/ui/feedback";
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
  usePaperAccount,
  usePaperTrades,
  usePlacePaperOrder,
  useResetPaperAccount,
  useSearch,
  useUpdatePaperConfig,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCurrency, formatDateTime, formatNumber, formatPercent, trendOf } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PaperTrading() {
  const account = usePaperAccount();
  const trades = usePaperTrades();
  const placeOrder = usePlacePaperOrder();
  const reset = useResetPaperAccount();
  const updateConfig = useUpdatePaperConfig();

  const [resetOpen, setResetOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [startingCash, setStartingCash] = useState("1000000");

  const totals = account.data?.totals;
  const isUp = trendOf(totals?.totalReturn) === "up";

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Paper Trading"
        description="Practise order execution against a simulated cash balance. Fills use the latest available price plus slippage and fees."
        actions={
          <>
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings2 /> Fees
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Execution assumptions</DialogTitle>
                  <DialogDescription>Applied to every simulated fill.</DialogDescription>
                </DialogHeader>
                {account.data ? (
                  <ConfigForm
                    initial={account.data.account.config}
                    onSubmit={(config) =>
                      updateConfig.mutate(config, {
                        onSuccess: () => {
                          toast.success("Assumptions updated");
                          setConfigOpen(false);
                        },
                      })
                    }
                    pending={updateConfig.isPending}
                  />
                ) : null}
              </DialogContent>
            </Dialog>
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw /> Reset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Reset paper account</DialogTitle>
                  <DialogDescription>This clears all positions and trade history.</DialogDescription>
                </DialogHeader>
                <Field label="Starting cash (₹)">
                  <Input type="number" min="10000" value={startingCash} onChange={(e) => setStartingCash(e.target.value)} />
                </Field>
                <DialogFooter>
                  <Button
                    variant="danger"
                    loading={reset.isPending}
                    onClick={() =>
                      reset.mutate(Number(startingCash), {
                        onSuccess: () => {
                          toast.success("Account reset");
                          setResetOpen(false);
                        },
                      })
                    }
                  >
                    Reset account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <DisclaimerNote text="Paper trading is a simulation for practice only. Fills, fees and slippage are simplified and do not reflect real market execution." />

      <Async
        query={account}
        loading={<Skeleton className="h-64" />}
        empty={() => false}
      >
        {(data) => (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatBlock label="Equity" value={formatCurrency(data.totals.equity)} hint={`Cash ${formatCurrency(data.totals.cash)}`} />
              <StatBlock
                label="Total return"
                value={formatCurrency(data.totals.totalReturn)}
                valueClassName={isUp ? "text-up" : trendOf(data.totals.totalReturn) === "down" ? "text-down" : "text-ink"}
                hint={formatPercent(data.totals.totalReturnPercent, { sign: true })}
              />
              <StatBlock
                label="Unrealised P&L"
                value={formatCurrency(data.totals.unrealizedPnl)}
                valueClassName={cn(trendOf(data.totals.unrealizedPnl) === "up" ? "text-up" : trendOf(data.totals.unrealizedPnl) === "down" ? "text-down" : "text-ink")}
              />
              <StatBlock label="Realised P&L" value={formatCurrency(data.totals.realizedPnl)} valueClassName={cn(trendOf(data.totals.realizedPnl) === "up" ? "text-up" : trendOf(data.totals.realizedPnl) === "down" ? "text-down" : "text-ink")} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
              <Card className="order-2 lg:order-1">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="size-4 text-brand" /> Positions
                  </CardTitle>
                  <Badge variant="neutral">{data.positions.length}</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  {data.positions.length === 0 ? (
                    <EmptyState title="No open positions" description="Place a buy order to open a position." className="border-0" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Instrument</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="hidden text-right md:table-cell">Avg cost</TableHead>
                          <TableHead className="text-right">LTP</TableHead>
                          <TableHead className="text-right">P&L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.positions.map((p) => {
                          const t = trendOf(p.unrealizedPnl);
                          return (
                            <TableRow key={p.symbol}>
                              <TableCell>
                                <SymbolLink symbol={p.symbol} name={p.name} showName />
                              </TableCell>
                              <TableCell className="text-right text-sm tnum text-ink">{formatNumber(p.quantity, 0)}</TableCell>
                              <TableCell className="hidden text-right text-sm tnum text-muted md:table-cell">{formatNumber(p.averageCost)}</TableCell>
                              <TableCell className="text-right text-sm tnum text-ink">{formatCurrency(p.currentPrice)}</TableCell>
                              <TableCell className="text-right">
                                <span className={cn("flex flex-col items-end text-sm tnum", t === "up" ? "text-up" : t === "down" ? "text-down" : "text-muted")}>
                                  <span className="flex items-center gap-1">
                                    {t === "up" ? <TrendingUp className="size-3" /> : t === "down" ? <TrendingDown className="size-3" /> : null}
                                    {formatCurrency(p.unrealizedPnl)}
                                  </span>
                                  <span className="text-xs">{formatPercent(p.unrealizedPnlPercent, { sign: true })}</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <div className="order-1 lg:order-2">
                <OrderTicket
                  onSubmit={(order) =>
                    placeOrder.mutate(order, {
                      onSuccess: () => toast.success(`${order.side === "buy" ? "Bought" : "Sold"} ${order.quantity} × ${order.symbol}`),
                      onError: (err) => toast.error(err instanceof Error ? err.message : "Order rejected"),
                    })
                  }
                  pending={placeOrder.isPending}
                  cash={data.totals.cash}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trade history</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Async query={trades} loading={<Skeleton className="h-40" />} empty={(t) => t.length === 0} emptyTitle="No trades yet">
                  {(list) => (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Instrument</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Fill</TableHead>
                          <TableHead className="text-right">Fees</TableHead>
                          <TableHead className="text-right">Realised</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((t) => (
                          <TableRow key={t._id}>
                            <TableCell className="text-xs text-muted">{formatDateTime(t.tradedAt)}</TableCell>
                            <TableCell>
                              <SymbolLink symbol={t.symbol} />
                            </TableCell>
                            <TableCell>
                              <Badge variant={t.side === "buy" ? "up" : "down"} className="capitalize">
                                {t.side}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm tnum text-ink">{formatNumber(t.quantity, 0)}</TableCell>
                            <TableCell className="text-right text-sm tnum text-ink">{formatCurrency(t.fillPrice)}</TableCell>
                            <TableCell className="text-right text-sm tnum text-muted">{formatCurrency(t.fees)}</TableCell>
                            <TableCell className={cn("text-right text-sm tnum", trendOf(t.realizedPnl) === "up" ? "text-up" : trendOf(t.realizedPnl) === "down" ? "text-down" : "text-muted")}>
                              {t.realizedPnl == null ? "—" : formatCurrency(t.realizedPnl)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Async>
              </CardContent>
            </Card>

            <Tabs defaultValue="assumptions">
              <TabsList>
                <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
              </TabsList>
              <TabsContent value="assumptions">
                <Card>
                  <CardContent className="grid grid-cols-3 gap-3 p-4 text-sm">
                    <div>
                      <p className="text-[11px] uppercase text-subtle">Commission</p>
                      <p className="tnum text-ink">{formatPercent(data.account.config.commissionPercent, { decimals: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-subtle">Flat fee</p>
                      <p className="tnum text-ink">{formatCurrency(data.account.config.flatFee)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-subtle">Slippage</p>
                      <p className="tnum text-ink">{formatPercent(data.account.config.slippagePercent, { decimals: 2 })}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </Async>
    </div>
  );
}

function OrderTicket({
  onSubmit,
  pending,
  cash,
}: {
  onSubmit: (order: { symbol: string; side: "buy" | "sell"; quantity: number }) => void;
  pending: boolean;
  cash: number;
}) {
  const [term, setTerm] = useState("");
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("1");
  const debounced = useDebouncedValue(term, 220);
  const search = useSearch(debounced, 5);

  const results = useMemo(() => search.data ?? [], [search.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
          <Field label="Side">
            <Select value={side} onChange={(e) => setSide(e.target.value as "buy" | "sell")}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </Select>
          </Field>
          <Field label="Quantity">
            <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
        </div>
        <div className="rounded-md border border-line bg-surface-2 px-3 py-2 text-xs text-muted">
          Available cash: <span className="tnum text-ink">{formatCurrency(cash)}</span>
        </div>
        <Button
          className="w-full"
          variant={side === "buy" ? "primary" : "danger"}
          disabled={!symbol || Number(quantity) <= 0}
          loading={pending}
          onClick={() => {
            onSubmit({ symbol, side, quantity: Number(quantity) });
            setSymbol("");
            setTerm("");
          }}
        >
          {side === "buy" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          {side === "buy" ? "Buy" : "Sell"} {quantity || 0} × {symbol || "—"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ConfigForm({
  initial,
  onSubmit,
  pending,
}: {
  initial: { commissionPercent: number; flatFee: number; slippagePercent: number };
  onSubmit: (config: { commissionPercent: number; flatFee: number; slippagePercent: number }) => void;
  pending: boolean;
}) {
  const [commissionPercent, setCommission] = useState(String(initial.commissionPercent));
  const [flatFee, setFlatFee] = useState(String(initial.flatFee));
  const [slippagePercent, setSlippage] = useState(String(initial.slippagePercent));
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Commission %">
          <Input type="number" step="0.01" value={commissionPercent} onChange={(e) => setCommission(e.target.value)} />
        </Field>
        <Field label="Flat fee ₹">
          <Input type="number" step="1" value={flatFee} onChange={(e) => setFlatFee(e.target.value)} />
        </Field>
        <Field label="Slippage %">
          <Input type="number" step="0.01" value={slippagePercent} onChange={(e) => setSlippage(e.target.value)} />
        </Field>
      </div>
      <DialogFooter>
        <Button
          loading={pending}
          onClick={() =>
            onSubmit({
              commissionPercent: Number(commissionPercent),
              flatFee: Number(flatFee),
              slippagePercent: Number(slippagePercent),
            })
          }
        >
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

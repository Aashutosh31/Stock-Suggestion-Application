import { useMemo, useState } from "react";
import { Calculator, FlaskConical, Percent, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Tools() {
  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Tools & calculators"
        description="Quick calculations for position sizing, returns and risk management."
      />

      <Tabs defaultValue="cagr">
        <TabsList className="flex-wrap">
          <TabsTrigger value="cagr">
            <Percent className="mr-1 size-3.5" /> CAGR
          </TabsTrigger>
          <TabsTrigger value="sip">
            <TrendingUp className="mr-1 size-3.5" /> SIP
          </TabsTrigger>
          <TabsTrigger value="position">
            <Calculator className="mr-1 size-3.5" /> Position size
          </TabsTrigger>
          <TabsTrigger value="risk">Risk / reward</TabsTrigger>
          <TabsTrigger value="methodology">
            <FlaskConical className="mr-1 size-3.5" /> Methodology
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cagr">
          <CagrCalculator />
        </TabsContent>
        <TabsContent value="sip">
          <SipCalculator />
        </TabsContent>
        <TabsContent value="position">
          <PositionSizer />
        </TabsContent>
        <TabsContent value="risk">
          <RiskReward />
        </TabsContent>
        <TabsContent value="methodology">
          <Methodology />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultRow({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2.5">
      <span className="text-xs text-muted">{label}</span>
      <span className={tone === "up" ? "font-semibold tnum text-up" : tone === "down" ? "font-semibold tnum text-down" : "font-semibold tnum text-ink"}>
        {value}
      </span>
    </div>
  );
}

function CagrCalculator() {
  const [initial, setInitial] = useState("100000");
  const [final, setFinal] = useState("250000");
  const [years, setYears] = useState("5");

  const result = useMemo(() => {
    const i = num(initial);
    const f = num(final);
    const y = num(years);
    if (i <= 0 || y <= 0) return null;
    const cagr = (Math.pow(f / i, 1 / y) - 1) * 100;
    return { cagr, absolute: f - i, multiple: f / i };
  }, [initial, final, years]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Initial investment">
            <Input type="number" value={initial} onChange={(e) => setInitial(e.target.value)} />
          </Field>
          <Field label="Final value">
            <Input type="number" value={final} onChange={(e) => setFinal(e.target.value)} />
          </Field>
          <Field label="Holding period (years)">
            <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result ? (
            <>
              <ResultRow label="CAGR" value={formatPercent(result.cagr)} tone={result.cagr >= 0 ? "up" : "down"} />
              <ResultRow label="Absolute return" value={formatCurrency(result.absolute)} tone={result.absolute >= 0 ? "up" : "down"} />
              <ResultRow label="Money multiple" value={`${formatNumber(result.multiple, 2)}×`} />
            </>
          ) : (
            <p className="text-sm text-subtle">Enter positive values to compute CAGR.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SipCalculator() {
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");

  const result = useMemo(() => {
    const m = num(monthly);
    const annual = num(rate) / 100;
    const n = num(years) * 12;
    const r = annual / 12;
    if (m <= 0 || n <= 0) return null;
    const fv = r === 0 ? m * n : m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = m * n;
    return { fv, invested, gains: fv - invested };
  }, [monthly, rate, years]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Monthly contribution">
            <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </Field>
          <Field label="Expected annual return (%)">
            <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
          <Field label="Duration (years)">
            <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Projection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result ? (
            <>
              <ResultRow label="Future value" value={formatCurrency(result.fv)} tone="up" />
              <ResultRow label="Total invested" value={formatCurrency(result.invested)} />
              <ResultRow label="Estimated gains" value={formatCurrency(result.gains)} tone="up" />
              <p className="pt-1 text-[11px] text-subtle">Assumes contributions at the start of each month and a constant rate. Illustrative only.</p>
            </>
          ) : (
            <p className="text-sm text-subtle">Enter values to project a SIP.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PositionSizer() {
  const [capital, setCapital] = useState("500000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [entry, setEntry] = useState("1500");
  const [stop, setStop] = useState("1425");

  const result = useMemo(() => {
    const c = num(capital);
    const rp = num(riskPercent) / 100;
    const e = num(entry);
    const s = num(stop);
    const riskPerShare = Math.abs(e - s);
    if (c <= 0 || e <= 0 || riskPerShare <= 0) return null;
    const riskAmount = c * rp;
    const qty = Math.floor(riskAmount / riskPerShare);
    return { riskAmount, riskPerShare, qty, exposure: qty * e, percentOfCapital: (qty * e) / c * 100 };
  }, [capital, riskPercent, entry, stop]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Account capital">
            <Input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} />
          </Field>
          <Field label="Risk per trade (%)">
            <Input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Entry price">
              <Input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} />
            </Field>
            <Field label="Stop price">
              <Input type="number" value={stop} onChange={(e) => setStop(e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sizing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result ? (
            <>
              <ResultRow label="Capital at risk" value={formatCurrency(result.riskAmount)} tone="down" />
              <ResultRow label="Risk per share" value={formatCurrency(result.riskPerShare)} />
              <ResultRow label="Suggested quantity" value={formatNumber(result.qty, 0)} tone="up" />
              <ResultRow label="Position exposure" value={formatCurrency(result.exposure)} />
              <ResultRow label="% of capital" value={formatPercent(result.percentOfCapital, { decimals: 1 })} />
            </>
          ) : (
            <p className="text-sm text-subtle">Provide capital, entry and a different stop price.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RiskReward() {
  const [entry, setEntry] = useState("1500");
  const [stop, setStop] = useState("1425");
  const [target, setTarget] = useState("1650");

  const result = useMemo(() => {
    const e = num(entry);
    const s = num(stop);
    const t = num(target);
    const risk = Math.abs(e - s);
    const reward = Math.abs(t - e);
    if (risk <= 0) return null;
    const rr = reward / risk;
    const breakevenWin = 1 / (1 + rr) * 100;
    return { risk, reward, rr, breakevenWin };
  }, [entry, stop, target]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Entry">
            <Input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stop loss">
              <Input type="number" value={stop} onChange={(e) => setStop(e.target.value)} />
            </Field>
            <Field label="Target">
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>R:R analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result ? (
            <>
              <ResultRow label="Reward : risk" value={`${formatNumber(result.rr, 2)} : 1`} tone={result.rr >= 2 ? "up" : result.rr >= 1 ? undefined : "down"} />
              <ResultRow label="Risk per share" value={formatCurrency(result.risk)} />
              <ResultRow label="Reward per share" value={formatCurrency(result.reward)} />
              <ResultRow label="Break-even win rate" value={formatPercent(result.breakevenWin, { decimals: 1 })} />
              <div className="pt-1">
                <Badge variant={result.rr >= 2 ? "up" : result.rr >= 1 ? "warn" : "down"}>
                  {result.rr >= 2 ? "Favourable asymmetry" : result.rr >= 1 ? "Marginal" : "Unfavourable"}
                </Badge>
              </div>
            </>
          ) : (
            <p className="text-sm text-subtle">Enter entry and a different stop to compute R:R.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Methodology() {
  const components = [
    { name: "Price momentum", weight: "20%", body: "Blends 1/3/12-month returns and distance from the 52-week range." },
    { name: "Technical strength", weight: "15%", body: "RSI(14) positioning, trend classification and 20/50-day moving average structure." },
    { name: "Valuation", weight: "15%", body: "P/E and P/B relative to absolute bands, plus dividend yield." },
    { name: "Financial quality", weight: "15%", body: "ROE and ROCE strength with leverage (debt/equity) penalty." },
    { name: "Growth", weight: "10%", body: "Revenue and earnings growth." },
    { name: "Liquidity", weight: "5%", body: "Traded volume and its ratio to the 20-day average." },
    { name: "Risk & drawdown", weight: "10%", body: "Annualised volatility and maximum drawdown." },
    { name: "Relative performance", weight: "10%", body: "1-year excess return versus the NIFTY 50 benchmark." },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>How scoring works</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted">
        <p>
          Each instrument is scored from 0–100. Every component maps observable metrics onto a 0–100 band; the overall
          score is the weighted average of available components. When a metric is missing, that component is excluded
          and the remaining weights are renormalised, so incomplete data never silently becomes a zero.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {components.map((c) => (
            <div key={c.name} className="rounded-md border border-line bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{c.name}</p>
                <Badge variant="brand">{c.weight}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{c.body}</p>
            </div>
          ))}
        </div>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>RSI(14) uses Wilder&apos;s smoothing; MACD uses 12/26/9; Bollinger uses 20-period, 2σ.</li>
          <li>Volatility is the annualised standard deviation of daily returns (√252).</li>
          <li>Maximum drawdown is the largest peak-to-trough decline within the lookback window.</li>
          <li>All outputs are deterministic for a given data snapshot and are stored alongside the metrics used.</li>
        </ul>
        <p className="text-xs text-subtle">
          Nivesh Terminal is an educational research tool. Rankings are not investment advice and no outcome is guaranteed.
        </p>
      </CardContent>
    </Card>
  );
}

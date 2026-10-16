import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/format";

const PALETTE = ["#7c5cff", "#22d3ee", "#34d399", "#f59e0b", "#f43f5e", "#38bdf8", "#a78bfa", "#fbbf24", "#4ade80", "#fb7185"];

export interface DonutSlice {
  label: string;
  value: number;
  percent: number;
}

export function AllocationDonut({ data, height = 260 }: { data: DonutSlice[]; height?: number }) {
  if (!data.length) return <div className="grid h-[260px] place-items-center text-sm text-subtle">No allocation data</div>;
  return (
    <div className="flex h-full flex-col gap-3 sm:flex-row sm:items-center">
      <div style={{ width: "100%", height }} className="min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--nv-surface-3)",
                border: "1px solid var(--nv-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--nv-text)",
              }}
              formatter={(value, name) => {
                const numeric = typeof value === "number" ? value : Number(value ?? 0);
                const label = String(name);
                return [`${formatCurrency(numeric)} (${formatPercent(data.find((d) => d.label === label)?.percent ?? 0, { decimals: 1 })})`, label];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex max-h-[260px] w-full flex-col gap-1.5 overflow-y-auto pr-1 sm:w-52">
        {data.map((slice, i) => (
          <li key={slice.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate text-muted" title={slice.label}>
                {slice.label}
              </span>
            </span>
            <span className="shrink-0 tnum text-ink">{formatPercent(slice.percent, { decimals: 1 })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

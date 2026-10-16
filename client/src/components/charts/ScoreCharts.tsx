import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { SuggestionComponent } from "@/lib/types";

function scoreColor(score: number | null): string {
  if (score === null) return "#4b5563";
  if (score >= 70) return "#34d399";
  if (score >= 50) return "#22d3ee";
  if (score >= 35) return "#f59e0b";
  return "#f43f5e";
}

export function ScoreRadar({ components }: { components: SuggestionComponent[] }) {
  const data = components.map((c) => ({ label: c.label, score: c.score ?? 0, available: c.score !== null }));
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--nv-border)" />
          <PolarAngleAxis dataKey="label" tick={{ fill: "var(--nv-text-muted)", fontSize: 10 }} />
          <Radar dataKey="score" stroke="#7c5cff" fill="#7c5cff" fillOpacity={0.28} strokeWidth={1.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComponentBars({ components }: { components: SuggestionComponent[] }) {
  const data = components.map((c) => ({ label: c.label, score: c.score ?? 0 }));
  return (
    <div style={{ height: Math.max(160, data.length * 34) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="label" width={140} tick={{ fill: "var(--nv-text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={14} background={{ fill: "var(--nv-surface-3)" }}>
            {data.map((d) => (
              <Cell key={d.label} fill={scoreColor(d.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

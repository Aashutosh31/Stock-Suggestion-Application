import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  width = 120,
  height = 34,
  className,
  color,
  fill = true,
}: {
  values: (number | null)[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  fill?: boolean;
}) {
  const gradientId = useId();
  const { path, area, strokeColor, up } = useMemo(() => {
    const points = values.filter((v): v is number => v !== null && Number.isFinite(v));
    if (points.length < 2) {
      return { path: "", area: "", strokeColor: color ?? "#909cb4", up: true, empty: true };
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const stepX = width / (points.length - 1);
    const coords = points.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return [x, y] as const;
    });
    const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const areaPath = `${line} L${width},${height} L0,${height} Z`;
    const rising = points[points.length - 1] >= points[0];
    const sc = color ?? (rising ? "#34d399" : "#f43f5e");
    return { path: line, area: areaPath, strokeColor: sc, up: rising, empty: false };
  }, [values, width, height, color]);

  if (!path) return <div className={cn("text-xs text-subtle", className)} style={{ width, height }} />;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill ? <path d={area} fill={`url(#${gradientId})`} /> : null}
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" data-up={up} />
    </svg>
  );
}

import clsx from "clsx";
import { readinessTone } from "@/lib/engine/readiness";

const COLORS = {
  good: { stroke: "#3f7d5a", text: "text-sage-600" },
  fair: { stroke: "#b7791f", text: "text-amber-600" },
  low: { stroke: "#c2412c", text: "text-ember-600" },
  none: { stroke: "#b6bcc9", text: "text-ink-400" },
};

export function ReadinessRing({
  value,
  size = 72,
  stroke = 6,
  label,
  muted,
  className,
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  label?: string;
  muted?: boolean;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  const tone = value === null || muted ? "none" : readinessTone(v);
  const col = COLORS[tone];
  return (
    <div className={clsx("inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" aria-label={label ? `${label} ${value ?? "not monitored"}` : undefined}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9ebf0" strokeWidth={stroke} />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={col.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.2,0.7,0.2,1)" }}
          />
        )}
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={clsx("font-display tabular", col.text)} style={{ fontSize: size * 0.3, fill: "currentColor" }}>
          {value === null ? "—" : v}
        </text>
      </svg>
      {label && <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-500">{label}</div>}
    </div>
  );
}

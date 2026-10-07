"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import type { Domain, ReadinessSnapshot, DomainReadiness } from "@/lib/types";
import { PRIMARY_DOMAINS, DOMAIN_SHORT } from "@/lib/types";
import { isMonitored } from "@/lib/engine/readiness";

const LINE: Record<Domain, string> = {
  HR: "#182c4b",
  DOT: "#2e5a9e",
  SAFETY: "#c2412c",
  CONTRACTOR: "#b7791f",
  RECRUITING: "#8e96a8",
  LEADERSHIP: "#8e96a8",
  OPERATIONS: "#8e96a8",
};

export function ReadinessTrend({ history, current, height = 220 }: { history: ReadinessSnapshot[]; current: Record<Domain, DomainReadiness>; height?: number }) {
  const monitored = PRIMARY_DOMAINS.filter((d) => isMonitored(current[d]));
  const data = [
    ...history.map((h) => ({ label: format(parseISO(h.date), "MMM"), ...Object.fromEntries(monitored.map((d) => [d, h.scores[d]])) })),
    { label: "Now", ...Object.fromEntries(monitored.map((d) => [d, current[d].score])) },
  ];
  return (
    <div style={{ height }} className="-ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e9ebf0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7488" }} axisLine={{ stroke: "#d7dbe3" }} tickLine={false} />
          <YAxis domain={[40, 100]} ticks={[40, 60, 80, 100]} tick={{ fontSize: 12, fill: "#6b7488" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #d7dbe3", fontSize: 13, boxShadow: "0 10px 30px -12px rgba(11,21,38,0.25)" }}
            formatter={(v, name) => [`${v}%`, DOMAIN_SHORT[name as Domain] ?? name]}
          />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} formatter={(v) => DOMAIN_SHORT[v as Domain] ?? v} />
          {monitored.map((d) => (
            <Line key={d} type="monotone" dataKey={d} stroke={LINE[d]} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: LINE[d] }} activeDot={{ r: 5 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

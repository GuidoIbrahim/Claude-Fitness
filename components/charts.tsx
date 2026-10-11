"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { formatDateShort } from "@/lib/dates";

const axis = { stroke: "var(--border)", tick: { fill: "var(--muted)", fontSize: 11 }, tickLine: false as const, axisLine: false as const };
const tooltipStyle = {
  contentStyle: { background: "var(--card-2)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 13 },
  labelStyle: { color: "var(--muted)" },
  itemStyle: { color: "var(--text)" },
  cursor: { fill: "rgba(255,255,255,0.05)" },
};

export function CaloriesChart({ data, target }: { data: { date: string; calories: number }[]; target: number }) {
  const yMax = Math.ceil(Math.max(target * 1.15, ...data.map((d) => d.calories)) / 100) * 100;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
        <XAxis dataKey="date" tickFormatter={formatDateShort} interval="preserveStartEnd" minTickGap={28} {...axis} />
        <YAxis domain={[0, yMax]} {...axis} width={48} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(l) => formatDateShort(String(l))}
          formatter={(v) => [`${Math.round(Number(v))} kcal`, "Consumido"]}
        />
        <ReferenceLine y={target} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: `Meta ${target}`, fill: "var(--muted)", fontSize: 11, position: "insideTopRight" }} />
        <Bar dataKey="calories" fill="var(--kcal)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeightChart({ data }: { data: { date: string; kg: number; trend: number }[] }) {
  const vals = data.flatMap((d) => [d.kg, d.trend]);
  const min = Math.floor(Math.min(...vals) - 1);
  const max = Math.ceil(Math.max(...vals) + 1);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
        <XAxis dataKey="date" tickFormatter={formatDateShort} interval="preserveStartEnd" minTickGap={28} {...axis} />
        <YAxis domain={[min, max]} {...axis} width={48} />
        <Tooltip {...tooltipStyle} labelFormatter={(l) => formatDateShort(String(l))} formatter={(v, n) => [`${Number(v).toFixed(1)} kg`, n === "kg" ? "Pesaje" : "Tendencia"]} />
        <Legend formatter={(v) => (v === "kg" ? "Pesaje" : "Tendencia")} wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
        <Line type="monotone" dataKey="kg" stroke="var(--protein)" strokeWidth={0} dot={{ r: 4, fill: "var(--protein)", stroke: "var(--card)", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="trend" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

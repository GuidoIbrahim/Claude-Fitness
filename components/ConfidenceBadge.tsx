export function ConfidenceBadge({ c }: { c: "low" | "medium" | "high" }) {
  const map = {
    high: ["Confianza alta", "text-accent border-accent/50"],
    medium: ["Confianza media", "text-carbs border-carbs/50"],
    low: ["Confianza baja", "text-danger border-danger/50"],
  } as const;
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${map[c][1]}`}>{map[c][0]}</span>;
}

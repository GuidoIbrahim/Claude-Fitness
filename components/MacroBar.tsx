export function MacroBar({
  label,
  value,
  target,
  color,
  unit = "g",
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = target > 0 && value > target;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={over ? "text-danger" : "text-muted"}>
          <b className="text-text">{Math.round(value)}</b>
          {unit} / {Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-card-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: over ? "var(--danger)" : color }}
        />
      </div>
    </div>
  );
}

export function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const remaining = Math.round(target - consumed);
  const over = remaining < 0;
  return (
    <div className="flex items-center gap-5">
      <svg width="136" height="136" viewBox="0 0 136 136" className="shrink-0">
        <circle cx="68" cy="68" r={r} fill="none" stroke="var(--card-2)" strokeWidth="12" />
        <circle
          cx="68"
          cy="68"
          r={r}
          fill="none"
          stroke={over ? "var(--danger)" : "var(--kcal)"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 68 68)"
          style={{ transition: "stroke-dashoffset .5s" }}
        />
        <text x="68" y="62" textAnchor="middle" fill="var(--text)" fontSize="24" fontWeight="700">
          {Math.round(consumed)}
        </text>
        <text x="68" y="82" textAnchor="middle" fill="var(--muted)" fontSize="12">
          de {Math.round(target)} kcal
        </text>
      </svg>
      <div>
        <div className="text-sm text-muted">{over ? "Te pasaste por" : "Te quedan"}</div>
        <div className={`text-3xl font-bold ${over ? "text-danger" : "text-accent"}`}>
          {Math.abs(remaining)} <span className="text-base font-medium text-muted">kcal</span>
        </div>
      </div>
    </div>
  );
}

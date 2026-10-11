import type { Meal } from "@/lib/types";

const confLabel: Record<string, string> = { high: "alta", medium: "media", low: "baja" };

export function MealCard({ meal, onClick }: { meal: Meal; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="card flex w-full items-center gap-3 p-3 text-left">
      {meal.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/uploads/${meal.photo}`}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-card-2 text-2xl">🍽️</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate font-semibold">{meal.name}</div>
          <div className="shrink-0 text-xs text-muted">{meal.time}</div>
        </div>
        <div className="mt-0.5 text-sm">
          <span className="font-semibold text-kcal">{Math.round(meal.calories)} kcal</span>
          <span className="text-muted"> · </span>
          <span className="text-protein">P {Math.round(meal.protein_g)}</span>
          <span className="text-muted"> · </span>
          <span className="text-carbs">C {Math.round(meal.carbs_g)}</span>
          <span className="text-muted"> · </span>
          <span className="text-fat">G {Math.round(meal.fat_g)}</span>
        </div>
        {meal.source === "ai" && meal.confidence && (
          <div className="mt-0.5 text-[11px] text-muted">IA · confianza {confLabel[meal.confidence]}</div>
        )}
      </div>
    </button>
  );
}

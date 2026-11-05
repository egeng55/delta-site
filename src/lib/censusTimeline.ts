import type { HistorianArchive } from "./historian";

export const censusMetrics = [
  { id: "source_loc", label: "Source lines" },
  { id: "test_loc", label: "Test lines" },
  { id: "source_files", label: "Source files" },
  { id: "unique_tests", label: "Unique tests" },
] as const;

export function censusTimeline(data: HistorianArchive, metric: string) {
  const comparisons = data.growthArchive?.comparisons ?? [{ comparison: data.comparison, snapshots: data.snapshots }];
  const checkpoints = data.growthArchive?.checkpoints ?? data.snapshots;
  const points = [...new Map(checkpoints.map(s => [s.id, s])).values()]
    .filter(s => Number.isFinite(Date.parse(s.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .map(s => {
      // Older publications carry measurements only in their comparison records.
      const candidates = comparisons.flatMap(e => e.snapshots.flatMap((p, i) => {
        if (p.id !== s.id) return [];
        const m = e.comparison.metrics.find(m => m.metric_id === metric);
        return [i === 0 ? m?.previous : m?.current];
      })).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      const conflicting = new Set(candidates).size > 1;
      const raw = s.values ? s.values[metric] : conflicting ? null : candidates[0];
      const value = typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? raw : null;
      return { ...s, value, conflicting };
    });
  const latest = points.at(-1);
  const comparable = latest && latest.scope && latest.methodology !== "unknown"
    ? points.filter(p => p.scope === latest.scope && p.methodology === latest.methodology && p.quality === "complete" && p.value !== null && !p.conflicting)
    : [];
  const first = comparable.length > 1 && comparable.at(-1)?.id === latest?.id ? comparable[0] : null;
  const previous = first ? comparable.at(-2) : null;
  return { points, latest, first, previous,
    totalChange: first && latest?.value != null ? latest.value - first.value! : null,
    recentChange: previous && latest?.value != null ? latest.value - previous.value! : null };
}

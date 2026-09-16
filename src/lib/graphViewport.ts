export const MIN_GRAPH_SCALE = 0.15;
export const MAX_GRAPH_SCALE = 3;
export function boundedGraphScale(value: number) {
  return Number.isFinite(value)
    ? Math.max(MIN_GRAPH_SCALE, Math.min(MAX_GRAPH_SCALE, value))
    : 1;
}

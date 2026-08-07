import type {
  DeltaHqObservabilityDimensionValues,
  DeltaHqObservabilityMetric,
  DeltaHqObservabilityProjection,
  DeltaHqObservabilityTimeSeriesPoint,
} from "./deltaHqViewModel";

export const AGENT_ECONOMICS_SCOPE = "agent_economics";

export const AGENT_ECONOMICS_METRIC_IDS = {
  providerRequests: "agent_economics.provider_requests",
  inputTokens: "agent_economics.input_tokens",
  outputTokens: "agent_economics.output_tokens",
  cachedTokens: "agent_economics.cached_tokens",
  reasoningTokens: "agent_economics.reasoning_tokens",
  latency: "agent_economics.latency_ms",
  successRate: "agent_economics.run_success_rate",
  costPerSuccessfulTask: "agent_economics.cost_per_successful_task",
  cumulativeCost: "agent_economics.cumulative_cost_usd",
  developmentCost: "agent_economics.cumulative_development_cost_usd",
  qualificationCost: "agent_economics.cumulative_qualification_cost_usd",
  operatingCost: "agent_economics.cumulative_operating_cost_usd",
  qualificationSpend: "agent_economics.qualification_spend_usd",
  progressiveScreenSpend: "agent_economics.progressive_screen_spend_usd",
  fullGateSpend: "agent_economics.full_gate_spend_usd",
  failedEvaluationSpend: "agent_economics.failed_evaluation_spend_usd",
  developmentToQualification: "agent_economics.development_to_qualification_cost",
} as const;

export const INTELLIGENT_AGENT_ECONOMICS_OPTIONS = [
  { id: "mission_control", label: "Mission Control" },
  { id: "failure_triage", label: "Failure Triage" },
] as const;

export const QUALIFICATION_FUNNEL_STAGES = [
  { id: "deterministic", label: "Deterministic", spendClass: "development" },
  { id: "live_smoke", label: "Live smoke", spendClass: "qualification" },
  { id: "progressive_screen", label: "Progressive screen", spendClass: "qualification" },
  { id: "targeted_requalification", label: "Targeted requalification", spendClass: "qualification" },
  { id: "full_qualification", label: "Full qualification", spendClass: "qualification" },
  { id: "operation", label: "Operation", spendClass: "operation" },
] as const;

export type DeltaHqAgentEconomicsProfile = {
  agentId: string;
  label: string;
  evidenceState: "available" | "unavailable";
  currentPoints: DeltaHqObservabilityTimeSeriesPoint[];
  historicalPoints: DeltaHqObservabilityTimeSeriesPoint[];
  allPoints: DeltaHqObservabilityTimeSeriesPoint[];
  currentOperationPoints: DeltaHqObservabilityTimeSeriesPoint[];
  qualificationPoints: DeltaHqObservabilityTimeSeriesPoint[];
  developmentPoints: DeltaHqObservabilityTimeSeriesPoint[];
  measurementWindow: {
    from: string | null;
    to: string | null;
  };
  costTrustStates: string[];
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 6,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export function isEconomicsMetric(metric: Pick<DeltaHqObservabilityMetric, "metric_id" | "scope">): boolean {
  return metric.scope === AGENT_ECONOMICS_SCOPE || metric.metric_id.startsWith(`${AGENT_ECONOMICS_SCOPE}.`);
}

export function isEconomicsPoint(point: Pick<DeltaHqObservabilityTimeSeriesPoint, "metric_id">): boolean {
  return point.metric_id.startsWith(`${AGENT_ECONOMICS_SCOPE}.`);
}

export function economicsMetricById(
  metrics: DeltaHqObservabilityMetric[],
  metricId: string,
): DeltaHqObservabilityMetric | null {
  return metrics.find((metric) => metric.metric_id === metricId) || null;
}

export function canonicalEconomicsMetricValue(
  metric: Pick<DeltaHqObservabilityMetric, "value"> | null,
  _dimensionedPoints: DeltaHqObservabilityTimeSeriesPoint[] = [],
): number | null {
  void _dimensionedPoints;
  return metric?.value ?? null;
}

export function economicsCostTrustState(
  datum: Pick<DeltaHqObservabilityMetric | DeltaHqObservabilityTimeSeriesPoint, "cost_trust_state" | "trust_state" | "data_quality_state">,
): string | null {
  if (datum.cost_trust_state) return datum.cost_trust_state;
  if (datum.trust_state === "unpriced" || datum.data_quality_state === "unpriced") return "unpriced";
  return null;
}

export function economicsCostTrustLabel(state: string | null): string {
  if (state === "provider_confirmed") return "Provider-confirmed";
  if (state === "trusted_estimate") return "Trusted estimate";
  if (state === "unpriced") return "Unpriced";
  return "No cost trust";
}

export function isEconomicsCostDatum(
  datum: Pick<DeltaHqObservabilityMetric | DeltaHqObservabilityTimeSeriesPoint, "metric_id" | "unit">,
): boolean {
  return datum.unit === "usd" || /cost|spend/i.test(datum.metric_id);
}

export function formatEconomicsCost(value: number | null, trustState: string | null): string {
  if (trustState === "unpriced") return "Unpriced";
  if (value === null) return "Unavailable";
  return moneyFormatter.format(value);
}

export function formatEconomicsDatumValue(
  datum: Pick<
    DeltaHqObservabilityMetric | DeltaHqObservabilityTimeSeriesPoint,
    "metric_id" | "unit" | "value" | "trust_state" | "data_quality_state" | "cost_trust_state"
  >,
): string {
  if (isEconomicsCostDatum(datum)) {
    return formatEconomicsCost(datum.value, economicsCostTrustState(datum));
  }
  if (datum.value === null) return "Unavailable";
  if (datum.unit === "ratio") return `${Math.round(datum.value * 1000) / 10}%`;
  if (datum.unit === "milliseconds") return `${compactNumberFormatter.format(datum.value)} ms`;
  if (datum.unit === "tokens") return `${compactNumberFormatter.format(datum.value)} tokens`;
  if (datum.unit === "count") return compactNumberFormatter.format(datum.value);
  return `${compactNumberFormatter.format(datum.value)} ${datum.unit}`;
}

function stableDimensionKey(dimensions: DeltaHqObservabilityDimensionValues): string {
  return Object.entries(dimensions)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join("|");
}

export function uniqueEconomicsPoints(
  points: DeltaHqObservabilityTimeSeriesPoint[],
): DeltaHqObservabilityTimeSeriesPoint[] {
  const seen = new Set<string>();
  const unique: DeltaHqObservabilityTimeSeriesPoint[] = [];
  for (const point of points) {
    const key = [
      point.current_state_applicability,
      point.metric_id,
      point.timestamp,
      stableDimensionKey(point.dimension_values),
    ].join("::");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(point);
  }
  return unique;
}

function stringDimension(
  dimensions: DeltaHqObservabilityDimensionValues,
  key: string,
): string | null {
  const value = dimensions[key];
  return typeof value === "string" ? value : null;
}

export function economicsPointsForAgent(
  points: DeltaHqObservabilityTimeSeriesPoint[],
  agentId: string,
): DeltaHqObservabilityTimeSeriesPoint[] {
  return uniqueEconomicsPoints(points.filter((point) => stringDimension(point.dimension_values, "agent_id") === agentId));
}

export function economicsCurrentMetrics(projection: DeltaHqObservabilityProjection): DeltaHqObservabilityMetric[] {
  return projection.metrics.filter(isEconomicsMetric);
}

export function economicsHistoricalMetrics(projection: DeltaHqObservabilityProjection): DeltaHqObservabilityMetric[] {
  return projection.historicalMetrics.filter(isEconomicsMetric);
}

export function currentEconomicsDimensionedPoints(
  projection: DeltaHqObservabilityProjection,
): DeltaHqObservabilityTimeSeriesPoint[] {
  return uniqueEconomicsPoints([
    ...projection.dimensioned_time_series_points.filter(isEconomicsPoint),
    ...projection.metrics.filter(isEconomicsMetric).flatMap((metric) => metric.dimensioned_points.filter(isEconomicsPoint)),
  ]);
}

export function historicalEconomicsDimensionedPoints(
  projection: DeltaHqObservabilityProjection,
): DeltaHqObservabilityTimeSeriesPoint[] {
  return uniqueEconomicsPoints([
    ...projection.historical_dimensioned_time_series_points.filter(isEconomicsPoint),
    ...projection.historicalMetrics.filter(isEconomicsMetric).flatMap((metric) => metric.dimensioned_points.filter(isEconomicsPoint)),
    ...projection.qualificationEpochs.flatMap((epoch) => epoch.dimensioned_time_series_points.filter(isEconomicsPoint)),
  ]);
}

export function allEconomicsDimensionedPoints(
  projection: DeltaHqObservabilityProjection,
): DeltaHqObservabilityTimeSeriesPoint[] {
  return uniqueEconomicsPoints([
    ...currentEconomicsDimensionedPoints(projection),
    ...historicalEconomicsDimensionedPoints(projection),
  ]);
}

export function economicsPhaseForDatum(
  datum: Pick<
    DeltaHqObservabilityMetric | DeltaHqObservabilityTimeSeriesPoint,
    "metric_id" | "current_state_applicability"
  > & { dimension_values?: DeltaHqObservabilityDimensionValues },
): "current_operation" | "qualification" | "development_experimentation" | "historical" | "unavailable" {
  const spendClass = datum.dimension_values ? stringDimension(datum.dimension_values, "spend_class") : null;
  if (spendClass === "operation" || datum.metric_id === AGENT_ECONOMICS_METRIC_IDS.operatingCost) {
    return datum.current_state_applicability === "current_only" ? "current_operation" : "historical";
  }
  if (spendClass === "qualification" || /qualification|evaluation|gate|screen/i.test(datum.metric_id)) {
    return "qualification";
  }
  if (spendClass === "development" || /development/i.test(datum.metric_id)) {
    return "development_experimentation";
  }
  if (datum.current_state_applicability && datum.current_state_applicability !== "current_only") return "historical";
  return "unavailable";
}

export function isCurrentOperationEconomics(
  datum: Parameters<typeof economicsPhaseForDatum>[0],
): boolean {
  return economicsPhaseForDatum(datum) === "current_operation";
}

function agentLabel(agentId: string): string {
  const known = INTELLIGENT_AGENT_ECONOMICS_OPTIONS.find((agent) => agent.id === agentId);
  if (known) return known.label;
  return agentId.replaceAll("_", " ");
}

function combinedWindow(points: DeltaHqObservabilityTimeSeriesPoint[]): DeltaHqAgentEconomicsProfile["measurementWindow"] {
  const fromTimes = points
    .map((point) => point.measurement_time_range.from)
    .filter((value): value is string => Boolean(value));
  const toTimes = points
    .map((point) => point.measurement_time_range.to)
    .filter((value): value is string => Boolean(value));
  if (fromTimes.length === 0 && toTimes.length === 0) return { from: null, to: null };
  return {
    from: fromTimes.sort()[0] || null,
    to: toTimes.sort().at(-1) || null,
  };
}

export function buildAgentEconomicsProfile(
  projection: DeltaHqObservabilityProjection,
  agentId: string,
): DeltaHqAgentEconomicsProfile {
  const currentPoints = economicsPointsForAgent(currentEconomicsDimensionedPoints(projection), agentId);
  const historicalPoints = economicsPointsForAgent(historicalEconomicsDimensionedPoints(projection), agentId);
  const allPoints = uniqueEconomicsPoints([...currentPoints, ...historicalPoints]);
  return {
    agentId,
    label: agentLabel(agentId),
    evidenceState: allPoints.length > 0 ? "available" : "unavailable",
    currentPoints,
    historicalPoints,
    allPoints,
    currentOperationPoints: allPoints.filter(isCurrentOperationEconomics),
    qualificationPoints: allPoints.filter((point) => economicsPhaseForDatum(point) === "qualification"),
    developmentPoints: allPoints.filter((point) => economicsPhaseForDatum(point) === "development_experimentation"),
    measurementWindow: combinedWindow(allPoints),
    costTrustStates: [...new Set(allPoints.map(economicsCostTrustState).filter((state): state is string => Boolean(state)))].sort(),
  };
}

export function buildAgentEconomicsProfiles(
  projection: DeltaHqObservabilityProjection,
): DeltaHqAgentEconomicsProfile[] {
  const agentIds = new Set<string>(INTELLIGENT_AGENT_ECONOMICS_OPTIONS.map((agent) => agent.id));
  for (const point of allEconomicsDimensionedPoints(projection)) {
    const agentId = stringDimension(point.dimension_values, "agent_id");
    if (agentId) agentIds.add(agentId);
  }
  return [...agentIds].map((agentId) => buildAgentEconomicsProfile(projection, agentId));
}

export function summarizeAgentEconomicsForAsk(profile: DeltaHqAgentEconomicsProfile): string {
  if (profile.evidenceState === "unavailable") {
    return `${profile.label} economics unavailable from canonical projection`;
  }
  const examples = profile.allPoints
    .slice(0, 5)
    .map((point) => `${point.metric_id}:${formatEconomicsDatumValue(point)}:${economicsCostTrustLabel(economicsCostTrustState(point))}`);
  return [
    `${profile.label} economics evidence available`,
    `current operation slices: ${profile.currentOperationPoints.length}`,
    `qualification slices: ${profile.qualificationPoints.length}`,
    `development slices: ${profile.developmentPoints.length}`,
    `cost trust: ${profile.costTrustStates.map(economicsCostTrustLabel).join(", ") || "none"}`,
    `examples: ${examples.join(", ")}`,
  ].join("; ");
}

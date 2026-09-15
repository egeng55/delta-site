export type PublicCapabilityState =
  | "core"
  | "available"
  | "private_preview"
  | "proof"
  | "research"
  | "internal";

export type PublicCapabilitySurface =
  | "home"
  | "product"
  | "research"
  | "access"
  | "insights";

export interface PublicCapabilityStateDefinition {
  label: string;
  meaning: string;
  mayBePresentedAsCurrentProduct: boolean;
}

export interface PublicCapability {
  id: string;
  name: string;
  state: PublicCapabilityState;
  summary: string;
  boundary: string;
  publiclyVisible: boolean;
  surfaces: PublicCapabilitySurface[];
}

export interface CuratedPublicProof {
  capabilityId: string;
  question: string;
  demonstrates: string[];
  doesNotProve: string;
}

export const PUBLIC_ACCESS_POLICY = {
  mode: "request_access",
  label: "Request access",
  requestPath: "/signup",
  loginPath: "/login?redirect=/command",
  statement:
    "Delta is a manually approved private preview. Public account creation is closed, and submitting a request does not guarantee access.",
  approvalScope:
    "Approved access covers only capabilities marked private preview in this manifest.",
};

export const PUBLIC_CAPABILITY_STATE_DEFINITIONS: Record<
  PublicCapabilityState,
  PublicCapabilityStateDefinition
> = {
  core: {
    label: "Core",
    meaning: "Part of Delta's defining public identity and enduring product direction.",
    mayBePresentedAsCurrentProduct: true,
  },
  available: {
    label: "Available",
    meaning: "Broadly accessible and supported as a current public capability.",
    mayBePresentedAsCurrentProduct: true,
  },
  private_preview: {
    label: "Private preview",
    meaning: "Usable only by manually approved preview accounts within an explicit boundary.",
    mayBePresentedAsCurrentProduct: true,
  },
  proof: {
    label: "Proof",
    meaning: "Demonstrated under bounded conditions, but not offered as a general product capability.",
    mayBePresentedAsCurrentProduct: false,
  },
  research: {
    label: "Research",
    meaning: "Active exploration that may be discussed without implying availability or proof.",
    mayBePresentedAsCurrentProduct: false,
  },
  internal: {
    label: "Internal",
    meaning: "Engineering, governance, evaluation, or operator infrastructure excluded from public product claims.",
    mayBePresentedAsCurrentProduct: false,
  },
};

export const INTELLIGENCE_LOOP = [
  {
    id: "context",
    label: "Context",
    question: "What is happening now?",
    description: "Delta considers the recent information that is relevant to the current decision.",
  },
  {
    id: "state",
    label: "State",
    question: "What matters right now?",
    description: "It distinguishes current conditions from durable facts and unresolved uncertainty.",
  },
  {
    id: "hypothesis",
    label: "Hypothesis",
    question: "What might explain it?",
    description: "It forms a testable interpretation without presenting a pattern as settled fact.",
  },
  {
    id: "action",
    label: "Action",
    question: "What is the best next move?",
    description: "It recommends, asks, waits, or stays quiet according to usefulness and owner authority.",
  },
  {
    id: "feedback",
    label: "Feedback",
    question: "Was that actually useful?",
    description: "The owner can accept, correct, dismiss, or redirect what Delta suggested.",
  },
  {
    id: "learning",
    label: "Learning",
    question: "What should change next time?",
    description: "Evidence updates future timing, confidence, recommendations, or silence within a bounded policy.",
  },
];

export const PUBLIC_CAPABILITIES: PublicCapability[] = [
  {
    id: "personal-intelligence-loop",
    name: "Personal intelligence loop",
    state: "core",
    summary:
      "Delta connects context, state, hypotheses, actions, feedback, and learning to improve the next decision over time.",
    boundary:
      "This is Delta's defining product model, not a claim that every layer is broadly available today.",
    publiclyVisible: true,
    surfaces: ["home", "product"],
  },
  {
    id: "owner-authority",
    name: "Owner authority",
    state: "core",
    summary:
      "Delta should explain what it knows, ask before consequential action, and remain correctable by its owner.",
    boundary:
      "Owner control is a product requirement; it does not imply that every planned control is already implemented.",
    publiclyVisible: true,
    surfaces: ["product"],
  },
  {
    id: "whoop-connected-context",
    name: "Connected WHOOP context",
    state: "private_preview",
    summary:
      "Approved owners can connect WHOOP, refresh normalized records deliberately, and use compact read-only context through Delta.",
    boundary:
      "Access is owner-scoped, provider tools are read-only, and this does not make Delta a general health product.",
    publiclyVisible: true,
    surfaces: ["home", "product", "research", "access", "insights"],
  },
  {
    id: "preview-control-surface",
    name: "Private preview controls",
    state: "private_preview",
    summary:
      "Approved owners can inspect connection state, freshness, model-facing access, and relevant approval boundaries.",
    boundary:
      "The control surface does not provide broad personal memory, general insights, or autonomous actions.",
    publiclyVisible: true,
    surfaces: ["access"],
  },
  {
    id: "late-caffeine-adaptation",
    name: "Late-caffeine adaptation",
    state: "proof",
    summary:
      "A bounded scenario shows Delta interpreting context, deciding whether to intervene, receiving feedback, and changing future behavior.",
    boundary:
      "It proves one adaptive behavior loop, not general health coaching, broad memory, or autonomous intervention.",
    publiclyVisible: true,
    surfaces: ["home", "product", "research", "insights"],
  },
  {
    id: "weather-fueling-composition",
    name: "Weather and fueling composition",
    state: "proof",
    summary:
      "A bounded answer can combine current weather context with a deterministic fueling estimate when both affect the decision.",
    boundary:
      "It proves relevant context can be combined without claiming cross-domain memory, ongoing learning, or autonomous action.",
    publiclyVisible: true,
    surfaces: ["home", "product", "research", "insights"],
  },
  {
    id: "broader-personal-intelligence",
    name: "Broader personal intelligence",
    state: "research",
    summary:
      "Delta is exploring durable cross-domain context, personal briefs, insights, recommendations, voice, and proactive support.",
    boundary:
      "These capabilities are not included in private preview access and must not be presented as available or proven.",
    publiclyVisible: true,
    surfaces: ["home", "product", "research", "insights"],
  },
  {
    id: "engineering-agent-system",
    name: "Engineering agent system",
    state: "internal",
    summary: "Delta's supervised engineering automation remains an internal operating system.",
    boundary: "It is not a consumer personal-intelligence capability.",
    publiclyVisible: false,
    surfaces: [],
  },
  {
    id: "architecture-and-history-systems",
    name: "Architecture and historian systems",
    state: "internal",
    summary: "Architecture governance and historical records maintain structural and temporal truth.",
    boundary: "They inform public claims but are not public product features.",
    publiclyVisible: false,
    surfaces: [],
  },
  {
    id: "technical-cockpits",
    name: "Technical cockpits and evaluation surfaces",
    state: "internal",
    summary: "Local OS consoles, development dashboards, and raw evaluation fixtures support engineering work.",
    boundary: "They remain gated from production and excluded from public capability claims.",
    publiclyVisible: false,
    surfaces: [],
  },
  {
    id: "external-web-monitoring",
    name: "External web monitoring",
    state: "internal",
    summary: "Bounded external-signal and market-intelligence tooling remains internal.",
    boundary: "It is not currently presented as a public Delta product capability.",
    publiclyVisible: false,
    surfaces: [],
  },
];

export const CURATED_PUBLIC_PROOFS: CuratedPublicProof[] = [
  {
    capabilityId: "late-caffeine-adaptation",
    question: "Can feedback change what Delta does next time?",
    demonstrates: [
      "Recognizes when late caffeine may be relevant.",
      "Can recommend, wait, or stay quiet instead of interrupting automatically.",
      "Uses explicit feedback to adjust timing, tone, cooldown, or suppression.",
    ],
    doesNotProve:
      "This does not prove general health coaching, broad personal memory, or autonomous intervention.",
  },
  {
    capabilityId: "weather-fueling-composition",
    question: "Can Delta combine two useful contexts into one answer?",
    demonstrates: [
      "Uses current weather only when that context matters to the question.",
      "Combines it with a deterministic fueling estimate rather than presenting two disconnected tools.",
      "Produces one bounded answer without taking action on the owner's behalf.",
    ],
    doesNotProve:
      "This does not prove persistent cross-domain memory, continuous learning, or autonomous action.",
  },
];

export function getPublicCapabilitiesForSurface(
  surface: PublicCapabilitySurface,
): PublicCapability[] {
  return PUBLIC_CAPABILITIES.filter(
    capability => capability.publiclyVisible && capability.surfaces.includes(surface),
  );
}

export function getPublicCapability(capabilityId: string): PublicCapability | undefined {
  return PUBLIC_CAPABILITIES.find(capability => capability.id === capabilityId);
}

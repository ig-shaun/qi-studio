export type ViewId =
  | "intent"
  | "organism"
  | "loops"
  | "pods"
  | "roles"
  | "agents"
  | "flow"
  | "governance"
  | "fitness"
  | "migration"
  | "changelog";

export type ViewDef = {
  id: ViewId;
  label: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export const VIEWS: ViewDef[] = [
  {
    id: "intent",
    label: "Intent",
    eyebrow: "Intent view",
    title: "Intent Kernel",
    subtitle: "Purpose, outcomes, constraints, and sovereignty zones.",
  },
  {
    id: "organism",
    label: "Organism",
    eyebrow: "System view",
    title: "Organism",
    subtitle:
      "The organisational structure. Value loops, PODs, and roles clusters flow outwards from the central mission.",
  },
  {
    id: "loops",
    label: "Value Loops",
    eyebrow: "Flow view",
    title: "Value Loops",
    subtitle: "Repeating cycles that keep intent alive.",
  },
  {
    id: "pods",
    label: "POD Protocols",
    eyebrow: "Structure view",
    title: "POD Protocols",
    subtitle:
      "Autonomous human-agent teams. Team Topologies + Holacracy circles.",
  },
  {
    id: "roles",
    label: "Role Lattice",
    eyebrow: "Capability view",
    title: "Role Lattice",
    subtitle: "Roles as capability-accountability bundles.",
  },
  {
    id: "agents",
    label: "Agent Delegation",
    eyebrow: "Delegation view",
    title: "Agent Delegation",
    subtitle: "Contracts, autonomy bands, supervising humans.",
  },
  {
    id: "flow",
    label: "Intelligence Flows",
    eyebrow: "Signal view",
    title: "Intelligence Flows",
    subtitle: "Sensing, meaning, decisioning, execution, learning.",
  },
  {
    id: "governance",
    label: "Governance",
    eyebrow: "Policy view",
    title: "Governance",
    subtitle: "Checkpoints, policies, audit, escalation.",
  },
  {
    id: "fitness",
    label: "Fitness Lab",
    eyebrow: "Simulation view",
    title: "Fitness Lab",
    subtitle: "Stress tests and design fitness.",
  },
  {
    id: "migration",
    label: "Migration Plan",
    eyebrow: "Path view",
    title: "Migration Plan",
    subtitle: "Sequenced narrative for moving from source scenario to target.",
  },
  {
    id: "changelog",
    label: "Changelog",
    eyebrow: "Activity view",
    title: "Changelog",
    subtitle: "Every patch applied to this scenario.",
  },
];

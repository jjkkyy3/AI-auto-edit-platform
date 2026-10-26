export type DemoStatus = "pending" | "running" | "review" | "passed" | "failed";
export type NodeKind =
  | "input"
  | "generation"
  | "review"
  | "asset"
  | "split"
  | "merge"
  | "process"
  | "export"
  | "shot";

export interface DemoNode {
  id: string;
  label: string;
  description: string;
  kind: NodeKind;
  status: DemoStatus;
  code: string;
  inputs: string[];
  outputs: string[];
  config: { modelId: string; prompt: string; reviewComment: string };
  logs: string[];
  versions: string[];
  children?: DemoNode[];
}

export interface DemoShot {
  id: string;
  name: string;
  description: string;
  duration: number;
  characterIds: string[];
  sceneId: string;
  steps: DemoNode[];
}

export interface DemoAsset {
  id: string;
  name: string;
  description: string;
  status: DemoStatus;
  initials: string;
  color: string;
  version: string;
}

export interface DemoProject {
  id: string;
  name: string;
  episode: string;
  format: string;
  script: string;
  stages: DemoNode[];
  shots: DemoShot[];
  characters: DemoAsset[];
  scenes: DemoAsset[];
}

export const statusMeta: Record<DemoStatus, { label: string; color: string }> =
  {
    pending: { label: "待执行", color: "#949caa" },
    running: { label: "运行中", color: "#5266db" },
    review: { label: "待审核", color: "#b57a16" },
    passed: { label: "已通过", color: "#36876e" },
    failed: { label: "失败", color: "#c85d65" },
  };

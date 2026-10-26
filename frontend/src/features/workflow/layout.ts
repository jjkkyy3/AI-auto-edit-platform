import type {
  DemoNode,
  DemoProject,
  DemoShot,
  DemoStatus,
} from "../../types/workflow.ts";

export const CARD_WIDTH = 208;
export const CARD_HEIGHT = 152;
const GAP = 72;
const STEP = CARD_WIDTH + GAP;
const ROW_GAP = 210;

export interface LayoutItem {
  id: string;
  position: { x: number; y: number };
  spec: DemoNode;
  expanded?: boolean;
  expandable?: boolean;
  shot?: DemoShot;
}
export interface LayoutLink {
  id: string;
  source: string;
  target: string;
  status: DemoStatus;
}

/** Pure view projection of Mock data. Does not execute nodes or propagate statuses. */
export function layoutWorkflow(
  project: DemoProject,
  expanded: ReadonlySet<string>,
) {
  const nodes: LayoutItem[] = [];
  const edges: LayoutLink[] = [];
  const link = (
    source: string,
    target: string,
    status: DemoStatus = "pending",
  ) => edges.push({ id: `${source}--${target}`, source, target, status });
  let x = 40;
  let tail: DemoNode | undefined;
  const splitIndex = project.stages.findIndex(
    (stage) => stage.kind === "split",
  );
  for (const stage of project.stages.slice(0, splitIndex + 1)) {
    nodes.push({
      id: stage.id,
      spec: stage,
      position: { x, y: 0 },
      expandable: !!stage.children,
      expanded: expanded.has(stage.id),
    });
    if (tail) link(tail.id, stage.id, tail.status);
    tail = stage;
    x += STEP;
    if (stage.children && expanded.has(stage.id)) {
      for (const child of stage.children) {
        nodes.push({ id: child.id, spec: child, position: { x, y: 0 } });
        link(tail.id, child.id, tail.status);
        tail = child;
        x += STEP;
      }
    }
  }
  const splitter = tail;
  const branchesX = x;
  const maxExpanded = project.shots.reduce(
    (max, s) => Math.max(max, expanded.has(s.id) ? s.steps.length : 0),
    0,
  );
  const mergerX = branchesX + STEP * (1 + maxExpanded);
  const branchTails: { id: string; status: DemoStatus }[] = [];
  project.shots.forEach((shot, index) => {
    const y = (index - (project.shots.length - 1) / 2) * ROW_GAP;
    const status = summarizeShot(shot);
    const spec: DemoNode = {
      id: shot.id,
      code: `SHOT ${String(index + 1).padStart(2, "0")}`,
      label: shot.name,
      description: shot.description,
      kind: "shot",
      status,
      inputs: [...shot.characterIds, shot.sceneId],
      outputs: ["分镜素材包 · Demo"],
      config: { modelId: "", prompt: "", reviewComment: "" },
      logs: ["[Demo] 分镜容器仅展示六步 Mock 状态"],
      versions: [],
    };
    nodes.push({
      id: shot.id,
      spec,
      shot,
      expandable: true,
      expanded: expanded.has(shot.id),
      position: { x: branchesX, y },
    });
    if (splitter) link(splitter.id, shot.id, "passed");
    let branchTail = { id: shot.id, status };
    if (expanded.has(shot.id))
      shot.steps.forEach((step, stepIndex) => {
        nodes.push({
          id: step.id,
          spec: step,
          position: { x: branchesX + (stepIndex + 1) * STEP, y },
        });
        link(branchTail.id, step.id, branchTail.status);
        branchTail = { id: step.id, status: step.status };
      });
    branchTails.push(branchTail);
  });
  x = mergerX;
  tail = undefined;
  for (const stage of project.stages.slice(splitIndex + 1)) {
    nodes.push({ id: stage.id, spec: stage, position: { x, y: 0 } });
    if (tail) link(tail.id, stage.id, tail.status);
    else branchTails.forEach((end) => link(end.id, stage.id, end.status));
    tail = stage;
    x += STEP;
  }
  return { nodes, edges };
}

export function summarizeShot(shot: DemoShot): DemoStatus {
  for (const status of ["failed", "running", "review"] as const)
    if (shot.steps.some((step) => step.status === status)) return status;
  return shot.steps.every((step) => step.status === "passed")
    ? "passed"
    : "pending";
}

export function findDemoNode(
  project: DemoProject,
  id: string,
): DemoNode | undefined {
  const top = project.stages.find((s) => s.id === id);
  return (
    top ??
    project.stages.flatMap((s) => s.children ?? []).find((s) => s.id === id) ??
    project.shots.flatMap((s) => s.steps).find((s) => s.id === id)
  );
}

export function updateDemoNode(
  project: DemoProject,
  id: string,
  change: (node: DemoNode) => DemoNode,
): DemoProject {
  const update = (n: DemoNode): DemoNode =>
    n.id === id
      ? change(n)
      : n.children
        ? { ...n, children: n.children.map(update) }
        : n;
  return {
    ...project,
    stages: project.stages.map(update),
    shots: project.shots.map((s) => ({ ...s, steps: s.steps.map(update) })),
  };
}

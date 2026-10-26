import { MarkerType, type Edge } from "@xyflow/react";
import { layoutWorkflow } from "./layout";
import type { WorkflowViewNode } from "./WorkflowNode";
import type { DemoProject } from "../../types/workflow";

export function createGraph(
  project: DemoProject,
  expanded: ReadonlySet<string>,
  onToggle: (id: string) => void,
) {
  const layout = layoutWorkflow(project, expanded);
  const nodes: WorkflowViewNode[] = layout.nodes.map((item) => ({
    id: item.id,
    type: "workflow",
    position: item.position,
    data: { item, onToggle },
    width: 208,
    height: 152,
  }));
  const edges: Edge[] = layout.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    animated: edge.status === "running",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: edge.status === "passed" ? "#8eaaa0" : "#b9c1cf",
    },
    style: {
      stroke: edge.status === "passed" ? "#8eaaa0" : "#b9c1cf",
      strokeWidth: 1.5,
    },
    pathOptions: { borderRadius: 16 },
  }));
  return { nodes, edges };
}

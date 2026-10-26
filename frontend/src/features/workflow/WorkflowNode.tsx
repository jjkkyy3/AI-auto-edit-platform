import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  BranchesOutlined,
  CheckOutlined,
  FileTextOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  NodeIndexOutlined,
  FolderOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
  MergeCellsOutlined,
} from "@ant-design/icons";
import type { LayoutItem } from "./layout";
import { statusMeta } from "../../types/workflow";
import { StatusBadge } from "../../components/StatusBadge";

export type WorkflowViewNode = Node<
  { item: LayoutItem; onToggle: (id: string) => void },
  "workflow"
>;
const icons = {
  input: FileTextOutlined,
  generation: PlayCircleOutlined,
  review: CheckOutlined,
  asset: PictureOutlined,
  split: BranchesOutlined,
  merge: MergeCellsOutlined,
  process: NodeIndexOutlined,
  export: FolderOutlined,
  shot: PlayCircleOutlined,
};

export const WorkflowNode = memo(function WorkflowNode({
  data,
  selected,
}: NodeProps<WorkflowViewNode>) {
  const { item, onToggle } = data;
  const { spec } = item;
  const Icon = icons[spec.kind];
  return (
    <div
      className={`workflow-card ${selected ? "is-selected" : ""} ${item.shot ? "shot-card" : ""}`}
      data-testid={`card-${spec.id}`}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <div className="node-top">
        <span className={`node-symbol kind-${spec.kind}`}>
          <Icon />
        </span>
        <span className="node-code">{spec.code}</span>
        {item.expandable && (
          <button
            className="expand-button nodrag nopan"
            aria-label={`${item.expanded ? "折叠" : "展开"}${item.shot ? item.shot.id.replace("shot-", "分镜 ") : spec.label}`}
            aria-expanded={!!item.expanded}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(spec.id);
            }}
          >
            {item.expanded ? <ShrinkOutlined /> : <ExpandAltOutlined />}
          </button>
        )}
      </div>
      <div className="node-title">{spec.label}</div>
      <div className="node-description">{spec.description}</div>
      <div className="node-bottom">
        <StatusBadge status={spec.status} />
        <span className="node-footnote">
          {item.shot
            ? `${item.shot.duration}s · 6 步`
            : item.expandable
              ? `${spec.children?.length ?? 0} 个子节点`
              : "Demo"}
        </span>
      </div>
      {item.shot && (
        <div className="shot-dots" aria-label="分镜六步模拟状态">
          {item.shot.steps.map((step) => (
            <span
              key={step.id}
              title={`${step.code} ${step.label} · ${statusMeta[step.status].label}`}
              style={{ background: statusMeta[step.status].color }}
            />
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
});

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Viewport,
} from "@xyflow/react";
import { Button, Tooltip } from "antd";
import {
  AimOutlined,
  MinusOutlined,
  PlusOutlined,
  ApartmentOutlined,
  BorderOuterOutlined,
} from "@ant-design/icons";
import { WorkflowNode, type WorkflowViewNode } from "./WorkflowNode";
import { createGraph } from "./graph";
import type { DemoProject } from "../../types/workflow";

const nodeTypes = { workflow: WorkflowNode };
interface Props {
  project: DemoProject;
  selectedId: string | null;
  expanded: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

function Canvas({ project, selectedId, expanded, onToggle, onSelect }: Props) {
  const { fitView, zoomIn, zoomOut, setCenter } =
    useReactFlow<WorkflowViewNode>();
  const graph = useMemo(
    () => createGraph(project, expanded, onToggle),
    [project, expanded, onToggle],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowViewNode>(
    graph.nodes,
  );
  const [zoom, setZoom] = useState(0.65);
  // Preserve dragged positions across Mock edits. Expansion changes use the layout projection.
  const [layoutKey, setLayoutKey] = useState("");
  const nextLayoutKey = [...expanded].sort().join("|");
  useEffect(() => {
    const relayout = layoutKey !== nextLayoutKey;
    setNodes((current) =>
      graph.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedId,
        position: relayout
          ? node.position
          : (current.find((n) => n.id === node.id)?.position ?? node.position),
      })),
    );
    if (relayout) setLayoutKey(nextLayoutKey);
  }, [graph, selectedId, layoutKey, nextLayoutKey, setNodes]);

  const focusShots = useCallback(() => {
    const ids = graph.nodes
      .filter(
        (n) => n.data.item.shot || n.id === "splitter" || n.id === "merger",
      )
      .map((n) => ({ id: n.id }));
    void fitView({ nodes: ids, padding: 0.28, duration: 350, maxZoom: 1 });
  }, [fitView, graph.nodes]);

  return (
    <div className="canvas-wrapper" data-testid="workflow-canvas">
      <ReactFlow<WorkflowViewNode>
        nodes={nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => onSelect(node.id)}
        minZoom={0.12}
        maxZoom={1.5}
        defaultViewport={{ x: 50, y: 300, zoom: 0.65 }}
        onInit={(instance) => {
          void instance.setCenter(1830, 60, { zoom: 0.7 });
        }}
        onMove={(_, viewport: Viewport) => setZoom(viewport.zoom)}
        nodesConnectable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
        panOnScroll
        selectionKeyCode="Shift"
        fitView={false}
        aria-label="AI 短剧横向工作流 Demo"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="#dfe3eb"
        />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          nodeColor={(n) => (n.id.startsWith("shot") ? "#a7b3ef" : "#d6dce7")}
          maskColor="rgba(246,248,251,.65)"
          ariaLabel="工作流缩略图"
        />
      </ReactFlow>
      <div className="canvas-label">
        <span className="tiny-square" />
        整集生产工作流<span className="muted">/</span>
        <span className="muted">从左向右执行</span>
      </div>
      <div className="canvas-jumps">
        <Button
          size="small"
          icon={<BorderOuterOutlined />}
          onClick={() => {
            void setCenter(650, 70, { zoom: 0.8, duration: 350 });
          }}
        >
          前期筹备
        </Button>
        <Button size="small" icon={<ApartmentOutlined />} onClick={focusShots}>
          分镜生产区
        </Button>
        <Button
          size="small"
          onClick={() => {
            const node = nodes.find((n) => n.id === "compose");
            if (node)
              void setCenter(node.position.x, 60, { zoom: 0.8, duration: 350 });
          }}
        >
          后期交付
        </Button>
      </div>
      <div className="canvas-controls">
        <Tooltip title="缩小">
          <Button
            aria-label="缩小画布"
            icon={<MinusOutlined />}
            onClick={() => {
              void zoomOut({ duration: 200 });
            }}
          />
        </Tooltip>
        <span>{Math.round(zoom * 100)}%</span>
        <Tooltip title="放大">
          <Button
            aria-label="放大画布"
            icon={<PlusOutlined />}
            onClick={() => {
              void zoomIn({ duration: 200 });
            }}
          />
        </Tooltip>
        <i />
        <Button
          icon={<AimOutlined />}
          onClick={() => {
            void fitView({ padding: 0.12, duration: 350 });
          }}
        >
          适应画布
        </Button>
      </div>
      <div className="canvas-hint">
        拖动画布平移<span>·</span>滚轮平移 / 双指缩放<span>·</span>
        点击节点查看详情
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}

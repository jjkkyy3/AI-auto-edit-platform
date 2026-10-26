import { useCallback, useMemo, useState } from "react";
import { App, Button } from "antd";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  FileImageOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { createMockProject } from "../mocks/project";
import { WorkflowCanvas } from "../features/workflow/WorkflowCanvas";
import { NodeDetails } from "../features/workflow/NodeDetails";
import { AssetWorkspace } from "../features/assets/AssetWorkspace";
import { findDemoNode, updateDemoNode } from "../features/workflow/layout";
import type { DemoNode } from "../types/workflow";

const nav = [
  { key: "overview", label: "项目概览", icon: AppstoreOutlined },
  { key: "workflow", label: "工作流", icon: ApartmentOutlined },
  { key: "characters", label: "人物资产", icon: TeamOutlined },
  { key: "scenes", label: "场景资产", icon: FileImageOutlined },
  { key: "library", label: "素材库", icon: FolderOpenOutlined },
  { key: "settings", label: "设置", icon: SettingOutlined },
];

export function WorkflowPage() {
  const { message, modal } = App.useApp();
  const [project, setProject] = useState(createMockProject);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [assetKind, setAssetKind] = useState<"characters" | "scenes" | null>(
    null,
  );
  const [edited, setEdited] = useState(false);
  const selected = useMemo(
    () => (selectedId ? findDemoNode(project, selectedId) : undefined),
    [project, selectedId],
  );
  const toggle = useCallback(
    (id: string) => {
      setExpanded((old) => {
        const next = new Set(old);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setSelectedId((old) =>
        old &&
        ((id.startsWith("shot-") && old.startsWith(`${id}-`)) ||
          project.stages
            .find((stage) => stage.id === id)
            ?.children?.some((child) => child.id === old))
          ? id
          : old,
      );
    },
    [project.stages],
  );
  const select = (id: string) => {
    if (id === "characters" || id === "scenes") {
      setAssetKind(id);
      return;
    }
    const found = findDemoNode(project, id);
    if (found) setSelectedId(id);
    else if (id.startsWith("shot-")) {
      setExpanded((old) => new Set(old).add(id));
      setSelectedId(`${id}-s1`);
    }
  };
  const change = (id: string, patch: Partial<DemoNode["config"]>) => {
    setProject((old) =>
      updateDemoNode(old, id, (node) => ({
        ...node,
        config: { ...node.config, ...patch },
      })),
    );
    setEdited(true);
  };
  const review = (id: string, passed: boolean) => {
    setProject((old) =>
      updateDemoNode(old, id, (node) => ({
        ...node,
        status: passed ? "passed" : "failed",
        logs: [
          ...node.logs,
          `[Demo] 模拟${passed ? "审核通过" : "审核驳回"}，不执行下游`,
        ],
      })),
    );
    setEdited(true);
    void message.info(
      `Demo：仅更新当前节点为${passed ? "已通过" : "失败"}，未执行任何后台操作`,
    );
  };
  const openNav = (key: string) => {
    if (key === "workflow") return;
    if (key === "characters" || key === "scenes") {
      setAssetKind(key);
      return;
    }
    modal.info({
      title: `${nav.find((item) => item.key === key)?.label} · Demo`,
      content:
        key === "overview" ? (
          <>
            <p>
              {project.name} / {project.episode}
            </p>
            <p>{project.script}</p>
            <p>3 个人物 · 2 处场景 · 3 条分镜</p>
          </>
        ) : (
          "此入口为 P0-02 占位。当前任务仅实现工作流画布与 Mock 交互。"
        ),
      okText: "知道了",
    });
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        跳转到工作流
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <strong>
            映序<span>STUDIO</span>
          </strong>
        </div>
        <div className="project-crumb">
          <span>短剧项目</span>
          <b>/</b>
          <strong>{project.name}</strong>
          <span className="episode-badge">{project.episode}</span>
        </div>
        <div className="topbar-actions">
          <span className="save-status">
            <CheckCircleOutlined />
            {edited ? "修改留在当前页面" : "示例已载入"}
            <small>未持久化</small>
          </span>
          <Button
            icon={<CloudOutlined />}
            onClick={() =>
              modal.info({
                title: "模型中心 · Demo 占位",
                content:
                  "生成节点内可编辑模拟模型配置。此处未接入 API、凭据或模型服务。",
                okText: "知道了",
              })
            }
          >
            模型中心
          </Button>
          <span className="avatar" aria-label="演示用户">
            D
          </span>
        </div>
      </header>
      <aside className="sidebar">
        <div className="workspace-label">
          创作空间 <span>DEMO</span>
        </div>
        <nav aria-label="项目导航">
          {nav.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${item.key === "workflow" ? "active" : ""}`}
              aria-current={item.key === "workflow" ? "page" : undefined}
              onClick={() => openNav(item.key)}
            >
              <item.icon />
              <span>{item.label}</span>
              {item.key === "characters" && <small>3</small>}
              {item.key === "scenes" && <small>2</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="project-mini">
            <span className="project-mini-icon">
              <BookOutlined />
            </span>
            <div>
              <strong>{project.name}</strong>
              <small>电影写实 · 短剧项目</small>
            </div>
          </div>
          <div className="sidebar-note">
            <span className="live-dot" />
            P0-02 前端演示
          </div>
        </div>
      </aside>
      <main id="workspace" className="workspace">
        <div className="page-heading">
          <div>
            <div className="breadcrumb">
              <ArrowLeftOutlined />
              <span>{project.name}</span>
              <span>/</span>
              <span>制作工作台</span>
            </div>
            <h1>
              让故事，一镜一镜发生。<span className="demo-pill">DEMO</span>
            </h1>
            <p>在画布上编排创作，随时检查每一份灵感与产物。</p>
          </div>
          <div className="heading-actions">
            <Button
              onClick={() => {
                setExpanded(new Set());
                setSelectedId(null);
              }}
            >
              折叠所有节点
            </Button>
            <Button
              type="text"
              aria-label="演示说明"
              icon={<MoreOutlined />}
              onClick={() =>
                modal.info({
                  title: "P0-02 演示说明",
                  content:
                    "所有模型、日志、素材与运行状态均为独立 Mock 数据。刷新页面会重置。节点展开与编辑不会启动任何执行任务。",
                  okText: "知道了",
                })
              }
            />
          </div>
        </div>
        <div className="workflow-bar">
          <div className="workflow-tab">
            <ApartmentOutlined />
            工作流画布<span>11 阶段</span>
          </div>
          <div className="workflow-meta">
            <span>3 条分镜</span>
            <i />
            <span>{project.format}</span>
            <i />
            <span className="demo-data-label">模拟数据 · 不执行生成</span>
          </div>
        </div>
        <div className="editor-area">
          <WorkflowCanvas
            project={project}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={toggle}
            onSelect={select}
          />
          {selected && (
            <NodeDetails
              key={selected.id}
              node={selected}
              onClose={() => setSelectedId(null)}
              onChange={change}
              onReview={review}
            />
          )}
        </div>
        <footer className="workspace-footer">
          <div className="legend">
            <span>
              <i className="legend-passed" />
              已通过
            </span>
            <span>
              <i className="legend-running" />
              运行中
            </span>
            <span>
              <i className="legend-review" />
              待审核
            </span>
            <span>
              <i className="legend-pending" />
              待执行
            </span>
            <span>
              <i className="legend-failed" />
              失败
            </span>
          </div>
          <span>Mock 状态仅供交互演示，无后台连接</span>
        </footer>
      </main>
      <AssetWorkspace
        project={project}
        kind={assetKind}
        onClose={() => setAssetKind(null)}
      />
    </div>
  );
}

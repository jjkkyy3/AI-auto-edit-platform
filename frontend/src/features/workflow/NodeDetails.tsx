import { Button, Input, Select, Tabs } from "antd";
import {
  CloseOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CheckOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { DemoNode } from "../../types/workflow";
import { StatusBadge } from "../../components/StatusBadge";
import { demoModels } from "../../mocks/project";

interface Props {
  node: DemoNode;
  onClose: () => void;
  onChange: (id: string, patch: Partial<DemoNode["config"]>) => void;
  onReview: (id: string, passed: boolean) => void;
}
export function NodeDetails({ node, onClose, onChange, onReview }: Props) {
  return (
    <aside
      className="detail-panel"
      aria-label="节点详情工作台"
      data-testid="node-details"
    >
      <div className="detail-heading">
        <div>
          <span className="eyebrow">NODE INSPECTOR</span>
          <h2>{node.label}</h2>
        </div>
        <Button
          type="text"
          aria-label="关闭节点详情"
          icon={<CloseOutlined />}
          onClick={onClose}
        />
      </div>
      <div className="detail-summary">
        <StatusBadge status={node.status} />
        <span className="demo-label">Mock 节点</span>
      </div>
      <div className="detail-meta">
        <span>节点 ID</span>
        <code>{node.id}</code>
        <span>节点类型</span>
        <code>{node.kind}</code>
      </div>
      <Tabs
        defaultActiveKey="config"
        items={[
          {
            key: "config",
            label: "配置",
            children: (
              <div className="details-scroll">
                <div className="demo-note">
                  Demo · 修改只影响当前页面，不提交后台任务。
                </div>
                <section className="detail-section">
                  <h3>输入</h3>
                  {node.inputs.map((text) => (
                    <div className="reference-line" key={text}>
                      <FileTextOutlined />
                      {text}
                    </div>
                  ))}
                </section>
                <section className="detail-section">
                  <h3>输出</h3>
                  {node.outputs.map((text) => (
                    <div className="output-placeholder" key={text}>
                      {text}
                    </div>
                  ))}
                </section>
                {node.kind === "input" && (
                  <section className="detail-section">
                    <h3>输入内容</h3>
                    <Input.TextArea
                      aria-label="模拟输入内容"
                      rows={6}
                      value={node.config.prompt}
                      onChange={(e) =>
                        onChange(node.id, { prompt: e.target.value })
                      }
                    />
                  </section>
                )}
                {node.kind === "generation" && (
                  <>
                    <section className="detail-section">
                      <label htmlFor="demo-model">
                        生成模型 <span>DEMO</span>
                      </label>
                      <Select
                        id="demo-model"
                        aria-label="模拟模型选择"
                        value={node.config.modelId}
                        options={demoModels}
                        onChange={(modelId) => onChange(node.id, { modelId })}
                      />
                      <p className="field-help">
                        仅修改模拟配置，未连接任何模型服务。
                      </p>
                      <label htmlFor="demo-prompt">提示词</label>
                      <Input.TextArea
                        id="demo-prompt"
                        aria-label="模拟提示词"
                        rows={6}
                        value={node.config.prompt}
                        onChange={(e) =>
                          onChange(node.id, { prompt: e.target.value })
                        }
                      />
                    </section>
                    <section className="detail-section">
                      <h3>
                        <HistoryOutlined /> 素材版本
                      </h3>
                      <div className="output-placeholder">
                        {node.versions.length
                          ? node.versions.join(" / ")
                          : "暂无版本 · 真实版本管理待后续接入"}
                      </div>
                    </section>
                  </>
                )}
                {node.kind === "review" && (
                  <section className="detail-section">
                    <h3>
                      审核结果与意见 <span>DEMO</span>
                    </h3>
                    <div className="review-result">
                      当前模拟结果：
                      <StatusBadge status={node.status} />
                    </div>
                    <Input.TextArea
                      aria-label="模拟审核意见"
                      rows={4}
                      placeholder="填写模拟审核意见…"
                      value={node.config.reviewComment}
                      onChange={(e) =>
                        onChange(node.id, { reviewComment: e.target.value })
                      }
                    />
                    <div className="review-actions">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => onReview(node.id, false)}
                      >
                        模拟驳回
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => onReview(node.id, true)}
                      >
                        模拟通过
                      </Button>
                    </div>
                    <p className="field-help">
                      仅改变此 Mock 节点的展示状态，不执行下游或真实审核门禁。
                    </p>
                  </section>
                )}
                {!["input", "generation", "review"].includes(node.kind) && (
                  <section className="detail-section">
                    <h3>节点配置</h3>
                    <div className="output-placeholder">
                      {node.description}
                      <br />
                      此节点的业务配置将在后续任务中接入。
                    </div>
                  </section>
                )}
              </div>
            ),
          },
          {
            key: "logs",
            label: "运行日志",
            children: (
              <div className="details-scroll">
                <div className="demo-note">
                  以下为 Mock 日志，不代表真实执行。
                </div>
                <div className="log-lines">
                  {node.logs.map((line, i) => (
                    <p key={`${i}-${line}`}>{line}</p>
                  ))}
                </div>
              </div>
            ),
          },
        ]}
      />
      <div className="detail-footer">
        <span className="live-dot" />
        当前页面模拟数据 · 刷新后重置
      </div>
    </aside>
  );
}

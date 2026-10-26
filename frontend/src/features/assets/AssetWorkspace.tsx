import { Modal } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import type { DemoProject } from "../../types/workflow";
import { StatusBadge } from "../../components/StatusBadge";

export function AssetWorkspace({
  project,
  kind,
  onClose,
}: {
  project: DemoProject;
  kind: "characters" | "scenes" | null;
  onClose: () => void;
}) {
  const assets = kind === "characters" ? project.characters : project.scenes;
  return (
    <Modal
      open={kind !== null}
      onCancel={onClose}
      footer={null}
      width={820}
      title={`${kind === "characters" ? "人物" : "场景"}资产工作台 · Demo`}
    >
      <p className="asset-intro">
        示例项目中的标准资产。图像区域为占位示意，尚未连接生成、上传或持久化服务。
      </p>
      <div className="asset-grid">
        {assets.map((asset) => (
          <article className="asset-card" key={asset.id}>
            <div className={`asset-visual tone-${asset.color}`}>
              <span>{asset.initials}</span>
              <small>
                <PictureOutlined /> 参考图占位
              </small>
            </div>
            <div className="asset-info">
              <h3>
                {asset.name}
                <span>{asset.version}</span>
              </h3>
              <code>{asset.id}</code>
              <p>{asset.description}</p>
              <StatusBadge status={asset.status} />
            </div>
          </article>
        ))}
      </div>
    </Modal>
  );
}

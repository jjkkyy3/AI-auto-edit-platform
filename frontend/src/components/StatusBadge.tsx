import { statusMeta, type DemoStatus } from "../types/workflow";

export function StatusBadge({ status }: { status: DemoStatus }) {
  return (
    <span className={`status-badge status-${status}`}>
      <i />
      {statusMeta[status].label}
    </span>
  );
}

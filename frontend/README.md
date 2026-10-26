# P0-02 前端 Demo

React + TypeScript + Vite + React Flow (`@xyflow/react`) + Ant Design。

所有项目、剧本、人物、场景、模型、日志、版本和审核均为 Mock 数据。没有后端、数据库、真实模型调用、持久化或工作流执行引擎。模拟通过或驳回只更新当前节点显示，不执行下游。刷新后恢复初始示例。

## 运行与验证

Node.js 24+、npm（本次使用 Node 24.15.0、npm 10.8.2 验证）。该版本要求同时覆盖 Vite 与 Node 原生 TypeScript 测试运行能力。依赖版本固定在 package.json，精确依赖树由 package-lock.json 锁定。

```powershell
cd E:\AI-auto-edit-platform\frontend
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

打开 http://127.0.0.1:5173 。端口为严格模式，已被占用时明确报错，不自动换端口。Linux 使用对应克隆目录执行相同 npm 命令。

## 模块边界

```text
src/
├── app/App.tsx
├── pages/WorkflowPage.tsx             # 页面布局与单一 Mock 数据状态
├── components/StatusBadge.tsx
├── features/
│   ├── assets/AssetWorkspace.tsx
│   └── workflow/
│       ├── layout.ts                 # 纯布局与 Mock 查询/更新函数
│       ├── graph.ts                  # 转换为 React Flow nodes / edges
│       ├── WorkflowNode.tsx          # 自定义节点与独立展开按钮
│       ├── WorkflowCanvas.tsx        # 画布与视图交互
│       └── NodeDetails.tsx           # 节点详情工作台
├── mocks/project.ts                  # 示例项目、剧本、分镜、人物、场景、模型
├── types/workflow.ts
├── styles/global.css
└── main.tsx
tests/layout.test.ts                   # 分支、展开、连线与 Mock 隔离验证
tests/browser-acceptance.js            # Playwright CLI 本地交互验收函数
```

React Flow 节点位置和选中状态属于展示状态；节点业务数据来自 WorkflowPage 中唯一的 Mock 项目，不创建任务执行状态机。用户编辑节点后保留手动拖动位置；展开或折叠时按拓扑重新布局。

## 人工验收

1. 确认白色主题、顶部项目与未持久化提示、左导航、Demo 标识及画布状态图例。
2. 通过“前期筹备 / 分镜生产区 / 后期交付”和“适应画布”检查完整 11 个主阶段及真实连线。
3. 默认人物、场景和三条分镜均折叠。分别点击展开按钮；点击人物/场景主体打开资产工作台。
4. 展开任一分镜，检查 S1–S6 顺序及到汇总器的连线；各步骤都可选中打开详情，再重新折叠。
5. 选中首帧或视频生成，编辑提示词与模拟模型，切换其他节点后再回来确认修改保留在当前页面。
6. 选中审核节点，填写意见并模拟通过/驳回；只更新该节点 Mock 状态，不改变下游状态。
7. 关闭右侧面板，缩放、平移、拖动节点、适应画布，检查展开后的节点无重叠和悬空连线。
8. 检查运行日志、版本占位区、三个模拟人物和两个模拟场景；刷新确认恢复初始示例。

当前各阶段状态是独立交互样例，并非一次真实执行的相互依赖结果。后续任务由后端提供权威状态与真实审核门禁。

## 可重复的浏览器验收

在开发服务器已启动的前提下，从仓库根目录运行。Playwright CLI 为验证工具，不加入应用运行依赖；需本机有可用 Chrome。

```powershell
npx --yes --package @playwright/cli playwright-cli -s=p002 open http://127.0.0.1:5173 --browser chrome
npx --yes --package @playwright/cli playwright-cli -s=p002 snapshot
npx --yes --package @playwright/cli playwright-cli -s=p002 run-code --filename frontend/tests/browser-acceptance.js
npx --yes --package @playwright/cli playwright-cli -s=p002 console warning
```

验收函数检查 29 项交互，包括六步分别选中、真实 Edge 数量、展开/折叠、模拟编辑保留、审核不执行下游、资产数量、节点拖动与画布平移。截图输出到仓库 `output/playwright/`。运行后可使用 `playwright-cli -s=p002 close` 关闭该验证浏览器。

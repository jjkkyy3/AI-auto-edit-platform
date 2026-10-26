# AI-auto-edit-platform

AI 短剧自动化生产平台，支持第三方 API 和自部署模型。产品以白色主题、类似 n8n 的横向可视化工作流画布为核心，面向多用户，支持 Windows/Linux 平台部署和远程 GPU 执行。

## 当前状态

已完成 **P0-01 工程规范、P0-02 前端 Demo、P0-03 最小后端与健康检查、P0-04B 本地 PostgreSQL/Redis 与 Java 连接验证**。前端使用明确标记的 Mock 数据，后端仅提供 `GET /api/v1/health`；两者尚未对接。本地基础设施已有独立 Compose 配置；业务表、模型调用、执行引擎及完整平台部署尚未实现。

## 产品流程

剧本输入 → 剧本解析 → 人物资产生成及审核 → 场景资产生成及审核 → 分镜规划及审核 → 动态分镜分流 → N 条分镜独立执行 → 分镜汇总 → 音频字幕 → FFmpeg 合成 → 成片审核 → MP4 导出。

每条分镜：输入绑定 → 首帧生图 → 图片审核 → 视频生成 → 视频审核 → 素材归档。

核心能力包括审核门禁、节点独立模型配置、素材版本、局部重试、动态分支和远程模型执行。生成成功不代表审核通过。

## 技术基线

| 层次 | 技术 |
| --- | --- |
| 前端 | React、TypeScript、Vite、React Flow、Ant Design |
| 后端 | Java 21、Spring Boot 3.x |
| 数据库 | PostgreSQL、Flyway |
| 缓存及异步基础设施 | Redis |
| 模型代理 | Python、FastAPI |
| 模型服务 | ComfyUI、Ollama、云端 API |
| 合成 | FFmpeg |
| 平台部署 | Docker Compose |
| 版本管理 | Git、GitHub |

前端具体依赖及锁文件见 `frontend/`；后端固定 Java 21、Spring Boot 3.5.16、Maven Wrapper / Maven 3.9.16。其他组件版本由对应后续任务确定。

## 仓库结构

当前实际工程与文档（模块内的完整文件树见各自 README）：

```text
AI-auto-edit-platform/
├── .gitignore
├── AGENTS.md
├── LICENSE
├── README.md
├── frontend/                 # 已实现 P0-02 Mock 画布与交互
├── backend/                  # 已实现 P0-03 启动入口、健康接口和测试
├── deploy/                   # P0-04B 本地 PostgreSQL/Redis Compose 与验收记录
├── database/migrations/      # 仅迁移规则 README，尚无 SQL 或 Flyway 运行机制
└── docs/
    ├── requirements.md
    ├── architecture.md
    └── development-plan.md
```

完整 Monorepo 规划如下；frontend、backend、docs、deploy 和 database/migrations 已有上述内容，其余目录将在对应任务中创建，不能据目录规划认定业务已实现：

```text
AI-auto-edit-platform/
├── frontend/                 # React 网页工作台
├── backend/                  # Spring Boot 业务、权威状态与调度
├── worker/                   # 长任务执行、素材处理与 FFmpeg
├── model-agent/              # Python/FastAPI，模型所在机器的受控代理
├── contracts/                # 跨模块接口、事件及数据契约
├── database/
│   └── migrations/           # Flyway SQL 迁移的唯一源码位置
├── deploy/                   # Compose、镜像及环境配置模板
├── docs/
├── AGENTS.md
├── .gitignore
└── LICENSE
```

`worker/` 的具体实现语言和队列协议待后续任务确定。数据库迁移的打包方式需在后续持久化任务中配置，不能维护多份 SQL 副本。

## 开发入口与约束

1. 阅读 [工程规范](AGENTS.md)、[产品需求](docs/requirements.md)、[架构设计](docs/architecture.md) 和 [开发阶段](docs/development-plan.md)。
2. 每次仅实现技术负责人分配的任务，出现已有内容冲突时停止并报告。
3. 源码保存在本地 Git 工作区。数据库数据、模型权重、生成素材及密钥不进入仓库。
4. 前端只展示和操作流程；后端保存权威状态，审核结果绑定素材版本。
5. 平台 Compose 与 GPU 服务分开管理，不假设远程 GPU 服务器安装了 Docker。
6. 配置模板只允许使用占位值，真实环境变量保存在未跟踪的本地配置或部署环境中。

## 当前启动入口

- 前端：进入 `frontend/`，执行 `npm ci`、`npm run dev`，访问 `http://127.0.0.1:5173`。详见 [前端说明](frontend/README.md) 和 [P0-02 验证](frontend/P0-02-validation.md)。
- 后端：在 `backend/` 中为当前终端指定完整 JDK 21 的 `JAVA_HOME`，执行 `.\mvnw.cmd --batch-mode package`，再以该 JDK 的 `java -jar target/ai-auto-edit-backend-0.0.1-SNAPSHOT.jar` 独立启动。默认仅监听 `127.0.0.1:8080`，请求 `GET /api/v1/health`。
- 健康接口只表示后端可响应，不代表数据库、Redis 或模型就绪。后端启动无需这些外部服务；本次验证进程已停止。
- 本地基础设施：从仓库根目录按 [部署说明](deploy/README.md) 配置私有环境文件并启动固定项目 `ai-auto-edit-local`。主机 PostgreSQL 为 `127.0.0.1:15432`、Redis 为 `127.0.0.1:6379`；显式 Java 集成测试使用 `local-infra-it` Maven profile。验收后项目容器已停止，命名卷保留，详见 [P0-04B 验证](deploy/P0-04B-validation.md)。

Windows 的完整 JDK 路径、Wrapper 命令、端口覆盖及尚未验证的 Linux 示例见 [后端说明](backend/README.md) 和 [P0-03 验证](backend/P0-03-validation.md)。

## 许可证

采用 [MIT License](LICENSE)，保留原有版权和许可文本。

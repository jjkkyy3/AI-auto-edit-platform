# P0-04B 验证记录

执行日期：2026-10-27（Asia/Shanghai），项目 `E:\AI-auto-edit-platform`，分支始终为 `test-brand`。结论：**文件实现与 Windows 本机运行验收均已完成，达到 P0-04B 验收标准。** Linux 主机运行未验证。

## 执行前状态与范围

已阅读根 AGENTS、README、架构与阶段计划、前后端 README、P0-02/P0-03 验证记录，以及后端 POM 和 application.yml。当前任务和用户后续“解决 Docker、拥有全部权限”的授权适用于本次修复，不把历史阶段限制视为永久禁令。

开始时 Git 状态为：`M README.md`；`.gitignore`、`AGENTS.md`、`backend/`、`docs/`、`frontend/` 为未跟踪内容，均保留。未切换分支、暂存、提交、推送、合并或修改 remote。40 个原有源码/文档文件留存 SHA-256 基线；收尾对比仅根 README、backend/README 和 backend/pom.xml 按授权变化，其余原有文件未变，无原文件缺失。

原有 PostgreSQL 为 PID 8180，主机 5432；前端为 node PID 27800，`127.0.0.1:5173`。本次不连接原有用户数据库，不终止这两个进程。预检 15432、6379、8080 无监听。

## Docker 故障及实际修复

初始 Docker Desktop 启动报 `initializing Secrets Engine`，无法把 `engine.sock` 改名为 `engine.sock.stale`，系统错误 1920。此时 CLI 已安装，但 Engine 不可连接。问题与 [Docker 官方仓库中的同类问题](https://github.com/docker/for-win/issues/15064) 相符；本机实际修复结果以下述 Engine 与容器验证为准。

执行过程：

1. `docker context show` 与 `docker context inspect desktop-linux --format '{{.Endpoints.docker.Host}}'`：当前为 `desktop-linux`，endpoint 是本机 `npipe:////./pipe/dockerDesktopLinuxEngine`。未设置指向其他 Engine 的 DOCKER_HOST/DOCKER_CONTEXT，未切换 context 或连接远端。
2. 只检查 Docker 错误和运行时目录元数据，确认异常目录内是 Unix socket 等运行时文件；不输出 Docker 凭据或完整设置文件。
3. `docker desktop stop --timeout 20` 未成功；`docker desktop stop --force --timeout 15` 成功关闭这次启动失败的 Desktop。此时 Engine 尚未可用，没有本次项目容器在运行。
4. 普通同父目录改名分别遇到 AccessDenied、跨设备错误。核对目录实际卷标识后，使用 Python `os.rename` 将两个运行时目录完整移至同一实际卷上的保留目录，再创建原路径空目录。没有删除原文件、重置 Docker、重装软件或变更全局配置。
5. 保留目录为 `C:\Users\HP\AppData\Local\Docker\runtime-preserved-p004b-20261027-025115\`，其中 `secrets-engine` 来自 `%LOCALAPPDATA%\docker-secrets-engine`，`run` 来自 `%LOCALAPPDATA%\Docker\run`。保留目录仍存在。未移动或改写 Docker 数据 VHD。
6. `Start-Process 'C:\Users\HP\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe' -WindowStyle Hidden -PassThru` 后，Engine 成功就绪。未点击许可、安装或重置按钮。
7. `docker --context desktop-linux info --format 'Engine={{.ServerVersion}} OSType={{.OSType}} Root={{.DockerRootDir}}'` 返回 `Engine=29.8.0 OSType=linux Root=/var/lib/docker`。收尾复查仍可连接。Docker Desktop 保持运行。

上述运行时目录修复发生在仓库外；备份保留，不把运行时备份提交 Git。修复针对本次错误，不能保证未来 Docker 升级不再出现其他问题。

## 环境、版本与存储

| 检查命令/方式 | 真实结果 |
| --- | --- |
| `Get-CimInstance Win32_OperatingSystem`（仅选择 Caption/Version/OSArchitecture） | Windows 11 专业版，10.0.26200，64-bit |
| `docker --version` | CLI 29.8.0 |
| `docker compose version` | Compose v5.5.1，使用现代 `docker compose` 插件命令 |
| 本机 Engine 定向 info | 29.8.0，Linux 容器 |
| `& 'E:\idea-2024\jbr\bin\java.exe' -version` / `javac.exe -version` | 完整 JDK 21.0.6 |
| 当前进程设置 JAVA_HOME 后 `.\backend\mvnw.cmd --version` | Maven 3.9.16，实际 Java 21.0.6；未修改系统 Java、PATH 或全局环境 |
| 检查 `.mvn/wrapper/maven-wrapper.properties` | 官方 only-script Wrapper 3.3.4，Maven 3.9.16，发行包地址 HTTPS |
| Maven 现有用户仓库配置，仅检查协议 | 存在 HTTP 镜像，构建可用，但传输完整性存在风险；未更改全局 settings，未输出认证信息 |
| Docker 设置白名单字段与 VHD 文件元数据 | 数据位置配置指向 `E:\DockerDesktopWSL`，实际文件 `E:\DockerDesktopWSL\disk\docker_data.vhdx` 存在，长度 19,332,595,712 字节 |
| `Get-PSDrive -Name C,E`（收尾） | C 可用约 22.45 GiB；VHD 所在 E 可用约 354.85 GiB |
| `wsl -d docker-desktop --exec sh -lc 'df -Pk /mnt/docker-desktop-disk'` | `/dev/sdd`，可用 988,061,352 KiB，使用约 1%；这是虚拟文件系统空间，不能代替宿主 E 盘可用空间 |

已同时核实 VHD 路径、宿主分区空间与 Linux 数据文件系统空间，本次运行空间条件满足。未调整 Docker 数据盘位置、WSL 配置、镜像源或存储策略。

最终镜像：

| 镜像 | 实际 RepoDigest |
| --- | --- |
| `postgres:17.11-bookworm` | `postgres@sha256:858bb5e98eed02eb8cafbcdc007f9a65d1b613972028944a8ec2133ccaf80d27` |
| `redis:8.2.11-bookworm` | `redis@sha256:d7bb2f262c1e26b9bd0532f808bb493d7a1f2ad07674876cff050361be805f75` |

Compose 锁定明确版本标签；上表记录本次下载的摘要，不声称未来相同标签内容永远不变。官方维护状态与版本对应挂载路径的依据见 [部署说明](README.md)。

## 文件与依赖范围

新增可审阅文件：

- `deploy/compose.local.yml`
- `deploy/.env.example`
- `deploy/README.md`
- `deploy/P0-04B-validation.md`
- `database/migrations/README.md`
- `backend/src/test/java/com/jjkkyy3/aiautoedit/backend/infrastructure/LocalInfrastructureIT.java`

修改原文件：根 `README.md`、`backend/README.md`、`backend/pom.xml`。额外创建私有且被忽略的 `deploy/.env.local`，使用密码学随机数生成两项独立密码，不在报告、命令参数或日志中记录值。原有 `.gitignore` 已满足要求，无需修改。

POM 新增 PostgreSQL JDBC 42.7.11、Jedis 6.0.0，均为 **test 作用域**，版本使用 Boot 3.5.16 依赖管理。`local-infra-it` profile 使用 Boot 管理的 Failsafe 3.5.6。Jedis 排除本次不使用的 `org.json:json`，消除与 Boot 测试组件的 JSONObject 重复警告。生产 JAR ZIP 条目检查确认未包含 PostgreSQL、Jedis、其连接池及该 JSON 测试依赖。

未修改前端、AGENTS、需求/架构/阶段计划、健康接口、application.yml 或 Wrapper。未引入生产数据库连接配置、Redis 自动配置、Flyway、业务表、Actuator 或诊断业务接口。

## 验证命令与结果

所有命令工作目录均为仓库根目录。下表中 `docker @compose` 的完整参数是：

```powershell
$compose = @('--context','desktop-linux','compose','--project-name','ai-auto-edit-local',
    '--env-file','deploy/.env.local','--file','deploy/compose.local.yml')
```

实际执行通过 PowerShell 和 Python subprocess 调用相同参数；容器密码从其自身环境读取，Windows Java 的环境从私有文件注入，不把密码放进参数。可直接复用的完整 PowerShell 步骤见 [部署说明](README.md)。

| 验证 | 实际命令/动作 | 结果 |
| --- | --- | --- |
| 配置校验 | `docker @compose config --quiet` | 退出 0，未打印展开配置 |
| 必要凭据约束 | 改用 `--env-file deploy/.env.example` 执行同一 `config --quiet` | 预期非零退出，指出 POSTGRES_PASSWORD 未填写，不使用默认密码 |
| 镜像 | `docker @compose pull postgres redis` | 两个固定标签拉取成功 |
| 原资源检查 | `docker @compose ps --all --format json` | 首次启动前为空，无本项目已有容器 |
| 启动 | `docker @compose up --detach --wait --wait-timeout 90 postgres redis` | 两个服务 healthy，退出 0 |
| 发布端口 | 本项目 ps 与挂载 inspect 的指定字段 | PostgreSQL 仅 `127.0.0.1:15432`，Redis 仅 `127.0.0.1:6379`；独立命名卷路径正确 |
| 容器 PostgreSQL | `docker @compose exec -T postgres sh -ec`，以环境认证的 psql 执行 `SELECT 1` | 返回 `1` |
| 空业务库 | 同上查询非系统 schema 的表数量 | `0`，未创建业务表 |
| 容器 Redis | `docker @compose exec -T redis sh -ec`，以 REDISCLI_AUTH 认证后 `redis-cli --no-auth-warning PING` | 返回 `PONG` |
| 默认测试 | JDK 21 下 `.\backend\mvnw.cmd -f backend/pom.xml --batch-mode test` | 1 项通过，0 失败/错误/跳过；服务启动前与最终停止后均实际通过 |
| 打包 | `.\backend\mvnw.cmd -f backend/pom.xml --batch-mode -DskipTests package` | BUILD SUCCESS；随后 profile verify 也再次完成打包 |
| Windows Java 连接 | 只在子进程注入私有环境；`.\backend\mvnw.cmd -f backend/pom.xml --batch-mode -Plocal-infra-it verify` | 默认健康测试 1 项、独立连接测试 2 项全部通过，0 跳过；JDBC SELECT 1 与 Jedis PING 均实际连接本项目服务 |
| 缺配置负向验证 | 清除四个所需环境变量后 `.\backend\mvnw.cmd -f backend/pom.xml --batch-mode -Plocal-infra-it failsafe:integration-test failsafe:verify` | **预期失败**：2 项失败、0 跳过，分别指出缺少 PostgreSQL/Redis 密码变量，不输出密码 |
| 独立运行 | `& 'E:\idea-2024\jbr\bin\java.exe' -jar backend/target/ai-auto-edit-backend-0.0.1-SNAPSHOT.jar` | PID 26204，约 2 秒启动，监听 127.0.0.1:8080，启动日志无异常 |
| 健康契约 | `Invoke-WebRequest 'http://127.0.0.1:8080/api/v1/health' -UseBasicParsing` 并断言状态、类型和两字段 | 200，application/json，`{"status":"UP","service":"ai-auto-edit-backend"}`，无额外字段 |
| 停止 Java | 对本次前台进程发送 Ctrl+C | 日志确认 Graceful shutdown complete，8080 无监听；终端中断退出不视为启动失败 |
| 容器重建 | `docker @compose up --detach --force-recreate --wait --wait-timeout 90 postgres redis` | 两容器 ID 均改变，重用原命名卷，重新 healthy |
| 服务日志 | `docker @compose logs --no-color --tail 35 postgres redis` | PostgreSQL 跳过重新初始化并 ready；Redis 从 AOF 加载并 ready，无连接/落盘失败 |
| 项目收尾 | `docker @compose stop --timeout 15 postgres redis` | 两容器退出码均为 0，命名卷未删除 |
| 保留卷 | `docker --context desktop-linux volume ls --filter label=com.docker.compose.project=ai-auto-edit-local` | 两个项目命名卷仍存在 |
| 原有服务 | Get-NetTCPConnection + Get-Process，前端 Invoke-WebRequest | PostgreSQL PID 8180/5432、node PID 27800/5173 均保留，前端 HTTP 200 |
| 私有文件 | `git check-ignore -v deploy/.env.local backend/target/p004b-evidence.json` | 分别命中 `.env.*`、`target/`；`git ls-files deploy/.env.local backend/target` 无输出 |
| 仓库检查 | `git diff --check`、Git 可见文件私有密码精确匹配扫描、UTF-8/空白/XML/文档命令语法检查 | 通过；未发现本次生成密码泄露至可提交文件 |

测试报告在被忽略的 `backend/target/`：`surefire-reports/` 是最终默认测试通过记录；`p004b-success-it/` 留存真实成功连接报告（2/0/0/0）。`failsafe-reports/` 与 `p004b-missing-config.log` 是之后故意缺配置的失败记录（2/2/0/0），不能误读为正常配置的连接失败。未伪造或跳过测试。

## 持久化证据

只重建本项目容器，没有删卷，没有创建业务表。

- PostgreSQL 重建前、后的 `SELECT system_identifier FROM pg_control_system()` 均为 **7701051733861224486**。重建日志明确跳过初始化，数据目录不是新的临时容器层。
- Redis 使用本项目唯一键 `ai-auto-edit-local:p004b:5a1c64637acf427b9997b3d6c00b174d`，值为无敏感信息的验收标记。SET 与 `WAITAOF 1 0 5000` 在同一连接执行，返回 `OK / 1 / 0`，确认本地 AOF 落盘后才重建。
- 重建后该键返回相同值；`INFO persistence` 显示 `aof_enabled:1`、`aof_last_write_status:ok`、`aof_pending_bio_fsync:0`。
- 验收结束只删除该键，同连接执行 DEL/WAITAOF/EXISTS，返回 `1 / 1 / 0 / 0`，确认删除成功、已落盘、键不存在。未使用 FLUSHDB、FLUSHALL、通配删除或操作其他数据。

容器 ID 证据（短 ID）：

| 服务 | 重建前 | 重建后 |
| --- | --- | --- |
| PostgreSQL | `80fe1ee9a72e` | `830f43e3c195` |
| Redis | `dc47b2c99efc` | `8a5c133b22c4` |

详细无凭据证据保存在被忽略的 `backend/target/p004b-evidence.json`。持久化验证中辅助脚本曾因字段名 `cluster_before` 与实际 `postgres_cluster_before` 不一致中断；当时容器重建已完成，随后修正字段读取并继续检查原有重建结果，未通过重复初始化或改写证据掩盖问题。

## 最终资源、风险与未验证项

新建并保留：`ai-auto-edit-local_postgres_data`、`ai-auto-edit-local_redis_data` 两个卷，`ai-auto-edit-local_default` 网络、两个已停止容器、下载镜像，以及忽略的本地凭据文件。容器均 `exited (0)`；15432、6379、8080 均已释放。Docker Desktop 继续运行，原有前端和 5432 PostgreSQL 未中断，未操作其他项目容器、网络或卷。

当前 Maven 的 HTTP 镜像风险仍存在，本次未修改全局仓库设置。Boot 测试现有 Mockito 动态 agent/CDS 警告仍存在，未导致失败；新增 JSON 重复警告已用 test 依赖排除解决。Linux 主机/Wrapper、备份恢复、生产部署、GPU 和外部模型均未验证，也不属于本次范围。

最终 Git 状态：

```text
 M README.md
?? .gitignore
?? AGENTS.md
?? backend/
?? database/
?? deploy/
?? docs/
?? frontend/
```

分支仍为 `test-brand`。大量未跟踪项目内容是原有状态的延续，不表示本次改动了全部模块。私有凭据、构建产物、日志与 Docker 运行时备份不进入提交内容。任务到 P0-04B 结束，等待技术负责人验收，不开始后续业务开发。

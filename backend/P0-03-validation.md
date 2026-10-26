# P0-03 验证记录

验证日期：2026-10-27（Asia/Shanghai）。目录：`E:\AI-auto-edit-platform`。本次只初始化 Spring Boot 后端及健康检查，不进入 P0-04。

## 执行前状态

- 分支为 `test-brand`，跟踪 `origin/test-brand`，未切换或改名。
- 原工作区：`M README.md`；未跟踪 `.gitignore`、`AGENTS.md`、`docs/`、`frontend/`。这些属于 P0-01/P0-02，均保留。
- 已阅读根 AGENTS、README、需求、架构、阶段计划和前端 README/P0-02 验证记录。
- 执行前不存在 backend，未发现后端代码冲突。
- 默认 `java -version` 为 Oracle Java 1.8.0_451；当前环境 JAVA_HOME 为 `C:\Program Files\Java\jdk-17`；PATH 上 javac 和 mvn 不可用。
- 进一步只读检查发现 `E:\idea-2024\jbr` 包含完整 JDK 21.0.6，IDEA 自带 Maven 3.9.9；另有未加入 PATH 的旧 Maven 安装。本项目使用 Wrapper 固定版本，不依赖旧 Maven。
- 原前端 PID 27800 监听 127.0.0.1:5173；8080 在启动前无监听。

## 最终版本与依据

| 项目 | 最终选择及实际验证 |
| --- | --- |
| Java | 编译目标 21，实际 java/javac 21.0.6，JetBrains JBR-21.0.6+8-631.39-jcef |
| Spring Boot | 3.5.16，Maven Central 可获取的 3.x 稳定发行版 |
| Maven | Wrapper 实际运行 3.9.16 |
| Maven Wrapper | Apache 3.3.4 only-script，Windows mvnw.cmd 与 POSIX mvnw |

官方 [Spring Boot 3.5 系统要求](https://docs.spring.io/spring-boot/3.5/system-requirements.html) 明确 Java 17–25、Maven 3.6.3+。Java 21 和 Maven 3.9.16 符合要求，未改为 Boot 4.x。

版本可获取性通过 Maven Central 的 Boot、Maven 和 Wrapper distribution 元数据实际核实；链接见 backend/README.md。Wrapper 行为与来源见 [Apache 官方文档](https://maven.apache.org/tools/wrapper/)。脚本来自官方发行包，保留许可证头，不手写替代 Wrapper。

## 新增与修改文件

新增：

```text
backend/
├── .mvn/wrapper/maven-wrapper.properties
├── mvnw
├── mvnw.cmd
├── pom.xml
├── README.md
├── P0-03-validation.md
└── src/
    ├── main/
    │   ├── java/com/jjkkyy3/aiautoedit/backend/
    │   │   ├── AiAutoEditBackendApplication.java
    │   │   └── health/HealthController.java
    │   └── resources/application.yml
    └── test/java/com/jjkkyy3/aiautoedit/backend/health/
        └── HealthControllerTest.java
```

修改：根 README 的当前状态、版本说明、实际工程目录和启动入口；保留产品、技术基线及 MIT 许可信息。没有修改其他规范文档、前端代码或忽略规则。

## 实际验证命令与结果

以下 Maven 命令均在 backend 中运行；JAVA_HOME 只在执行进程中临时设置为已有 `E:\idea-2024\jbr`。未修改系统 Java、PATH 或持久化环境变量。

| 命令/检查 | 真实结果 |
| --- | --- |
| `git status --short --branch` / 目录及工具检查 | test-brand，无已有后端冲突；原修改保留 |
| `java -version` | 默认 Java 8，不能用于本项目；未据此声称 Java 21 验证通过 |
| `Get-Command javac,mvn` | PATH 中不可用，后续发现现有 JDK/IDE 工具 |
| `& E:\idea-2024\jbr\bin\java.exe -version` | Java 21.0.6 |
| `& E:\idea-2024\jbr\bin\javac.exe -version` | javac 21.0.6 |
| IDEA 内置 `mvn.cmd -version` | Maven 3.9.9 / Java 21.0.6；仅用于已有工具检查 |
| `.\mvnw.cmd --version` | Maven 3.9.16 / Java 21.0.6，Windows Wrapper 实际可用 |
| `.\mvnw.cmd --batch-mode test` | BUILD SUCCESS；1 个测试、0 failures、0 errors、0 skipped |
| `.\mvnw.cmd --batch-mode -DskipTests package` | BUILD SUCCESS；已有测试通过，打包不重复执行测试；生成可执行 JAR |
| `& E:\idea-2024\jbr\bin\java.exe -jar target/ai-auto-edit-backend-0.0.1-SNAPSHOT.jar` | 独立前台终端进程启动成功，PID 25328；Tomcat 监听 8080 |
| `Invoke-WebRequest http://127.0.0.1:8080/api/v1/health -UseBasicParsing` | HTTP 200、application/json；两个字段及无多余字段核对通过 |
| `Get-NetTCPConnection -State Listen -LocalPort 8080,5173` | 后端 127.0.0.1:8080 / PID 25328；前端 127.0.0.1:5173 / PID 27800 |
| 终端启动及请求日志检查 | 应用与 DispatcherServlet 正常初始化，无 ERROR、异常堆栈或启动失败 |
| 向本次后端终端发送 Ctrl+C | 日志显示 Graceful shutdown complete；终端以人工中断退出码 1 结束，不是启动失败 |
| 停机后进程/监听检查 | PID 25328 已不存在，8080 无监听；前端仍为 PID 27800 / 5173 |
| 已有文件 SHA-256 对比 | 除获准修改的根 README 外，29 个已有文件内容完全一致 |
| `git diff --check`、新增文件空白与文档链接检查 | 通过 |
| `git check-ignore` 检查 target 内 JAR、测试报告和下载临时包 | 均被已有 target/ 规则忽略，无需修改规则 |
| 最终 `git status --short --branch` / 新增文件检查 | 仍为 test-brand；新增 backend 源文件可见，构建产物不在未忽略文件清单中 |

健康响应实测内容（字段顺序不属于接口契约）：

```json
{"status":"UP","service":"ai-auto-edit-backend"}
```

自动测试使用一个 `@SpringBootTest` + MockMvc 测试，兼顾应用上下文启动、状态码、内容类型、两个字段及字段总数；没有重复增加空的 contextLoads 测试。

本次曾尝试使用后台启动与停止的组合验证命令，该命令在运行前被工具策略拒绝，未启动进程。随后改用前台终端独立运行 JAR，并仅对该终端发送 Ctrl+C，完成验证与停机；未终止其他进程。

## 问题、风险及未验证项

1. 当前系统默认 Java 仍是 8，JAVA_HOME 仍指向 17；重新运行时需要按 README 在当前终端明确选用完整 JDK 21。IDEA 升级/移动后 JBR 路径可能改变，可替换为独立 JDK 21，不应假定机器的全局 Java 已改变。
2. 测试依赖中的 Mockito 在 Java 21 下输出自附加 agent、未来动态加载限制及 class sharing 警告。测试通过；独立 JAR 启动未出现这些警告。本任务未为未来 JDK 添加额外代理配置或隐藏警告。
3. 本机现有 Maven 用户配置把依赖请求路由到 HTTP 的 Aliyun 镜像。Wrapper 分发地址固定为 Maven Central HTTPS，但依赖来源仍受用户 Maven settings 影响。本任务没有擅自改全局镜像设置；如需调整来源，可在后续环境任务中处理。
4. Windows Wrapper、测试、打包及独立 JAR 的默认 8080 端口均已验证。Linux、命令行覆盖端口及 spring-boot:run 是文档提供的操作方式，本次未逐项运行；不得视为已验证。
5. 健康检查仅表示应用能够响应，不代表数据库、Redis、GPU 或模型服务健康。工程没有这些外部服务依赖，启动不需要它们。
6. 本阶段没有登录/权限、业务表/Flyway、工作流、Worker/Agent、模型适配、Docker、远程部署或前端对接。

## 验收结论与运行状态

达到 P0-03 验收标准。仅新增最小后端及测试，并小范围更新根 README；本次后端进程已停止，原前端服务保持运行。未提交、推送、合并、切换分支或开始 P0-04。

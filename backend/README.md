# 最小后端与本地基础设施连接验证

Java 21、Spring Boot 3.5.16、Spring MVC、Maven Wrapper。应用只提供启动与 `GET /api/v1/health`，默认启动不依赖数据库或 Redis，也未实现登录、任务引擎、模型服务或前端接入。P0-04B 仅增加显式启用的本地连接集成测试，不改变应用默认配置和健康接口。

## 版本与依据

| 项目 | 固定版本 / 验证环境 |
| --- | --- |
| Java 编译目标 | 21 |
| 本次使用的完整 JDK | JetBrains Runtime / JDK 21.0.6（IDEA 已有安装，含 javac） |
| Spring Boot | 3.5.16，使用 spring-boot-starter-parent 管理依赖与插件版本 |
| Maven | 3.9.16，由 Wrapper 固定 |
| Maven Wrapper | Apache 3.3.4，only-script，无需提交 Wrapper JAR |

Spring Boot 官方 [3.5 系统要求](https://docs.spring.io/spring-boot/3.5/system-requirements.html) 列明：3.5.16 要求 Java 17+、兼容至 Java 25，Maven 3.6.3+。本项目采用 Java 21 与 Maven 3.9.16，保持在 3.x，不使用 4.x。

3.5.16 与 Maven 3.9.16 已通过 Maven Central 的 [Boot 元数据](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml) 和 [Maven 元数据](https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/maven-metadata.xml) 核实可获取。Wrapper 脚本来自 Apache 发布的 [3.3.4 only-script 包](https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper-distribution/3.3.4/maven-wrapper-distribution-3.3.4-only-script.zip)，行为见 [官方说明](https://maven.apache.org/tools/wrapper/)。首次构建需要联网下载 Maven 和 Maven 依赖，缓存位置遵循 Maven/Wrapper 的现有配置。

## Windows 运行

在单独 PowerShell 窗口中，为当前进程指定一个完整 JDK 21；以下是本机已验证的路径，不改变系统 PATH、系统默认 Java 或持久化环境变量：

```powershell
cd E:\AI-auto-edit-platform\backend
$env:JAVA_HOME = 'E:\idea-2024\jbr'
& "$env:JAVA_HOME\bin\java.exe" -version
& "$env:JAVA_HOME\bin\javac.exe" -version
.\mvnw.cmd --version
.\mvnw.cmd --batch-mode test
.\mvnw.cmd --batch-mode package
& "$env:JAVA_HOME\bin\java.exe" -jar target/ai-auto-edit-backend-0.0.1-SNAPSHOT.jar
```

开发时也可执行 `.\mvnw.cmd spring-boot:run`；独立 JAR 启动是本次实际运行验证方式。前台运行时使用 Ctrl+C 停止本次后端进程。

若本机没有完整 JDK 21，需要先安装或解压 JDK 21，并将上述路径替换为该 JDK 根目录；不能只安装 JRE。无需全局安装 Maven。不要用当前系统可能存在的 Java 8/17 冒充 Java 21 验证。

## 健康接口

默认仅监听 `127.0.0.1:8080`。另开终端请求：

```powershell
$response = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/v1/health' -UseBasicParsing
$response.StatusCode
$response.Headers['Content-Type']
$response.Content
```

应返回 HTTP 200、`Content-Type: application/json`，JSON 仅包含：

```json
{"status":"UP","service":"ai-auto-edit-backend"}
```

字段顺序不属于契约。此接口只表示后端能够响应请求，不证明数据库、Redis、GPU 或模型已就绪，不返回配置、凭据或本机路径。

## 覆盖端口

可以通过当前进程的 `SERVER_PORT` 环境变量或命令行参数覆盖默认端口。示例：

```powershell
& "$env:JAVA_HOME\bin\java.exe" -jar target/ai-auto-edit-backend-0.0.1-SNAPSHOT.jar --server.port=18080
```

此时请求 `http://127.0.0.1:18080/api/v1/health`。若端口占用，应报告或明确选择其他端口，不终止其他进程，也不自动换端口。可用 `Get-NetTCPConnection -State Listen -LocalPort 8080` 检查占用；此命令在无监听时可能返回非零状态。

## 测试与工程边界

应用依赖仍只有 `spring-boot-starter-web`，使用 Boot Maven 插件打包。测试作用域包含 `spring-boot-starter-test`、PostgreSQL JDBC 42.7.11 和 Jedis 6.0.0，版本均由 Boot 3.5.16 管理；后两者不会进入生产 JAR。Jedis 排除本次 PING 不使用的 `org.json:json`，避免与 Boot 测试组件的 JSONObject 重复。

默认 `test` / `package` 只运行一个 `@SpringBootTest` + MockMvc 测试，同时确认上下文启动、HTTP 200、JSON 内容类型、两个字段值及无额外字段，不连接外部服务。

`local-infra-it` Maven profile 通过 Boot 管理的 Failsafe 3.5.6 运行 `LocalInfrastructureIT` 的两项测试：Windows Java 对专属 `127.0.0.1:15432/ai_auto_edit_local` 执行 `SELECT 1`，对 `127.0.0.1:6379` 执行认证和 `PING`。连接与读取超时为 3 秒（JDBC 登录 5 秒），缺少环境配置或连接失败必须失败，错误不输出凭据。数据库名与角色限制为 `ai_auto_edit_local`，不会访问原有 5432 数据库。

从仓库根目录启用（先按部署说明启动两个本地服务）：

```powershell
cd E:\AI-auto-edit-platform
$env:JAVA_HOME = 'E:\idea-2024\jbr'
Get-Content -LiteralPath deploy/.env.local | ForEach-Object {
    if ($_ -match '^(POSTGRES_DB|POSTGRES_USER|POSTGRES_PASSWORD|REDIS_PASSWORD)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
try {
    .\backend\mvnw.cmd -f backend/pom.xml --batch-mode -Plocal-infra-it verify
    if ($LASTEXITCODE -ne 0) { throw 'Local infrastructure integration validation failed' }
} finally {
    'POSTGRES_DB','POSTGRES_USER','POSTGRES_PASSWORD','REDIS_PASSWORD' | ForEach-Object {
        [Environment]::SetEnvironmentVariable($_, $null, 'Process')
    }
}
```

请在专用 PowerShell 终端执行以上环境注入，不显示私有文件内容。完整 Compose、凭据初始化和持久化复验步骤见 [部署说明](../deploy/README.md)，实际结果见 [P0-04B 验证](../deploy/P0-04B-validation.md)。未增加生产数据源、Redis 自动配置、Actuator 或 Flyway。

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
    └── test/java/com/jjkkyy3/aiautoedit/backend/
        ├── health/HealthControllerTest.java
        └── infrastructure/LocalInfrastructureIT.java
```

构建、测试报告及本次本地验证日志放在 `target/`，由已有忽略规则排除。

## Linux 命令（未在 Linux 验证）

在安装完整 JDK 21 的 Linux 环境中，进入 backend，先赋予脚本执行权限：

```bash
chmod +x mvnw
JAVA_HOME=/path/to/jdk-21 ./mvnw --batch-mode test
JAVA_HOME=/path/to/jdk-21 ./mvnw --batch-mode package
/path/to/jdk-21/bin/java -jar target/ai-auto-edit-backend-0.0.1-SNAPSHOT.jar
curl -i http://127.0.0.1:8080/api/v1/health
```

Windows Wrapper、构建和运行结果见 [P0-03 验证记录](P0-03-validation.md)。不能将这里的 Linux 示例描述为已执行验证。

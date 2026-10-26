# 本地 PostgreSQL 与 Redis（P0-04B）

前端与 Java 后端继续在 Windows 主机运行。本配置仅启动 PostgreSQL、Redis；不提供业务表、Flyway 运行机制、工作流或模型服务。PostgreSQL 是未来业务状态的事实来源，Redis 用于缓存和异步基础设施。

## 服务、版本与持久化

| 服务 | 固定官方镜像 | Windows 主机地址 | 未来同一 Compose 网络内地址 | 独立命名卷及挂载点 |
| --- | --- | --- | --- | --- |
| PostgreSQL | `postgres:17.11-bookworm` | `127.0.0.1:15432` | `postgres:5432` | `ai-auto-edit-local_postgres_data` → `/var/lib/postgresql/data` |
| Redis | `redis:8.2.11-bookworm` | `127.0.0.1:6379` | `redis:6379` | `ai-auto-edit-local_redis_data` → `/data` |

固定项目名 `ai-auto-edit-local`，不设置全局 `container_name`。发布端口仅绑定主机回环地址。容器内部监听所有接口与主机端口发布是两回事；主机应用不能把容器服务名当作本机 DNS 地址。

截至本次核实，PostgreSQL 17 仍受维护，预计支持至 2029-11-08，见 [官方版本政策](https://www.postgresql.org/support/versioning/)。Redis 8.2 为 Extended 维护分支，官方列出的 EOL 为 2030-09-01，见 [官方版本管理](https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/) 与 [安全支持列表](https://github.com/redis/redis/security)。两项版本标签已核实存在并实际拉取，未使用 `latest`。

PostgreSQL 17 的数据目录按 [对应官方 Dockerfile](https://github.com/docker-library/postgres/blob/2603e26e245e558218728ee14e0a42dcb020dc7f/17/bookworm/Dockerfile#L173) 挂载，不能照搬 PostgreSQL 18 的目录规则。Redis 的 `/data` 见 [对应官方 Dockerfile](https://github.com/redis/docker-library-redis/blob/ffe34ace97d06343e05e3f39eb8a43f829dded24/debian/Dockerfile#L107)。Redis 启用 `appendonly yes`、`appendfsync everysec`，通过标准输入加载带密码的配置，密码不出现在进程参数中。

命名卷在容器重建后保留数据，**不等于备份**，不能覆盖磁盘损坏或误写恢复需求。本阶段只验证卷持久化，备份与恢复需后续单独规划。未来 SQL 仅允许放在 [database/migrations/](../database/migrations/README.md)。

## 配置与凭据

可提交的 `.env.example` 只包含非敏感数据库名、角色名和空密码。真实密码保存在被 Git 忽略的 `deploy/.env.local` 或专用终端的进程环境中。缺少或空密码时 Compose 必须报错；不会回退到公开默认密码。

`POSTGRES_DB`、`POSTGRES_USER` 固定使用 `ai_auto_edit_local`，与连接测试的专属目标一致。`POSTGRES_PASSWORD`、`REDIS_PASSWORD` 必须为私有随机值；以下生成 64 位十六进制密码。Redis 当前配置只接受字母、数字、下划线、连字符，避免配置解析注入。端口、镜像、卷挂载属于可提交的非敏感配置。

以下 PowerShell 命令均从仓库根目录执行。使用专用终端；不要显示私有文件内容，不要运行会输出展开凭据的 `compose config`（使用 `--quiet`）。修改环境文件中的 PostgreSQL 密码不会修改已初始化卷内的角色密码，不能用删卷解决凭据不一致。

```powershell
Set-Location E:\AI-auto-edit-platform
if (Test-Path -LiteralPath deploy/.env.local) {
    Write-Host '已有私有配置，保留；无需重新生成。'
} else {
    git check-ignore --quiet -- deploy/.env.local
    if ($LASTEXITCODE -ne 0) { throw 'deploy/.env.local 尚未被 Git 忽略，停止生成' }
    $localRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $pgBytes = New-Object byte[] 32
        $redisBytes = New-Object byte[] 32
        $localRng.GetBytes($pgBytes)
        $localRng.GetBytes($redisBytes)
        $pgSecret = [BitConverter]::ToString($pgBytes).Replace('-','').ToLowerInvariant()
        $redisSecret = [BitConverter]::ToString($redisBytes).Replace('-','').ToLowerInvariant()
        $localText = "POSTGRES_DB=ai_auto_edit_local`nPOSTGRES_USER=ai_auto_edit_local`nPOSTGRES_PASSWORD=$pgSecret`nREDIS_PASSWORD=$redisSecret`n"
        [IO.File]::WriteAllText((Join-Path $PWD 'deploy/.env.local'), $localText, (New-Object Text.UTF8Encoding $false))
    } finally {
        $localRng.Dispose()
        $pgSecret = $null; $redisSecret = $null; $localText = $null
    }
}
git check-ignore -v -- deploy/.env.local
git ls-files -- deploy/.env.local
```

最后一条应无输出。首次拉取需要网络，容器凭据仍可由本机 Docker 管理员查看，不应公开容器完整 inspect 或环境配置。

## 预检、启动与容器检查

先确认当前 context 仍是本机 `desktop-linux`，endpoint 是本地命名管道；如果实际指向远端，停止并报告，不切换或连接远端。若 Engine 不可用，报告错误，不重置 Docker、不清理其他资源。检查端口，保留原有 5432 PostgreSQL；15432、6379 被其他服务占用时停止启动。

```powershell
Set-Location E:\AI-auto-edit-platform
docker context show
docker context inspect desktop-linux --format '{{.Endpoints.docker.Host}}'
# 仅在上一步确认是本机 endpoint 后执行：
docker --context desktop-linux info --format 'Engine={{.ServerVersion}} OSType={{.OSType}} Root={{.DockerRootDir}}'
Get-NetTCPConnection -State Listen -LocalPort 5432,15432,6379,8080 -ErrorAction SilentlyContinue |
    Select-Object LocalAddress,LocalPort,OwningProcess

$compose = @('--context','desktop-linux','compose','--project-name','ai-auto-edit-local',
    '--env-file','deploy/.env.local','--file','deploy/compose.local.yml')
docker @compose config --quiet
if ($LASTEXITCODE -ne 0) { throw 'Compose 配置无效' }
docker @compose pull postgres redis
if ($LASTEXITCODE -ne 0) { throw '镜像拉取失败' }
docker @compose up --detach --wait --wait-timeout 90 postgres redis
if ($LASTEXITCODE -ne 0) { throw '项目基础服务未就绪' }
docker @compose ps --all

$pg = 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At'
'SELECT 1;' | docker @compose exec -T postgres sh -ec $pg
$redisCli = 'REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli --no-auth-warning --raw'
docker @compose exec -T redis sh -ec ($redisCli + ' PING')
```

预期 PostgreSQL 输出 `1`，Redis 输出 `PONG`。容器健康检查分别使用 `pg_isready` 和认证后的 Redis PING；容器内检查不能代替 Windows Java 连接测试。

数据盘需核实 Docker 的实际 VHD 路径和其宿主分区空间，并区分 WSL 虚拟文件系统容量。本机实测 VHD 位于 `E:\DockerDesktopWSL\disk\docker_data.vhdx`，并非由项目盘位置推测；检查证据见验证记录。

## Windows Java 验证与健康接口

```powershell
Set-Location E:\AI-auto-edit-platform
$env:JAVA_HOME = 'E:\idea-2024\jbr'
& "$env:JAVA_HOME\bin\java.exe" -version
.\backend\mvnw.cmd --version
# 默认测试与打包不读取本地服务配置，也不依赖 Docker。
.\backend\mvnw.cmd -f backend/pom.xml --batch-mode test
if ($LASTEXITCODE -ne 0) { throw '默认测试失败' }
.\backend\mvnw.cmd -f backend/pom.xml --batch-mode -DskipTests package
if ($LASTEXITCODE -ne 0) { throw '打包失败' }

# 只在已启动专属服务后显式启用连接测试，不打印密码。
Get-Content -LiteralPath deploy/.env.local | ForEach-Object {
    if ($_ -match '^(POSTGRES_DB|POSTGRES_USER|POSTGRES_PASSWORD|REDIS_PASSWORD)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
try {
    .\backend\mvnw.cmd -f backend/pom.xml --batch-mode -Plocal-infra-it verify
    if ($LASTEXITCODE -ne 0) { throw 'Java 连接验证失败，不能视为通过' }
} finally {
    'POSTGRES_DB','POSTGRES_USER','POSTGRES_PASSWORD','REDIS_PASSWORD' | ForEach-Object {
        [Environment]::SetEnvironmentVariable($_, $null, 'Process')
    }
}

# 确认 8080 未被占用后，独立启动。结束时 Ctrl+C 只停止这个 Java 进程。
& "$env:JAVA_HOME\bin\java.exe" -jar backend/target/ai-auto-edit-backend-0.0.1-SNAPSHOT.jar
```

另开 PowerShell 请求：

```powershell
$response = Invoke-WebRequest 'http://127.0.0.1:8080/api/v1/health' -UseBasicParsing
$response.StatusCode
$response.Headers['Content-Type']
$response.Content
```

应为 `200`、`application/json`、`{"status":"UP","service":"ai-auto-edit-backend"}`。此接口只表示应用可响应，不反映依赖可用性。依赖就绪由显式连接测试单独验证，不新增诊断业务接口、Actuator 或数据源自动配置。

## 持久化复验与收尾

在前述同一根目录终端（保留 `$compose`、`$pg`、`$redisCli`）执行。验收键采用本项目前缀和随机 ID，不遍历或修改其他键。SET 和 WAITAOF 必须使用同一个 Redis 连接，以确认本次写入已落入本地 AOF；参见 [WAITAOF 官方说明](https://redis.io/docs/latest/commands/waitaof/)。

```powershell
$pgBefore = 'SELECT system_identifier FROM pg_control_system();' | docker @compose exec -T postgres sh -ec $pg
$idsBefore = @(docker @compose ps --all --quiet)
$acceptKey = 'ai-auto-edit-local:p004b:' + [guid]::NewGuid().ToString('N')
$acceptValue = 'persistence-' + [guid]::NewGuid().ToString('N')
$writeReply = @("SET $acceptKey $acceptValue", 'WAITAOF 1 0 5000') |
    docker @compose exec -T redis sh -ec $redisCli
if ($LASTEXITCODE -ne 0 -or ($writeReply -join ',') -ne 'OK,1,0') {
    throw '未确认验收写入落盘，不重建容器'
}

# 仅重建本项目的两个容器，复用命名卷。
docker @compose up --detach --force-recreate --wait --wait-timeout 90 postgres redis
if ($LASTEXITCODE -ne 0) { throw '重建后服务未就绪' }
$pgAfter = 'SELECT system_identifier FROM pg_control_system();' | docker @compose exec -T postgres sh -ec $pg
$valueAfter = docker @compose exec -T redis sh -ec ($redisCli + ' GET ' + $acceptKey)
$idsAfter = @(docker @compose ps --all --quiet)
if ($pgBefore -ne $pgAfter) { throw 'PostgreSQL 集群标识改变' }
if ($valueAfter -ne $acceptValue) { throw 'Redis 验收键未恢复' }
if (@($idsAfter | Where-Object { $idsBefore -contains $_ }).Count -gt 0) {
    throw '容器未全部重建'
}

# 仅清除本次键；同连接确认删除落盘，再确认不存在。
@("DEL $acceptKey", 'WAITAOF 1 0 5000', "EXISTS $acceptKey") |
    docker @compose exec -T redis sh -ec $redisCli
# 预期依次为 1、1、0、0。
docker @compose stop --timeout 15 postgres redis
docker @compose ps --all
docker --context desktop-linux volume ls --filter label=com.docker.compose.project=ai-auto-edit-local
git diff --check
git status --short
```

保留两个命名卷、已停止容器、项目网络、镜像和私有环境文件；不关闭 Docker Desktop、不执行全局清理、不删除数据卷。Linux 主机部署与 Linux Maven Wrapper 本阶段未验证。实际操作及证据见 [P0-04B 验证记录](P0-04B-validation.md)。

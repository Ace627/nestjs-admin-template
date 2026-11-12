<h1 align="center">NestJS Admin Template</h1>

<p align="center">
  基于 Vue 3 + NestJS 12 全 TypeScript 技术栈的中后台模板<br />
  权限模型完整落地 · 容器化开箱可用 · pnpm monorepo 单仓双端
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5.44-42b883?logo=vuedotjs&logoColor=white" alt="Vue" />
  <img src="https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

<p align="center">
  <a href="https://ace627.github.io/"><b>📚 在线文档</b></a> ·
  <a href="https://docs.apipost.net/docs/detail/61e0debdacca000?target_id=0"><b>📮 接口文档</b></a> ·
  <a href="./AGENTS.md">开发约定</a> ·
  <a href="./LICENSE">MIT License</a>
</p>

---

## 📖 简介

一套开箱可用的中后台模板：前端 **Vue 3 + TypeScript + Element Plus + Vite 8**，后端 **NestJS 12 + TypeORM + MySQL + Redis + BullMQ**。除登录鉴权外，还完整实现了用户、角色、菜单、部门、字典、参数、日志、缓存、定时任务、在线用户等中后台标配功能。

采用 **pnpm workspace monorepo** 结构：前后端分别位于 `apps/admin` 与 `apps/server`，共享依赖（axios、dayjs、lodash-es、TypeScript、Prettier 等）统一声明在根 `package.json`，全仓库共用一份 `pnpm-lock.yaml`，根目录一次 `pnpm install` 即可完成安装；根目录另提供 `dev:server` / `dev:admin` 一键启动脚本。

## 🖼️ 演示图

<table>
  <tr>
    <td><img src="./resource/preview/系统管理 字典管理.png" /></td>
    <td><img src="./resource/preview/系统管理 菜单管理.png" /></td>
  </tr>
  <tr>
    <td><img src="./resource/preview/效果案例 图表效果.png" /></td>
    <td><img src="./resource/preview/系统工具 接口文档.png" /></td>
  </tr>
  <tr>
    <td><img src="./resource/preview/系统监控 定时任务.png" /></td>
    <td><img src="./resource/preview/系统管理 参数设置.png" /></td>
  </tr>
</table>

## 🎯 内置功能

- **用户管理** — 用户的增删改查、重置密码、修改密码、角色分配、头像设置，支持按部门划分数据权限
- **部门管理** — 树形组织架构维护，级联调整下级部门，支持按部门划分数据权限
- **角色管理** — 菜单与按钮权限分配、按机构划分数据权限、角色编码管理
- **菜单管理** — 目录 / 菜单 / 按钮三级粒度，支持外链、内嵌 iframe
- **字典管理** — 字典类型 + 字典数据两级结构，Redis 缓存主动失效，全局 `useDict()` Hook 封装
- **参数设置** — 全局系统参数在线维护，Redis 缓存实时生效，全局 `useConfig()` Hook 取值
- **登录防护** — 登录失败按账号与来源 IP 计数锁定，阈值参数可配，监控页查看与解锁
- **登录续期** — 刷新令牌无感续期，会话闲置超时自动恢复，最长 7 天免重新登录
- **文件管理** — 目录树管理文件，回收站还原，支持秒传、分片上传、断点续传，按引用计数彻底删除
- **服务监控** — 实时 CPU 使用率、内存占用、磁盘空间、服务器运行信息与数据库连接池状态
- **缓存监控** — Redis 实例信息、内存使用量、Key 数量，分类浏览与在线可视化管理
- **健康检查** — `/live` `/ready` 双探针，适配 K8s / Docker Swarm 编排
- **在线用户** — 实时查看活跃会话，支持强制下线
- **定时任务** — BullMQ 动态调度，支持手动执行 / 暂停 / 恢复，含执行日志
- **操作日志** — 全接口自动记录，IP 归属地解析，支持条件查询与导出
- **登录日志** — 登录成功 / 失败全量记录，支持条件查询与导出
- **菜单搜索** — 导航栏关键词搜索菜单，快速跳转页面
- **列表工具栏** — 各列表页支持搜索区显隐、刷新与列显隐配置
- **暗黑模式** — 一键切换明暗主题，CSS 变量全局控制
- **多标签页** — 类浏览器 Tab 交互，支持刷新 / 关闭 / 右键菜单
- **响应式布局** — 适配 PC / Pad / Mobile，侧边栏自动折叠
- **布局设置** — 侧边栏 Logo、面包屑、标签页、动态标题均可自定义开关

## 🚀 快速开始

> 环境要求：Node.js ≥ 24 · pnpm 12 · MySQL 8 · Redis 7
>
> pnpm 版本由 `package.json` 的 `packageManager` 字段锁定，启用 corepack 时执行 `corepack enable` 后会自动使用对应版本。

```bash
# 1. 克隆仓库
git clone https://github.com/ace627/nestjs-admin-template.git
cd nestjs-admin-template

# 2. 安装依赖（workspace 根目录一次安装）
pnpm install

# 3. 配置后端环境变量：复制模板后按需修改 MYSQL_* / REDIS_* / JWT_SECRET
cp apps/server/.env.example apps/server/.env

# 4. 初始化数据库：一键建库、生成并执行迁移、写入种子数据
pnpm --filter server db:init

# 5. 启动
pnpm dev:server   # 后端 http://localhost:3000/api
pnpm dev:admin    # 前端 http://localhost:5173（开发代理已指向 3000）
```

启动完成后使用默认账号登录：**admin / 123456**（超级管理员，建议登录后修改密码）。

## 🗄️ 数据库教程

除快速开始中的 `pnpm --filter server db:init` 外，以下命令均在 `apps/server` 目录下执行，连接信息由 `apps/server/.env` 提供。

### 新项目初始化数据库（一键）

```bash
cd apps/server
cp .env.example .env   # 按需修改 MYSQL_* / REDIS_* / JWT_SECRET
pnpm db:init
```

一条命令按顺序完成四步：

1. 创建 `MYSQL_DATABASE` 指定的库（utf8mb4 / utf8mb4_unicode_ci）。
2. 仓库里还没有迁移文件时，在**空库**上执行 `migration:generate`，从实体 diff 出全部建表语句，生成 `src/database/migrations/<时间戳>-baseline.ts`；已有迁移文件则跳过此步。
3. 执行 `migration:run`，跑完 baseline 与之后的全部增量迁移（首次会创建 `sys_migrations` 记录执行历史）。
4. 从 `init.sql` 提取 `INSERT` 写入种子数据；脚本会补上显式列名，避免实体生成的列顺序与导出快照不一致导致数据错位。

`init.sql` 现在只作为种子数据来源，`CREATE TABLE` / `DROP TABLE` 不再直接导入。生成的 baseline 迁移文件**必须提交进仓库**：之后执行初始化会跳过生成步骤，只跑仓库里已有的迁移，换机器也不会得到时间戳不同的基线。生产环境首次部署同样执行这一条命令（把 `.env` 指向生产库），之后的结构变更只走增量迁移。

```bash
node scripts/init-db.mjs --dry-run   # 只检测并打印将要执行的动作，不写库、不生成文件
```

> 目标库已有表时脚本会中止，避免破坏现有数据；确认要删库重建才执行 `node scripts/init-db.mjs --force`，该操作不可撤销。

### 后续改字段：用 TypeORM 迁移同步数据库

`.env` 中 `MYSQL_SYNCHRONIZE=false`，改实体后表结构不会自动变化，一律通过迁移同步：

```bash
# 1. 修改实体文件 apps/server/src/**/*.entity.ts

# 2. 生成增量迁移（对比实体与当前连接的数据库）
pnpm migration:generate
#   生成 src/database/migrations/<时间戳>-init.ts
#   自定义文件名：pnpm typeorm migration:generate src/database/migrations/add-user-status

# 3. 检查生成的 up() / down()（数据变更的回滚逻辑需手写），提交该迁移文件

# 4. 执行迁移（本地与生产执行同一条）
pnpm migration:run

# 5. 查看已执行 / 待执行
pnpm typeorm migration:show

# 6. 回滚最后一条
pnpm migration:revert
```

- `migration:generate` 以当前连接的库为基准做 diff：空库上生成的是全量 baseline，结构仍是上一版的库上生成的是增量迁移。若实体与库结构完全一致，命令不会生成文件，而是打印 `No changes in database schema were found` 并以非零码退出。
- 首次执行 `migration:run` 时 TypeORM 会自动创建 `sys_migrations` 表记录执行历史；`migration:revert` 每次只回滚最后一条，且依赖 `down()` 写对。
- 迁移命令依赖 `esno` 与 TypeScript 源码，请在本地或 CI 等具备完整依赖的环境执行；连接生产库时通过 `.env` / 环境变量指向生产地址，并保持 `MYSQL_SYNCHRONIZE=false`。baseline 应在本地生成并提交，生产环境执行时脚本会跳过生成步骤。
- 初始化之后的结构变更一律走迁移，不要手工改表。

## 🐳 Docker 部署

只编排 NestJS 服务，MySQL / Redis 连接现成的容器或客户端。先在仓库根目录创建 `.env`（勿提交，与本地开发用的 `apps/server/.env` 是两份）配置连接信息：

```bash
# .env（仓库根目录）
MYSQL_HOST=192.168.1.10   # 容器可访问的 MySQL IP（勿写 127.0.0.1）
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=your-strong-password
MYSQL_DATABASE=nestdemo
REDIS_HOST=192.168.1.10   # 容器可访问的 Redis IP（勿写 127.0.0.1）
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your-random-secret
```

外部 MySQL 需先按上文「数据库教程」完成初始化，然后：

```bash
docker compose up -d --build
```

服务启动后监听 `3000` 端口，健康探针为 `/api/monitor/health/live`；前端需另行 `pnpm build` 后部署静态产物。

### 离线部署：构建并导出镜像 tar

目标机器不能联网构建时，在联网的构建机上执行仓库根目录的脚本，一次完成构建与导出：

```bash
node scripts/build-server-image.mjs
# 产物：dist/nest-admin-template-server.tar
# 导出成功后脚本会删除本地同名镜像，不在 Docker 镜像列表留存
```

镜像名与产物路径统一在脚本顶部的 `config` 常量中修改（默认 `nest-admin-server:latest` / `dist/nest-admin-template-server.tar`）。把 tar 拷到目标机后导入并启动：

```bash
docker load -i nest-admin-template-server.tar
docker run -d --name nest-admin-server --restart unless-stopped \
  -p 3000:3000 --env-file .env nest-admin-server:latest
```

> - 镜像名 `nest-admin-server:latest` 与 `docker-compose.yml` 的 `image` 字段一致，导入后用 `docker compose up -d` 即可直接启动（无需 `--build`）。
> - 镜像架构跟随构建机（默认 `linux/amd64`），目标机为 arm64 等架构时需在同架构机器上构建，否则导入后无法运行。

## 📂 目录结构

```
├── apps/                # pnpm workspace 子包
│   ├── admin/           # 前端工程（Vue 3 + TypeScript + Vite）
│   └── server/          # 后端工程（NestJS + TypeORM）
│       └── .env.example # 环境变量模板
├── scripts/             # 仓库级脚本（SVG 图标清理、init.sql 生成、镜像构建导出）
├── docs/                # 本地文档
├── dist/                # 构建产物目录（离线镜像 tar，不入库）
├── init.sql             # 种子数据来源（脚本只提取 INSERT，建表由迁移负责）
├── docker-compose.yml   # 后端服务编排（仅 server，连外部 MySQL / Redis）
├── Dockerfile.server    # 后端镜像构建文件
├── pnpm-workspace.yaml  # pnpm workspace 配置
└── AGENTS.md            # 开发协作约定
```

## 💬 前后端分离交流群

QQ群：[![加入QQ群](https://img.shields.io/badge/未满-1041747918-brightgreen.svg)](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=uwnXZCQo-IuGObfiFh_ehcAGxrM1UBoc&authKey=e4YrAHRe2LEg8CG1%2B6uAh6hdKOHTBUElwHyT48B%2FptK9NaemIkKNa0cA2E0ylsSS&noverify=0&group_code=1041747918)

点击按钮入群。

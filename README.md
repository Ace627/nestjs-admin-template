<h1 align="center">NestJS Admin Template</h1>

<p align="center">
  基于 Vue 3 + NestJS 11 全 TypeScript 技术栈的中后台模板<br />
  权限模型完整落地 · 容器化开箱可用 · 前后端同仓库独立工程
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5.42-42b883?logo=vuedotjs&logoColor=white" alt="Vue" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
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

一套开箱可用的中后台模板：前端 **Vue 3 + TypeScript + Element Plus + Vite 8**，后端 **NestJS 11 + TypeORM + MySQL + Redis + BullMQ**。除登录鉴权外，还完整实现了用户、角色、菜单、部门、字典、参数、日志、缓存、定时任务、在线用户等中后台标配功能。

前后端放在**同一个仓库的两个独立工程**中（`admin/` 与 `server/`），**不是 monorepo**——两个工程各自 `pnpm install`，互不干扰，可以单独构建、单独部署；根目录的 `package.json` 仅提供 `dev:server` / `dev:admin` 一键启动脚本。

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

> 环境要求：Node.js ≥ 20 · pnpm 10 · MySQL 8 · Redis 7

```bash
# 1. 克隆仓库
git clone https://github.com/ace627/nestjs-admin-template.git
cd nestjs-admin-template

# 2. 安装依赖（前后端独立工程，各自安装）
cd server && pnpm install && cd ..
cd admin  && pnpm install && cd ..

# 3. 初始化数据库：创建 nestdemo 库（utf8mb4），导入根目录 init.sql
mysql -uroot -p -e "CREATE DATABASE nestdemo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -uroot -p nestdemo < init.sql

# 4. 配置后端环境变量：复制模板后按需修改连接信息与 JWT_SECRET
cp server/.env.example server/.env

# 5. 启动（也可在根目录直接执行 pnpm dev:server / pnpm dev:admin）
cd server && pnpm start:dev   # 后端 http://localhost:3000/api
cd admin  && pnpm dev         # 前端 http://localhost:5173（开发代理已指向 3000）
```

启动完成后使用默认账号登录：**admin / 123456**（超级管理员，建议登录后修改密码）。

## 🐳 Docker 部署

后端三件套（NestJS 服务 + MySQL 8 + Redis 7）一键编排，MySQL 首次启动自动导入 `init.sql`，数据持久化在命名卷中：

```bash
# 先在仓库根目录创建 .env 并写入：
#   MYSQL_PASSWORD=your-strong-password
#   JWT_SECRET=your-random-secret
docker compose up -d --build
```

服务启动后监听 `3000` 端口，健康探针为 `/api/monitor/health/live`；前端需另行 `pnpm build` 后部署静态产物。

## 📂 目录结构

```
├── admin/               # 前端工程（Vue 3 + TypeScript + Vite）
├── server/              # 后端工程（NestJS + TypeORM）
│   └── .env.example     # 环境变量模板
├── scripts/             # 仓库级脚本（SVG 图标批量清理等）
├── docs/                # 本地文档
├── init.sql             # 数据库初始化脚本（建表 + 种子数据）
├── docker-compose.yml   # 后端一键编排（server + MySQL + Redis）
├── Dockerfile.server    # 后端镜像构建文件
└── AGENTS.md            # 开发协作约定
```

## 🖼️ 演示图

<table>
  <tr>
    <td><img src="https://cdn.phototourl.com/free/2026-09-17-940bcfe0-6949-4f6e-95f0-3c14b821057b.png" /></td>
    <td><img src="https://cdn.phototourl.com/free/2026-09-14-712fbe3f-93ab-4c56-b2ae-341acb8feed0.png" /></td>
  </tr>
  <tr>
    <td><img src="https://cdn.phototourl.com/free/2026-09-21-7e4b8283-7d7e-4444-85db-60eeb1ab6b13.png" /></td>
    <td><img src="https://cdn.phototourl.com/free/2026-09-21-838f6a1d-da4a-47e5-b2d4-81c26f93122e.png" /></td>
  </tr>
  <tr>
    <td><img src="https://cdn.phototourl.com/free/2026-09-14-6e12e6b9-cbf3-455c-b40a-1ce15d538bfa.png" /></td>
    <td><img src="https://cdn.phototourl.com/free/2026-09-14-d35f58a7-280e-4f22-a521-f0a9f30ebcc0.png" /></td>
  </tr>
</table>

## 💬 前后端分离交流群

QQ群：[![加入QQ群](https://img.shields.io/badge/未满-1041747918-brightgreen.svg)](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=uwnXZCQo-IuGObfiFh_ehcAGxrM1UBoc&authKey=e4YrAHRe2LEg8CG1%2B6uAh6hdKOHTBUElwHyT48B%2FptK9NaemIkKNa0cA2E0ylsSS&noverify=0&group_code=1041747918)

点击按钮入群。

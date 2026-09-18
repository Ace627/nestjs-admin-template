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

一套开箱可用的中后台模板：前端 **Vue 3 + TypeScript + Element Plus + Vite 8**，后端 **NestJS 11 + TypeORM + MySQL + Redis + BullMQ**。除登录鉴权外，还完整实现了用户、角色、菜单、部门、字典、日志、缓存、定时任务、在线用户等中后台标配功能。

前后端放在**同一个仓库的两个独立工程**中（`admin/` 与 `server/`），**不是 monorepo**——根目录没有 `package.json`，两个工程各自 `pnpm install`，互不干扰，可以单独构建、单独部署。

## 🎯 内置功能

- **用户管理** — 用户的增删改查、重置密码、修改密码、角色分配、头像设置，支持按部门划分数据权限
- **部门管理** — 树形组织架构维护，级联调整下级部门，支持按部门划分数据权限
- **角色管理** — 菜单与按钮权限分配、按机构划分数据权限、角色编码管理
- **菜单管理** — 目录 / 菜单 / 按钮三级粒度，支持外链、内嵌 iframe
- **字典管理** — 字典类型 + 字典数据两级结构，Redis 缓存主动失效，全局 `useDict()` Hook 封装
- **参数设置** — 全局系统参数在线维护，Redis 缓存实时生效，全局 `useConfig()` Hook 取值
- **文件管理** — 目录树管理文件，回收站还原，支持秒传、分片上传、断点续传，按引用计数彻底删除
- **服务监控** — 实时 CPU 使用率、内存占用、磁盘空间、服务器运行信息与数据库连接池状态
- **缓存监控** — Redis 实例信息、内存使用量、Key 数量，分类浏览与在线可视化管理
- **健康检查** — `/live` `/ready` 双探针，适配 K8s / Docker Swarm 编排
- **在线用户** — 实时查看活跃会话，支持强制下线
- **定时任务** — BullMQ 动态调度，支持手动执行 / 暂停 / 恢复，含执行日志
- **操作日志** — 全接口自动记录，IP 归属地解析，支持条件查询与导出
- **登录日志** — 登录成功 / 失败全量记录，支持条件查询与导出
- **暗黑模式** — 一键切换明暗主题，CSS 变量全局控制
- **多标签页** — 类浏览器 Tab 交互，支持刷新 / 关闭 / 右键菜单
- **响应式布局** — 适配 PC / Pad / Mobile，侧边栏自动折叠
- **布局设置** — 侧边栏 Logo、面包屑、标签页、动态标题均可自定义开关

## 🖼️ 演示图

<table>
  <tr>
    <td><img src="https://cdn.phototourl.com/free/2026-09-17-940bcfe0-6949-4f6e-95f0-3c14b821057b.png" /></td>
    <td><img src="https://cdn.phototourl.com/free/2026-09-14-712fbe3f-93ab-4c56-b2ae-341acb8feed0.png" /></td>
  </tr>
  <tr>
    <td><img src="https://cdn.phototourl.com/free/2026-09-14-6e12e6b9-cbf3-455c-b40a-1ce15d538bfa.png" /></td>
    <td><img src="https://cdn.phototourl.com/free/2026-09-14-d35f58a7-280e-4f22-a521-f0a9f30ebcc0.png" /></td>
  </tr>
</table>

## 💬 前后端分离交流群

QQ群：[![加入QQ群](https://img.shields.io/badge/未满-1041747918-brightgreen.svg)](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=uwnXZCQo-IuGObfiFh_ehcAGxrM1UBoc&authKey=e4YrAHRe2LEg8CG1%2B6uAh6hdKOHTBUElwHyT48B%2FptK9NaemIkKNa0cA2E0ylsSS&noverify=0&group_code=1041747918)

点击按钮入群。

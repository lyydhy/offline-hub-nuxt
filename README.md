# 📦 Offline Hub (Nuxt 4)

> 极简的 H5 离线包管理后台 — 给 [flutter_webview_preloader](https://github.com/lyydhy/flutter_webview_preloader) 用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.4-00DC82?style=flat-square&logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

## ✨ 这是什么

一个**单仓库**的 H5 离线包管理服务，**Nuxt 4 全栈**：

- **后端**：Nitro server routes + better-sqlite3
- **前端**：Vue 3 Composition API
- **数据库**：SQLite (文件式，零依赖)
- **API**：4 个 — 上传 / 列表 / 下载 / 删除

## 🚀 快速开始

```bash
# 装依赖
npm install

# 启动开发服
PORT=8080 npm run dev

# 浏览器打开
open http://localhost:8080
```

## 📡 API

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/packages` | 列出所有包（支持 `?packageId=xxx` 过滤） |
| GET | `/api/packages/latest` | 每个包 ID 返回最新版本 |
| GET | `/api/packages/stats` | 统计（总包数 / 业务数 / 总大小） |
| POST | `/api/packages` | 上传 zip（multipart：`file`, `packageId`, `version`, `md5`） |
| GET | `/api/packages/:id/download` | 下载 zip |
| DELETE | `/api/packages/:id` | 删除 zip |

## 📤 上传示例

```bash
curl -X POST http://localhost:8080/api/packages \
  -F "file=@./dist.zip" \
  -F "packageId=main" \
  -F "version=v1.0.0" \
  -F "md5=$(md5sum ./dist.zip | awk '{print $1}')"
```

返回：

```json
{
  "ok": true,
  "id": 1,
  "packageId": "main",
  "version": "v1.0.0",
  "filename": "main_v1.0.0_1782272102165.zip",
  "size": 666,
  "md5": "b74335571e2c9c2dff6be68f71d7519a",
  "url": "/api/packages/1/download"
}
```

## 🏗️ 项目结构

```
offline-hub-nuxt/
├── app/                          # Nuxt 4 前端(全部在 app/ 下)
│   ├── app.vue                   # 根布局(用 <NuxtPage />)
│   ├── pages/
│   │   └── index.vue             # 管理页(上传/列表/下载/删除)
│   └── components/               # (预留)
├── server/                       # Nuxt 4 后端
│   ├── api/                      # Nitro 路由(文件名即路径)
│   │   ├── packages.get.ts               # 列表
│   │   ├── packages/index.post.ts        # 上传
│   │   ├── packages/latest.get.ts        # 每个包最新
│   │   ├── packages/stats.get.ts         # 统计
│   │   ├── packages/[id].delete.ts       # 删除
│   │   └── packages/[id]/download.get.ts # 下载
│   ├── plugins/
│   │   └── init.ts                # 启动时初始化 DB
│   └── utils/
│       └── db.ts                  # SQLite 封装
├── public/                        # 静态资源
├── data/                          # 运行时生成
│   ├── hub.db                     # SQLite
│   └── zips/                      # zip 存储
├── nuxt.config.ts
├── package.json
└── README.md
```

## 🔗 业务方对接

App 端用 [flutter_webview_preloader](https://github.com/lyydhy/flutter_webview_preloader)：

```dart
// 1. 启动后拉取最新包列表
final resp = await http.get(Uri.parse('$HUB/api/packages/latest'));
final list = (jsonDecode(resp.body)['packages'] as List).cast<Map>();

// 2. 批量注册到插件
for (final pkg in list) {
  await OfflineManager.instance.registerPackage(OfflinePackage(
    packageId: pkg['packageId'],
    version: pkg['version'],
    zipUrl: pkg['zipUrl'],
    expectedMd5: pkg['expectedMd5'],
  ));
}
```

## 🛠️ 配置

通过环境变量：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | 3000 (Nuxt 默认) | HTTP 端口 |
| `NODE_ENV` | development | dev / production |

数据目录硬编码在 `data/` (相对项目根)，通过 `server/plugins/init.ts` 配置。

## 📦 部署

```bash
# 1. 生产构建
npm run build

# 2. 启动
node .output/server/index.mjs
```

或用 PM2 / Docker / systemd 托管。

## 🧪 技术栈

- **Nuxt 4.4** — 全栈框架
- **Vue 3.5** — Composition API
- **TypeScript 5** — 类型安全
- **Nitro** — 服务端引擎
- **better-sqlite3 12** — 同步 SQLite
- **h3** — HTTP 框架（Nitro 内置）

## 🔗 关联项目

- **[flutter_webview_preloader](https://github.com/lyydhy/flutter_webview_preloader)** — Flutter H5 容器插件
- 这个服务就是为它的 `OfflineManager.registerPackage()` 设计的

## 📄 License

[MIT](LICENSE) © 2026 lyydhy

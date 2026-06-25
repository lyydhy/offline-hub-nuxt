# AI_DEV.md — offline-hub-nuxt

> 给下一个 AI agent / 接手开发者看的开发指南。
> 读完本文应该能 30 分钟内上手修改。

---

## 0. 项目身份卡

| 字段 | 值 |
|---|---|
| 类型 | Nuxt 4 全栈应用（Vue 3 + TypeScript + better-sqlite3） |
| 主要功能 | H5 离线包管理后台：上传、列表、下载、删除 |
| 仓库 | https://github.com/lyydhy/offline-hub-nuxt |
| 当前版本 | v0.1.0 |
| 端口 | **52001**（dev + prod 都锁定，不读 PORT 环境变量） |
| 配套项目 | [flutter_webview_preloader](https://github.com/lyydhy/flutter_webview_preloader) |
| 配套 H5 模板 | `h5s/`（Vue / React / Solid） |

---

## 1. 架构总览

```
┌──────────────────────────────────────────┐
│ Nuxt 4 (Vue 3 + Nitro)                   │
│                                          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Frontend    │  │ Backend (Nitro)  │  │
│  │ app/        │  │ server/           │  │
│  │ app.vue     │  │ api/packages.*    │  │
│  │ pages/      │  │ plugins/init.ts   │  │
│  │ index.vue   │  │ utils/db.ts       │  │
│  └──────┬──────┘  └────────┬─────────┘  │
│         │   $fetch           │             │
│         └───────────────────┘             │
│                       │                  │
│                ┌──────▼──────┐          │
│                │ better-     │          │
│                │ sqlite3     │          │
│                │ data/hub.db │          │
│                └─────────────┘          │
└──────────────────────────────────────────┘
```

**核心思路**：单仓库单进程。Nitro `server/api/` 文件名 = URL 路径。前端 `app/pages/` = Vue Router 路由。

---

## 2. 文件清单（必读顺序）

### 根目录
- `package.json` — 依赖 + scripts
- `nuxt.config.ts` — **端口配置在这里**（dev + prod）
- `tsconfig.json` — TypeScript 配置

### 后端 `server/`
1. `utils/db.ts` — **SQLite 封装**（所有数据库操作入口）
2. `plugins/init.ts` — 启动时初始化 DB + zips 目录
3. `plugins/runtime-config.ts` — **强制锁定端口 52001**（prod 模式）
4. `api/packages.get.ts` — 列表
5. `api/packages/index.post.ts` — 上传（multipart + MD5 校验）
6. `api/packages/latest.get.ts` — 每个包最新
7. `api/packages/stats.get.ts` — 统计
8. `api/packages/[id].delete.ts` — 删除
9. `api/packages/[id]/download.get.ts` — 下载

### 前端 `app/`
- `app.vue` — 根布局（`<NuxtPage />`）
- `pages/index.vue` — 管理页（上传表单 + 列表 + 统计）
- `assets/` — 静态资源（如有）

### 数据
- `data/hub.db` — SQLite 文件（运行时生成，gitignore）
- `data/zips/*.zip` — 存储的上传文件（gitignore）

### 测试 H5
- `h5s/` — 3 个示例 H5（Vue / React / Solid），打包成 zip 用来测试

---

## 3. 关键设计决策（"为什么这样"）

### 3.1 为什么端口写死在 nuxt.config.ts（不读 PORT）
- 环境变量容易被外部污染
- 改一处比改两处（dev + prod）简单
- 端口改动要明显（PR review 必看）

### 3.2 为什么用 better-sqlite3（不是 prisma / drizzle）
- 同步 API，简单直接
- 单文件数据库，零运维
- 测试场景不需要高并发
- 换 ORM 收益不大

### 3.3 为什么 6 个 API 拆成独立文件（不是 1 个 switch）
- Nuxt/Nitro 文件名即路由
- 每个文件单一职责，加新 API 不影响老的
- 改一个不触发全量重编译

### 3.4 为什么用 Nitro 内置 `readMultipartFormData`（不装 formidable）
- Nitro/h3 内置支持 multipart
- 少一个依赖，少一份安全更新
- 对简单上传够用

### 3.5 为什么不做用户系统 / 鉴权
- **定位是内部测试工具**
- 上线公网必须加：至少 basic auth + HTTPS
- 未来如果要加，**全部加在 `server/utils/auth.ts` + Nuxt middleware**，不要散落在 API

### 3.6 为什么前端用 `app/` 目录（不是根目录）
- Nuxt 4 新约定：`app/` 包前端
- 后端 `server/` 不被前端 bundle 引用
- TypeScript 类型自动分离（client / server）

---

## 4. 任务清单（按场景分类）

### 4.1 修 bug
```bash
# 1. 拉代码
git clone git@github.com:lyydhy/offline-hub-nuxt.git
cd offline-hub-nuxt
npm install

# 2. 启动 dev
npm run dev
# → http://localhost:52001/

# 3. 修代码
# 4. 验证
npm run build  # 生产构建,确保没 TS 错误
# 5. 提交 PR
```

### 4.2 加新 API
**步骤模板**：
1. **加 SQL 方法**（`server/utils/db.ts`）
2. **建 API 文件**（`server/api/your-endpoint.{get,post,delete}.ts`）
3. **写测试**（手测 + `npx tsc --noEmit`）
4. **前端调用**（`$fetch` + `useFetch` composable）

**规则**：
- 所有 API 路径以 `/api/` 开头
- 错误用 `createError({ statusCode, statusMessage })`
- 任何 IO 操作必须用 `try/catch`
- 长任务加 `console.log` 进度日志

### 4.3 加前端页面
1. **建 `app/pages/your-page.vue`**
2. **在导航里加 `<NuxtLink to="/your-page">`**
3. **用 `$fetch` / `useFetch` 调 API**
4. **TypeScript 类型化**（不用 `any`）

### 4.4 加鉴权（如果以后要做）
```ts
// 1. server/utils/auth.ts
export function requireAuth(event: H3Event) {
  const token = getHeader(event, 'authorization')
  if (token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

// 2. 每个 API 加
export default defineEventHandler((event) => {
  requireAuth(event)
  // ...
})

// 3. 改 runtime-config.ts 读 ADMIN_TOKEN 环境变量（这个可以！）
```

### 4.5 部署
```bash
# 构建
npm run build

# 运行
node .output/server/index.mjs
# → http://localhost:52001/
```

**生产部署注意**：
- 用 PM2 / systemd 托管
- Nginx 反向代理 + HTTPS
- 定期备份 `data/hub.db`
- 监控磁盘（zip 文件可能占大量空间）

### 4.6 改端口
**只改一处**：`nuxt.config.ts`
```ts
devServer: { port: 52001 },  // 改这里
```
+ `server/plugins/runtime-config.ts`
```ts
const PRODUCTION_PORT = 52001  // 改这里
```

---

## 5. 调试技巧

### 启动报错
```bash
# 看完整日志
npm run dev 2>&1 | tee /tmp/hub.log

# libsqlite3 找不到（macOS Linux）
# 装 libsqlite3-dev
```

### 路由 404
- 检查 `server/api/xxx.ts` 文件名是否对（要全小写 + 点号转方法）
- 例：`/api/packages/[id].delete.ts` → `DELETE /api/packages/:id`

### DB 表结构变了
- 直接删 `data/hub.db` 重新建（**会丢所有上传！**）
- 改 schema 必须做 migration：
  ```ts
  // db.ts init() 里加
  db.exec(`ALTER TABLE packages ADD COLUMN xxx TEXT`)
  ```

### 前端 500 错误
- 看浏览器 Network 面板
- 路由 `/api/...` 路径是否对
- CORS（dev 模式默认允许，prod 部署要配）

---

## 6. 关键 API 速查

### API 列表
| Method | Path | 说明 |
|---|---|---|
| GET | `/api/packages` | 列表（`?packageId=xxx` 过滤） |
| GET | `/api/packages/latest` | 每个包最新 |
| GET | `/api/packages/stats` | 统计 |
| POST | `/api/packages` | 上传（multipart） |
| GET | `/api/packages/:id/download` | 下载 |
| DELETE | `/api/packages/:id` | 删除 |

### 上传示例
```bash
curl -X POST http://localhost:52001/api/packages \
  -F "file=@./dist.zip" \
  -F "packageId=main" \
  -F "version=v1.0.0" \
  -F "md5=$(md5sum ./dist.zip | awk '{print $1}')"
```

### 业务方集成（App 端 Dart）
```dart
final resp = await http.get(Uri.parse('http://hub:52001/api/packages/latest'));
final list = jsonDecode(resp.body)['packages'] as List;
for (final pkg in list) {
  await OfflineManager.instance.registerPackage(OfflinePackage(
    packageId: pkg['packageId'],
    version: pkg['version'],
    zipUrl: pkg['zipUrl'],
    expectedMd5: pkg['expectedMd5'],
  ));
}
```

---

## 7. 已知限制

- **无鉴权** — 内网测试用，**别暴露公网**
- **无文件清理 API** — 业务方自己 `dart:io` 遍历清理
- **无断点续传** — 大文件上传可能 OOM
- **无多租户** — 单实例
- **无 CDN 集成** — zip 走本机文件系统
- **iOS 自定义目录限制** — iOS 沙盒机制（这其实是 webview_preloader 插件的限制）

---

## 8. 上线 Checklist

```markdown
- [ ] `npm install` 装全
- [ ] `npm run build` 成功
- [ ] `node .output/server/index.mjs` 启动 OK
- [ ] curl /api/packages/stats 返回 0
- [ ] curl /api/packages 上传 → 下载 → 删除 全过
- [ ] 浏览器打开 http://localhost:52001/ 看到管理界面
- [ ] 端口 52001 锁死（unset PORT NITRO_PORT 启动后还是 52001）
- [ ] 修改了 vue / 改 vite.config.ts 后 `npm run build` 通过
- [ ] 修改了任何文件，`npx tsc --noEmit` 没 TS 错误
```

---

## 9. 紧急修复流程

如果线上出问题：
1. **看日志** → `journalctl -u offline-hub` 或 `pm2 logs`
2. **临时禁用上传** → 改 `server/api/packages/index.post.ts` 加 `throw createError({ statusCode: 503 })`
3. **回滚** → `git revert <commit>` 或 `git checkout <last-good-commit>`
4. **DB 备份** → `cp data/hub.db data/hub.db.bak`

---

## 10. 写给下一个 agent

- **不要改端口读环境变量** — 写死在 nuxt.config.ts + runtime-config.ts
- **不要加 ORM** — better-sqlite3 + 手写 SQL 够用
- **不要拆微服务** — 这是单进程工具，拆了反而复杂
- **不要加鉴权中间件** — 除非确认要上公网
- **不要修改 `h5s/` 项目** — 那是示例项目，单独维护
- **不要把 zip 存到 git** — `data/zips/*.zip` 已在 gitignore
- **不要用 `npm install` 不带 `NODE_ENV=`** — 本机环境变量是 production，会跳过 devDeps
- **不要换 Nuxt 版本** — Nuxt 4 是当前版本，跨大版本改动大
- **新加 API 必须双路径** — `server/api/your.ts`（前端 `$fetch('/api/your')`）
- **新加表 / 改 schema** — 必须做 migration，不要直接 DROP TABLE
- **TypeScript 严格模式** — 不用 `any`，`null` 显式处理

---

**最后更新**：v0.1.0 (2026-06-25)

# H5 测试项目

> 给 [flutter_webview_preloader](https://github.com/lyydhy/flutter_webview_preloader) 测试用的 3 个 H5 项目

## 项目列表

| 项目 | 框架 | 路由模式 | dist 大小 | 适用场景 |
|---|---|---|---|---|
| [h5-vue-ts](./h5-vue-ts) | Vue 3.5 | **hash** (`createWebHashHistory`) | 40 KB | 通用 SPA |
| [h5-react-ts](./h5-react-ts) | React 19 | history (BrowserRouter) | 75 KB | 通用 SPA |
| [h5-solidjs-ts](./h5-solidjs-ts) | SolidJS 1.9 | (无路由) | 29 KB | **最小体积** |

## 路由选择

- **Vue 用 hash 模式** (`createWebHashHistory`):
  - URL 形如 `app://main/index.html#/about`
  - 优点:任何 HTTP/WebView 协议都 OK,服务器不需要 fallback
  - 缺点:URL 丑(带 `#`)
- **React 用 history 模式** (BrowserRouter):
  - URL 形如 `app://main/about`
  - 优点:URL 干净
  - 缺点:服务器需要 fallback `*.html`(静态服务器默认会,nginx 需要 try_files)

**结论**: 在 `app://` 协议下两个都能工作,**hash 模式更稳**(不依赖服务器 fallback)。

## 通用配置

每个项目的 `vite.config.ts` 都已配置:

```ts
{
  base: './',                    // 关键:相对路径,适配 app://
  build: {
    target: 'es2015',            // 兼容老 WebView
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',     // 文件名加 hash
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
}
```

## 使用流程

```bash
# 1. 安装依赖(注意 NODE_ENV=production 会跳过 devDeps)
cd h5s/h5-vue-ts
NODE_ENV= npm install

# 2. 开发
npm run dev

# 3. 构建
npm run build

# 4. 打 zip
cd ..
zip -rq test_h5-vue-ts.zip h5-vue-ts/dist/

# 5. 上传到 offline-hub
curl -X POST http://localhost:52001/api/packages \
  -F "file=@./test_h5-vue-ts.zip" \
  -F "packageId=h5-vue-ts" \
  -F "version=v1.0.0" \
  -F "md5=$(md5sum test_h5-vue-ts.zip | awk '{print $1}')"
```

## 路由测试

启动后用 `serve` 模拟静态服务器:

```bash
npx serve h5s/h5-vue-ts/dist -l 8101
# 浏览器打开:
#   http://localhost:8101/        → Home 页
#   http://localhost:8101/#/about → About 页(hash 模式)
```

## 注意事项

- **环境变量 `NODE_ENV=production` 会让 `npm install` 跳过 devDependencies**。
  装的时候用 `NODE_ENV= npm install` 强制覆盖。
- 每个项目独立 `package.json`,独立装。
- `node_modules/` 和 `dist/` 已在 `.gitignore`,不提交。

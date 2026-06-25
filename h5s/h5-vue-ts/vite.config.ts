import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',  // 关键:相对路径,适配 app://<packageId>/ 协议
  plugins: [vue()],

  build: {
    // 输出文件名加 hash(缓存友好)
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 兼容老 WebView
    target: 'es2015',
  },
})

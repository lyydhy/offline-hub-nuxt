// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // === 端口配置 ===
  // 改这里:开发用 devServer.port,生产用 nitro.port。
  // 都不读 PORT 环境变量,避免污染。

  // 开发模式端口(npm run dev)
  devServer: {
    port: 3000,
    host: '0.0.0.0',
  },

  // Nitro 配置(同时影响 dev 和 production)
  nitro: {
    // 生产/SSR 端口(npm run start / node .output/server/index.mjs)
    // 显式设置,避免读 PORT/NITRO_PORT
    preset: 'node-server',
  },
})

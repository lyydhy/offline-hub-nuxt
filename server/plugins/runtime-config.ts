import { defineNitroPlugin } from 'nitropack/runtime'

/**
 * 锁定 Nitro 服务器端口(脱离环境变量)。
 *
 * 启动时 patch process.env,让 Nitro 的 listen 拿到我们指定的端口。
 * 不读 PORT / NITRO_PORT,只用这里的固定值。
 */
const PRODUCTION_PORT = 3000

export default defineNitroPlugin(() => {
  // listen 之前 patch 环境变量
  process.env.NITRO_PORT = String(PRODUCTION_PORT)
  delete process.env.PORT
  console.log(`[offline-hub] production port locked to ${PRODUCTION_PORT}`)
})

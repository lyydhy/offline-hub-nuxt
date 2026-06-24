import { resolve } from 'node:path'
import { initStorage } from '~~/server/utils/db'

/**
 * Nitro 启动钩子:初始化 SQLite + zips 目录。
 */
export default defineNitroPlugin(() => {
  const root = process.cwd()
  const dbPath = resolve(root, 'data/hub.db')
  const zipsDir = resolve(root, 'data/zips')
  initStorage(dbPath, zipsDir)
})

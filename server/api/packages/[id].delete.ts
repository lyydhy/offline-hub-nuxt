import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { deleteById, getZipsDir } from '~~/server/utils/db'

/**
 * DELETE /api/packages/:id
 */
export default defineEventHandler((event) => {
  const idStr = getRouterParam(event, 'id')
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const filename = deleteById(id)
  if (!filename) {
    throw createError({ statusCode: 404, statusMessage: 'Package not found' })
  }

  // 删文件(忽略错误,文件可能已被手动删除)
  const filePath = join(getZipsDir(), filename)
  if (existsSync(filePath)) {
    try {
      rmSync(filePath)
    } catch (e) {
      console.warn(`[delete] failed to remove file ${filePath}:`, e)
    }
  }

  return { ok: true, deleted: id }
})

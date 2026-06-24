import { createReadStream, existsSync } from 'node:fs'
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { getById, getZipsDir } from '~~/server/utils/db'

/**
 * GET /api/packages/:id/download
 */
export default defineEventHandler((event) => {
  const idStr = getRouterParam(event, 'id')
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const row = getById(id)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Package not found' })
  }

  const filePath = join(getZipsDir(), row.filename)
  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File missing' })
  }

  const stat = statSync(filePath)
  // 触发下载(浏览器)
  setHeader(event, 'content-type', 'application/zip')
  setHeader(
    event,
    'content-disposition',
    `attachment; filename="${row.package_id}_${row.version}.zip"`,
  )
  setHeader(event, 'content-length', String(stat.size))

  return sendStream(event, createReadStream(filePath))
})

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { getZipsDir, insertPackage, getLatest } from '~~/server/utils/db'

/**
 * POST /api/packages
 * multipart/form-data 字段:
 *   - file: zip 文件(必填)
 *   - packageId: 包 ID(必填)
 *   - version: 版本号(必填)
 *   - md5: 客户端预计算的 MD5(可选,服务端会二次校验)
 */
export default defineEventHandler(async (event) => {
  // 1. 读 multipart
  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid multipart body' })
  }

  // 2. 找字段
  const filePart = parts.find((p) => p.name === 'file')
  const pkgIdPart = parts.find((p) => p.name === 'packageId')
  const versionPart = parts.find((p) => p.name === 'version')
  const md5Part = parts.find((p) => p.name === 'md5')

  if (!filePart || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file field' })
  }
  if (!pkgIdPart || !versionPart) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing packageId or version',
    })
  }

  const packageId = pkgIdPart.data.toString('utf-8').trim()
  const version = versionPart.data.toString('utf-8').trim()
  const clientMd5 = md5Part?.data.toString('utf-8').trim() || ''

  if (!packageId || !version) {
    throw createError({ statusCode: 400, statusMessage: 'Empty packageId or version' })
  }

  const fileBytes = filePart.data

  // 3. 校验 zip magic bytes (PK\003\004)
  if (fileBytes.length < 4) {
    throw createError({ statusCode: 400, statusMessage: 'File too small' })
  }
  const magic = [0x50, 0x4b, 0x03, 0x04]
  for (let i = 0; i < 4; i++) {
    if (fileBytes[i] !== magic[i]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Not a valid zip file (magic bytes mismatch)',
      })
    }
  }

  // 4. 计算 MD5(客户端传了则对比)
  const serverMd5 = createHash('md5').update(fileBytes).digest('hex')
  if (clientMd5 && clientMd5 !== serverMd5) {
    throw createError({
      statusCode: 400,
      statusMessage: `MD5 mismatch: client=${clientMd5} server=${serverMd5}`,
    })
  }

  // 5. 存文件
  const zipsDir = getZipsDir()
  if (!existsSync(zipsDir)) mkdirSync(zipsDir, { recursive: true })

  const filename = `${packageId}_${version}_${Date.now()}.zip`
  const filePath = join(zipsDir, filename)
  writeFileSync(filePath, fileBytes)

  // 6. 写库
  try {
    const row = insertPackage({
      package_id: packageId,
      version,
      filename,
      size: fileBytes.length,
      md5: serverMd5,
    })
    return {
      ok: true,
      id: row.id,
      packageId: row.package_id,
      version: row.version,
      filename: row.filename,
      size: row.size,
      md5: row.md5,
      url: `/api/packages/${row.id}/download`,
    }
  } catch (e: any) {
    // 失败清理文件
    try {
      rmSync(filePath, { force: true })
    } catch {}
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})

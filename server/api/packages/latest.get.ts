import { getLatest, listPackages, type PackageRow } from '~~/server/utils/db'

/**
 * GET /api/packages/latest
 * 每个 packageId 只返回最新一个版本(给 App 端拉取用)。
 */
export default defineEventHandler(() => {
  const all = listPackages()
  const byPkg = new Map<string, PackageRow>()
  for (const row of all) {
    if (!byPkg.has(row.package_id)) {
      byPkg.set(row.package_id, row)
    }
  }
  return { packages: Array.from(byPkg.values()) }
})

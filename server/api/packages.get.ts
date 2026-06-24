import { getStats, listPackages } from '~~/server/utils/db'

/**
 * GET /api/packages
 * Query:
 *   - packageId: 可选,按包 ID 过滤
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const packageId = query.packageId as string | undefined

  if (packageId) {
    return { packages: listPackages(packageId) }
  }
  return {
    packages: listPackages(),
    stats: getStats(),
  }
})

import { getStats } from '~~/server/utils/db'

/**
 * GET /api/packages/stats
 */
export default defineEventHandler(() => {
  return getStats()
})

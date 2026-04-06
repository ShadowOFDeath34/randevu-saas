/**
 * Performance Module Index
 * Tüm performans optimizasyon fonksiyonlarını export eder
 */

// Cache utilities
export {
  get,
  set,
  del,
  invalidateTag,
  clear,
  withCache,
  getCacheStats,
  generateCacheKey,
  CacheTags,
  CacheTTL,
} from './cache'

// Prisma optimizer
export {
  PrismaSelect,
  optimizedCount,
  optimizedFindMany,
  optimizedFindUnique,
  BatchLoader,
  logQueryPerformance,
  withTransaction,
  explainQuery,
} from './prisma-optimizer'

// Types
export type {
  CacheConfig,
} from './cache'

export type {
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
} from './prisma-optimizer'

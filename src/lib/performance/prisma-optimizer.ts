/**
 * Prisma Query Optimizer
 * Select, include stratejileri ve query optimizasyonu
 */

import { logStructured } from '@/lib/monitoring'
import { get, set, CacheTags, CacheTTL, generateCacheKey } from './cache'

export interface QueryOptions {
  useCache?: boolean
  cacheTTL?: number
  cacheTags?: string[]
}

export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Prisma select fields - sadece ihtiyaç duyulan alanları seç
 */
export const PrismaSelect = {
  // Tenant için minimal fields
  tenantMinimal: {
    id: true,
    name: true,
    slug: true,
    logo: true,
    isActive: true,
  },

  // Tenant için full fields
  tenantFull: {
    id: true,
    name: true,
    slug: true,
    logo: true,
    isActive: true,
    address: true,
    phone: true,
    email: true,
    website: true,
    createdAt: true,
    updatedAt: true,
  },

  // User için minimal fields
  userMinimal: {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
  },

  // User için full fields
  userFull: {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    phone: true,
    emailVerified: true,
    createdAt: true,
  },

  // Booking için minimal fields
  bookingMinimal: {
    id: true,
    status: true,
    startTime: true,
    endTime: true,
    customerName: true,
    customerPhone: true,
    serviceId: true,
    staffId: true,
  },

  // Booking için list view
  bookingList: {
    id: true,
    status: true,
    startTime: true,
    endTime: true,
    customerName: true,
    customerPhone: true,
    notes: true,
    service: {
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
      },
    },
    staff: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
  },

  // Service için minimal
  serviceMinimal: {
    id: true,
    name: true,
    duration: true,
    price: true,
    color: true,
    isActive: true,
  },

  // Staff için minimal
  staffMinimal: {
    id: true,
    name: true,
    email: true,
    phone: true,
    image: true,
    isActive: true,
  },

  // Customer için minimal
  customerMinimal: {
    id: true,
    name: true,
    email: true,
    phone: true,
    notes: true,
  },
} as const

/**
 * Optimize edilmiş count query
 */
export async function optimizedCount(
  model: any,
  where: Record<string, unknown> = {}
): Promise<number> {
  return model.count({ where })
}

/**
 * Optimize edilmiş findMany with pagination
 */
export async function optimizedFindMany<T>(
  model: any,
  args: {
    where?: Record<string, unknown>
    select?: Record<string, unknown>
    include?: Record<string, unknown>
    orderBy?: Record<string, string> | Record<string, string>[]
  },
  pagination: PaginationOptions = { page: 1, limit: 20 },
  options?: QueryOptions
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, pagination.page || 1)
  const limit = Math.min(100, Math.max(1, pagination.limit || 20))
  const skip = (page - 1) * limit

  // Cache key generation
  const cacheKey = options?.useCache
    ? generateCacheKey(
        'findmany',
        model.name,
        JSON.stringify(args.where),
        String(page),
        String(limit)
      )
    : null

  // Try cache
  if (cacheKey && options?.useCache) {
    const cached = await get<PaginatedResult<T>>(cacheKey)
    if (cached) return cached
  }

  // Parallel queries
  const [data, total] = await Promise.all([
    model.findMany({
      ...args,
      skip,
      take: limit,
    }),
    model.count({ where: args.where }),
  ])

  const result: PaginatedResult<T> = {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }

  // Cache result
  if (cacheKey && options?.useCache) {
    await set(cacheKey, result, {
      ttl: options.cacheTTL || CacheTTL.MEDIUM,
      tags: options.cacheTags || [CacheTags.TENANT],
    })
  }

  return result
}

/**
 * Optimize edilmiş findUnique with cache
 */
export async function optimizedFindUnique<T>(
  model: any,
  args: {
    where: Record<string, unknown>
    select?: Record<string, unknown>
    include?: Record<string, unknown>
  },
  options?: QueryOptions
): Promise<T | null> {
  const cacheKey = options?.useCache
    ? generateCacheKey('findunique', model.name, JSON.stringify(args.where))
    : null

  if (cacheKey && options?.useCache) {
    const cached = await get<T>(cacheKey)
    if (cached) return cached
  }

  const result = await model.findUnique(args)

  if (cacheKey && options?.useCache && result) {
    await set(cacheKey, result, {
      ttl: options.cacheTTL || CacheTTL.LONG,
      tags: options.cacheTags,
    })
  }

  return result
}

/**
 * Batch load helper (DataLoader pattern)
 */
export class BatchLoader<T> {
  private batch: Map<string, ((result: T | null) => void)[]> = new Map()
  private timeout: NodeJS.Timeout | null = null
  private loaderFn: (ids: string[]) => Promise<T[]>
  private idField: string

  constructor(loaderFn: (ids: string[]) => Promise<T[]>, idField: string = 'id') {
    this.loaderFn = loaderFn
    this.idField = idField
  }

  async load(id: string): Promise<T | null> {
    return new Promise((resolve) => {
      if (!this.batch.has(id)) {
        this.batch.set(id, [])
      }
      this.batch.get(id)!.push(resolve)

      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), 10) // 10ms batch window
      }
    })
  }

  private async flush(): Promise<void> {
    const currentBatch = new Map(this.batch)
    this.batch.clear()
    this.timeout = null

    const ids = Array.from(currentBatch.keys())

    try {
      const results = await this.loaderFn(ids)
      const resultMap = new Map(results.map(r => [(r as any)[this.idField], r]))

      for (const [id, resolvers] of currentBatch) {
        const result = resultMap.get(id) || null
        resolvers.forEach(resolve => resolve(result))
      }
    } catch (error) {
      logStructured('error', 'BatchLoader error', { error: (error as Error).message })
      for (const resolvers of currentBatch.values()) {
        resolvers.forEach(resolve => resolve(null))
      }
    }
  }
}

/**
 * Query performance logger
 */
export function logQueryPerformance(
  queryName: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  if (duration > 500) {
    logStructured('warn', 'Slow query detected', {
      query: queryName,
      duration: `${duration}ms`,
      ...metadata,
    })
  }
}

/**
 * Transaction helper with timeout
 */
export async function withTransaction<T>(
  prisma: any,
  fn: (tx: any) => Promise<T>,
  timeout = 30000
): Promise<T> {
  const start = Date.now()

  return prisma.$transaction(async (tx: any) => {
    const result = await fn(tx)

    const duration = Date.now() - start
    if (duration > timeout * 0.8) {
      logStructured('warn', 'Transaction near timeout', { duration, timeout })
    }

    return result
  }, {
    timeout,
  })
}

/**
 * Index usage helper (for development)
 */
export async function explainQuery(
  prisma: any,
  query: string
): Promise<unknown> {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  try {
    const result = await prisma.$queryRawUnsafe(`EXPLAIN ${query}`)
    return result
  } catch (error) {
    logStructured('error', 'Explain query failed', { error: (error as Error).message })
    return null
  }
}

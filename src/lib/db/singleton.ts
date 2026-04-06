/**
 * Prisma Singleton for Testing
 * Prevents multiple Prisma Client instances in test environment
 */

import { PrismaClient } from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'

const prismaClientSingleton = () => {
  return mockDeep<PrismaClient>()
}

type MockPrismaClient = DeepMockProxy<PrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: MockPrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

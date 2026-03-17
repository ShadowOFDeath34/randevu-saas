import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {} as Record<string, { status: string; responseTime?: number; error?: string }>
  }

  let allHealthy = true

  // Database check
  const dbStart = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    checks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart
    }
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    allHealthy = false
  }

  // Memory check
  const memUsage = process.memoryUsage()
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  checks.checks.memory = {
    status: memMB < 512 ? 'healthy' : 'warning',
    responseTime: memMB
  }

  if (memMB >= 512) {
    allHealthy = false
  }

  // Environment variables check
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  )

  if (missingEnvVars.length === 0) {
    checks.checks.environment = {
      status: 'healthy'
    }
  } else {
    checks.checks.environment = {
      status: 'unhealthy',
      error: 'Missing required environment variables'
    }
    allHealthy = false
  }

  const statusCode = allHealthy ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}

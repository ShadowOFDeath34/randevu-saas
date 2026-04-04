import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // En basit health check - hiçbir env var kullanma
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Health check working'
  }, { status: 200 })
}

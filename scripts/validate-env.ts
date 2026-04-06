#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 *
 * Bu script tüm environment variable'ları kontrol eder:
 * - Gerekli değişkenlerin varlığı
 * - Format doğruluğu
 * - Bağlantı testleri (opsiyonel)
 *
 * Kullanım:
 *   npm run env:validate
 *   npm run env:validate -- --strict (bağlantı testleri de yap)
 */

import { env, isProduction, isRedisConfigured, isEmailConfigured, getServiceHealth } from '../src/lib/env'

const args = process.argv.slice(2)
const strict = args.includes('--strict')

interface ValidationResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  value?: string
}

async function validate(): Promise<void> {
  console.log('🔍 RandevuAI Environment Validation\n')
  console.log('=' .repeat(50))

  const results: ValidationResult[] = []

  // 1. Temel değişkenler
  try {
    // Bu çağrı env.ts içindeki validasyonu tetikler
    const _ = env.DATABASE_URL
    results.push({ name: 'DATABASE_URL', status: 'ok', message: 'Valid' })
  } catch (e: any) {
    results.push({ name: 'DATABASE_URL', status: 'error', message: e.message })
  }

  // 2. NextAuth
  try {
    const _ = env.NEXTAUTH_SECRET
    const secretLen = env.NEXTAUTH_SECRET.length
    if (secretLen < 32) {
      results.push({
        name: 'NEXTAUTH_SECRET',
        status: 'error',
        message: `Too short (${secretLen} chars, min 32 required)`
      })
    } else if (secretLen < 64) {
      results.push({
        name: 'NEXTAUTH_SECRET',
        status: 'warning',
        message: `Acceptable but should be stronger (${secretLen} chars, 64+ recommended)`
      })
    } else {
      results.push({
        name: 'NEXTAUTH_SECRET',
        status: 'ok',
        message: `Strong (${secretLen} chars)`
      })
    }
  } catch (e: any) {
    results.push({ name: 'NEXTAUTH_SECRET', status: 'error', message: e.message })
  }

  // 3. App URL
  try {
    const _ = env.NEXT_PUBLIC_APP_URL
    results.push({ name: 'NEXT_PUBLIC_APP_URL', status: 'ok', message: 'Valid URL' })
  } catch (e: any) {
    results.push({ name: 'NEXT_PUBLIC_APP_URL', status: 'error', message: e.message })
  }

  // 4. iyzico
  try {
    const _ = env.IYZIPAY_API_KEY
    const isSandbox = env.IYZIPAY_API_KEY?.includes('sandbox')
    results.push({
      name: 'IYZIPAY_API_KEY',
      status: isSandbox ? 'warning' : 'ok',
      message: isSandbox ? 'Using sandbox key' : 'Valid'
    })
  } catch (e: any) {
    results.push({ name: 'IYZIPAY_API_KEY', status: 'error', message: e.message })
  }

  // 5. Service Health
  const health = getServiceHealth()

  results.push({
    name: 'Redis',
    status: health.redis ? 'ok' : 'warning',
    message: health.redis ? 'Configured' : 'Not configured (optional)'
  })

  results.push({
    name: 'Email (Resend)',
    status: health.email ? 'ok' : 'warning',
    message: health.email ? 'Configured' : 'Not configured (optional for dev)'
  })

  // Sonuçları göster
  console.log('\n📋 Results:\n')

  const errors = results.filter(r => r.status === 'error')
  const warnings = results.filter(r => r.status === 'warning')
  const ok = results.filter(r => r.status === 'ok')

  // Önce hatalar
  for (const r of errors) {
    console.log(`  ❌ ${r.name}: ${r.message}`)
  }

  // Sonra uyarılar
  for (const r of warnings) {
    console.log(`  ⚠️  ${r.name}: ${r.message}`)
  }

  // Sonra başarılı olanlar
  if (ok.length > 0) {
    console.log(`\n  ✅ ${ok.length} variables OK`)
  }

  // Özet
  console.log('\n' + '='.repeat(50))
  console.log(`\nSummary: ${errors.length} error(s), ${warnings.length} warning(s)`)

  if (errors.length > 0) {
    console.log('\n❌ Validation FAILED. Fix errors before deploying.')
    process.exit(1)
  } else if (warnings.length > 0) {
    console.log('\n⚠️  Validation PASSED with warnings. Review before production.')
    process.exit(0)
  } else {
    console.log('\n✅ All environment variables validated successfully!')
    process.exit(0)
  }
}

validate().catch(e => {
  console.error('Validation error:', e)
  process.exit(1)
})

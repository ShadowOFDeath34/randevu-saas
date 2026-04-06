/**
 * Deployment Verification Script
 * Production deployment sonrası doğrulama
 */

import { exit } from 'process'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: unknown
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function checkHealth(): Promise<CheckResult> {
  try {
    const response = await fetch(`${APP_URL}/api/health`)
    const data = await response.json()

    if (response.status === 200) {
      return {
        name: 'Health Check',
        status: 'pass',
        message: 'Application is healthy',
        details: data
      }
    } else {
      return {
        name: 'Health Check',
        status: 'fail',
        message: `Health check returned ${response.status}`,
        details: data
      }
    }
  } catch (error) {
    return {
      name: 'Health Check',
      status: 'fail',
      message: `Failed to reach health endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkAPI(): Promise<CheckResult> {
  try {
    const response = await fetch(`${APP_URL}/api/status`)

    if (response.status === 200 || response.status === 404) {
      return {
        name: 'API Routes',
        status: 'pass',
        message: 'API routes are accessible'
      }
    } else {
      return {
        name: 'API Routes',
        status: 'warn',
        message: `API returned unexpected status: ${response.status}`
      }
    }
  } catch (error) {
    return {
      name: 'API Routes',
      status: 'warn',
      message: `API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkSecurityHeaders(): Promise<CheckResult> {
  try {
    const response = await fetch(APP_URL)
    const headers = response.headers

    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ]

    const missingHeaders = requiredHeaders.filter(h => !headers.get(h))

    if (missingHeaders.length === 0) {
      return {
        name: 'Security Headers',
        status: 'pass',
        message: 'All security headers are present'
      }
    } else {
      return {
        name: 'Security Headers',
        status: 'warn',
        message: `Missing headers: ${missingHeaders.join(', ')}`
      }
    }
  } catch (error) {
    return {
      name: 'Security Headers',
      status: 'fail',
      message: `Failed to check headers: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkDatabase(): Promise<CheckResult> {
  try {
    const response = await fetch(`${APP_URL}/api/health`)
    const data = await response.json()

    if (data.checks?.database?.status === 'healthy') {
      return {
        name: 'Database Connection',
        status: 'pass',
        message: `Response time: ${data.checks.database.responseTime}ms`
      }
    } else {
      return {
        name: 'Database Connection',
        status: 'fail',
        message: 'Database is not healthy',
        details: data.checks?.database
      }
    }
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'fail',
      message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkBuildInfo(): Promise<CheckResult> {
  try {
    const response = await fetch(`${APP_URL}/api/health`)
    const data = await response.json()

    return {
      name: 'Build Info',
      status: 'pass',
      message: `Version: ${data.version}, Environment: ${data.environment}`
    }
  } catch (error) {
    return {
      name: 'Build Info',
      status: 'warn',
      message: 'Could not retrieve build info'
    }
  }
}

async function runChecks(): Promise<void> {
  console.log('🔍 Deployment Verification')
  console.log('========================\n')
  console.log(`Target: ${APP_URL}\n`)

  const checks: CheckResult[] = []

  // Run all checks
  checks.push(await checkHealth())
  checks.push(await checkAPI())
  checks.push(await checkSecurityHeaders())
  checks.push(await checkDatabase())
  checks.push(await checkBuildInfo())

  // Display results
  console.log('Results:')
  console.log('--------')

  let passCount = 0
  let failCount = 0
  let warnCount = 0

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'
    const status = check.status.toUpperCase().padEnd(6)
    console.log(`${icon} [${status}] ${check.name}: ${check.message}`)

    if (check.details) {
      console.log(`   Details:`, JSON.stringify(check.details, null, 2))
    }

    if (check.status === 'pass') passCount++
    else if (check.status === 'fail') failCount++
    else warnCount++
  }

  console.log('\n========================')
  console.log(`Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`)
  console.log('========================\n')

  if (failCount > 0) {
    console.log('❌ Deployment verification FAILED')
    console.log('Please fix the issues above before proceeding.')
    exit(1)
  } else if (warnCount > 0) {
    console.log('⚠️ Deployment verification PASSED with warnings')
    console.log('Review the warnings above.')
    exit(0)
  } else {
    console.log('✅ Deployment verification PASSED')
    console.log('All checks passed successfully!')
    exit(0)
  }
}

runChecks().catch(error => {
  console.error('Verification failed:', error)
  exit(1)
})

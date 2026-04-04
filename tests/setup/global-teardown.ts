import { db } from '@/lib/db'

/**
 * Global Teardown for E2E Tests
 * Cleans up test data after running tests
 */

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...')

  try {
    // Note: We keep the test user for subsequent test runs
    // Uncomment below if you want to delete the test user after tests
    /*
    await db.user.deleteMany({
      where: { email: 'test@example.com' }
    })
    console.log('✅ Test user deleted')
    */

    console.log('✅ Test environment cleanup complete!')
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error)
  } finally {
    await db.$disconnect()
  }
}

export default globalTeardown

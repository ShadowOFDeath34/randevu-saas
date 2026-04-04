import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * Global Setup for E2E Tests
 * Creates test user before running tests
 */

const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
}

async function globalSetup() {
  console.log('🔄 Setting up test environment...')

  try {
    // Check if test user already exists
    const existingUser = await db.user.findUnique({
      where: { email: TEST_USER.email },
    })

    if (existingUser) {
      console.log('✅ Test user already exists, updating password...')
      // Update password to ensure it's correct
      const passwordHash = await bcrypt.hash(TEST_USER.password, 10)
      await db.user.update({
        where: { email: TEST_USER.email },
        data: { passwordHash },
      })
    } else {
      console.log('📝 Creating test user...')
      // Create test user
      const passwordHash = await bcrypt.hash(TEST_USER.password, 10)
      await db.user.create({
        data: {
          email: TEST_USER.email,
          name: TEST_USER.name,
          passwordHash,
          role: 'admin',
          // Create associated tenant
          tenant: {
            create: {
              name: 'Test Business',
              slug: 'test-business',
            },
          },
        },
      })
    }

    console.log('✅ Test environment ready!')
    console.log(`   Email: ${TEST_USER.email}`)
    console.log(`   Password: ${TEST_USER.password}`)
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

export default globalSetup

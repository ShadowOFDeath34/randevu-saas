const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('Test user already exists:', existingUser.id)
      console.log('Email: test@example.com')
      console.log('Password: Test123!')
      process.exit(0)
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('Test123!', 10)

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        tenant: {
          create: {
            name: 'Test Business',
            slug: 'test-business',
            settings: {
              businessHours: {
                monday: { open: '09:00', close: '18:00' },
                tuesday: { open: '09:00', close: '18:00' },
                wednesday: { open: '09:00', close: '18:00' },
                thursday: { open: '09:00', close: '18:00' },
                friday: { open: '09:00', close: '18:00' },
                saturday: { open: '10:00', close: '14:00' },
                sunday: { open: '10:00', close: '14:00' }
              }
            }
          }
        },
        role: 'ADMIN'
      },
      include: {
        tenant: true
      }
    })

    console.log('Test user created successfully!')
    console.log('User ID:', user.id)
    console.log('Tenant ID:', user.tenantId)
    console.log('Email: test@example.com')
    console.log('Password: Test123!')
    console.log('Role: ADMIN')

  } catch (error) {
    console.error('Error creating test user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Test123!', 10)

    // Update test user with correct passwordHash field
    const user = await prisma.user.update({
      where: { email: 'test@example.com' },
      data: {
        passwordHash: hashedPassword,
        isActive: true
      }
    })

    console.log('Test user updated successfully!')
    console.log('Email: test@example.com')
    console.log('Password: Test123!')
    console.log('isActive:', user.isActive)

  } catch (error: unknown) {
    console.error('Error updating test user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixTestUser()

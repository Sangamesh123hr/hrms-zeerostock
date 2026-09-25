import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10)

  await prisma.user.upsert({
    where: { email: 'hr@zeerostock.com' },
    update: {
      password: hashedPassword,
      name: 'HR Lead',
      role: 'HR',
      department: 'Management',
      designation: 'HR Manager',
    },
    create: {
      email: 'hr@zeerostock.com',
      name: 'HR Lead',
      password: hashedPassword,
      role: 'HR',
      department: 'Management',
      designation: 'HR Manager',
    },
  })

  await prisma.user.upsert({
    where: { email: 'employee@zeerostock.com' },
    update: {
      password: hashedPassword,
      name: 'Sangamesh Ranjanagi',
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Full Stack Developer',
    },
    create: {
      email: 'employee@zeerostock.com',
      name: 'Sangamesh Ranjanagi',
      password: hashedPassword,
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Full Stack Developer',
    },
  })

  console.log('Demo login passwords reset successfully.')
}

main()
  .catch((error) => {
    console.error('Failed to reset demo passwords:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

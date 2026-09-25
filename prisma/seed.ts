import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10)

  // HR Account
  await prisma.user.upsert({
    where: { email: 'hr@zeerostock.com' },
    update: {},
    create: {
      email: 'hr@zeerostock.com',
      name: 'HR Lead',
      password: hashedPassword,
      role: 'HR',
      department: 'Management',
      designation: 'HR Manager',
    },
  })

  // Employee Account
  await prisma.user.upsert({
    where: { email: 'employee@zeerostock.com' },
    update: {},
    create: {
      email: 'employee@zeerostock.com',
      name: 'Sangamesh Ranjanagi',
      password: hashedPassword,
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Full Stack Developer',
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (role !== 'HR') {
    return NextResponse.json({ error: 'Forbidden: Access restricted to HR personnel only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const department = typeof body.department === 'string' ? body.department.trim() : 'Engineering'
    const requestedRole = body.role === 'HR' ? Role.HR : Role.EMPLOYEE

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department: department || 'Engineering',
        role: requestedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

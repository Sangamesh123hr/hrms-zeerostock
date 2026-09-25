import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type SessionUser = { role?: string }
type AuthSession = { user?: SessionUser }

function isHR(session: unknown) {
  return (session as AuthSession | null)?.user?.role === 'HR'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isHR(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const attendanceRecords = await prisma.attendance.findMany({
    include: { user: { select: { name: true, email: true, department: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(attendanceRecords)
}
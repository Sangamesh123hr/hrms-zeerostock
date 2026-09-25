import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type SessionUser = { id: string; role?: string }
type AuthSession = { user?: SessionUser }

function getUser(session: unknown) {
  return (session as AuthSession | null)?.user
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = getUser(session)

  if (!user || user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const leaves = await prisma.leave.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(leaves)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const user = getUser(session)

  if (!user || user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const startDate = body?.startDate
  const endDate = body?.endDate
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  const parsedStartDate = new Date(startDate)
  const parsedEndDate = new Date(endDate)

  if (
    !startDate ||
    !endDate ||
    !reason ||
    Number.isNaN(parsedStartDate.getTime()) ||
    Number.isNaN(parsedEndDate.getTime()) ||
    parsedStartDate > parsedEndDate
  ) {
    return NextResponse.json({ error: 'Invalid leave details' }, { status: 400 })
  }

  const leave = await prisma.leave.create({
    data: {
      userId: user.id,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      reason,
      status: 'PENDING',
    },
  })

  return NextResponse.json(leave)
}
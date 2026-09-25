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

  const leaves = await prisma.leave.findMany({
    include: { user: { select: { name: true, email: true, department: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(leaves)
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!isHR(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const leaveId = typeof body?.leaveId === 'string' ? body.leaveId : ''
  const status = body?.status

  if (!leaveId || !['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const updatedLeave = await prisma.leave.update({
    where: { id: leaveId },
    data: { status },
  })

  return NextResponse.json(updatedLeave)
}
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type SessionUser = { id: string; role?: string }
type AuthSession = { user?: SessionUser }

function getUser(session: unknown) {
  return (session as AuthSession | null)?.user
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = getUser(session)

  if (!user || user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const attendance = await prisma.attendance.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  const today = startOfToday()
  const todayRecord = attendance.find(
    (record) => new Date(record.date).getTime() === today.getTime(),
  )

  return NextResponse.json({ attendance, todayRecord })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const user = getUser(session)

  if (!user || user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const action = body?.action
  const today = startOfToday()

  const existingRecord = await prisma.attendance.findFirst({
    where: { userId: user.id, date: today },
  })

  if (action === 'CHECK_IN') {
    if (existingRecord) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 })
    }

    const record = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
      },
    })
    return NextResponse.json(record)
  }

  if (action === 'CHECK_OUT') {
    if (!existingRecord) {
      return NextResponse.json({ error: 'Must check in first' }, { status: 400 })
    }
    if (existingRecord.checkOut) {
      return NextResponse.json({ error: 'Already checked out today' }, { status: 400 })
    }

    const record = await prisma.attendance.update({
      where: { id: existingRecord.id },
      data: { checkOut: new Date() },
    })
    return NextResponse.json(record)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
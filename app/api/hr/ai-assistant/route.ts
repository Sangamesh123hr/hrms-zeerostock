import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getOpenRouterApiKey() {
  const runtimeKey = (process.env.OPENROUTER_API_KEY || '').replace(/["'\s\r\n]/g, '').trim()
  if (runtimeKey.startsWith('sk-or-v1-')) return runtimeKey

  try {
    const envFile = readFileSync(join(process.cwd(), '.env'), 'utf8')
    const envLine = envFile.split(/\r?\n/).find((line) => line.trim().startsWith('OPENROUTER_API_KEY='))
    return (envLine?.split('=', 2)[1] || '').replace(/["'\s\r\n]/g, '').trim()
  } catch {
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role

    if (!session || role !== 'HR') {
      return NextResponse.json(
        { error: 'Unauthorized. AI Assistant is strictly reserved for HR managers.' },
        { status: 403 },
      )
    }

    const apiKey = getOpenRouterApiKey()

    if (!apiKey || !apiKey.startsWith('sk-or-v1-')) {
      return NextResponse.json(
        { error: 'API key is missing or invalid in .env.' },
        { status: 401 },
      )
    }

    const body = await request.json() as {
      prompt?: string
      messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
    }
    const conversationHistory = Array.isArray(body.messages) && body.messages.length > 0
      ? body.messages
      : typeof body.prompt === 'string' && body.prompt.trim()
        ? [{ role: 'user' as const, content: body.prompt.trim() }]
        : []

    if (!conversationHistory.length) {
      return NextResponse.json({ error: 'Prompt or messages required' }, { status: 400 })
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const [employees, todayLeaves, todayAttendance] = await Promise.all([
      prisma.user.findMany({
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          designation: true,
          role: true,
        },
      }),
      prisma.leave.findMany({
        where: {
          startDate: { lte: endOfToday },
          endDate: { gte: startOfToday },
          status: 'APPROVED',
        },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.attendance.findMany({
        where: { date: { gte: startOfToday, lte: endOfToday } },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ])

    const context = {
      employees,
      leavesToday: todayLeaves.map((leave) => ({
        employeeName: leave.user.name,
        email: leave.user.email,
        reason: leave.reason,
        status: leave.status,
      })),
      attendanceToday: todayAttendance.map((attendance) => ({
        employeeName: attendance.user.name,
        email: attendance.user.email,
        status: attendance.status,
        checkIn: attendance.checkIn,
      })),
    }

    const systemMessage = {
      role: 'system' as const,
      content: `You are the Zeerostock HR Copilot with live HR database access for ${startOfToday.toISOString().split('T')[0]}.

DATABASE CONTEXT:
${JSON.stringify(context, null, 2)}

Answer employee and today's leave or attendance questions only from this context. If no matching record exists, say so clearly. Use prior conversation context for pronouns. Keep answers professional, concise, and accurate.`,
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Zeerostock HRMS',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        messages: [systemMessage, ...conversationHistory],
      }),
    })
    const completion = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (!response.ok) {
      console.error('OpenRouter Error:', completion)
      return NextResponse.json(
        { error: 'AI Error', details: completion.error?.message },
        { status: response.status },
      )
    }

    const reply = completion.choices?.[0]?.message?.content || 'No response generated.'
    return NextResponse.json({ reply, text: reply })
  } catch (error: unknown) {
    const errorObject = error && typeof error === 'object' ? error : undefined
    const status = errorObject && 'status' in errorObject && typeof errorObject.status === 'number' ? errorObject.status : 500
    const message = errorObject && 'message' in errorObject && typeof errorObject.message === 'string' ? errorObject.message : undefined

    console.error('OpenRouter HR AI Route Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process AI response',
        details: message,
      },
      { status },
    )
  }
}

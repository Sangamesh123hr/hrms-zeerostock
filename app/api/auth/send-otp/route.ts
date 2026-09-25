import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASS
const transporter = emailUser && emailPass
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    })
  : null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const otp = randomInt(100000, 1000000).toString()
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiresAt },
    })

    console.log(`LOGIN OTP for ${user.email}: ${otp}`)

    if (transporter) {
      await transporter.sendMail({
        from: `"Zeerostock HRMS" <${emailUser}>`,
        to: process.env.DEMO_RECEIVER_EMAIL || emailUser,
        subject: 'Your Zeerostock HRMS Login OTP',
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #fff; border-radius: 12px;">
            <h2 style="color: #3b82f6;">Zeerostock HRMS Security Code</h2>
            <p>Your one-time login verification code is:</p>
            <h1 style="font-size: 36px; letter-spacing: 4px; color: #60a5fa;">${otp}</h1>
            <p style="color: #94a3b8; font-size: 12px;">This code will expire in 5 minutes.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('Send OTP Error:', error)
    return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
  }
}

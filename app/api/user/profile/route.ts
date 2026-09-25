import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      phone: true,
      designation: true,
      dateOfJoining: true,
      image: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, phone, designation, image, currentPassword, newPassword } = body

    const currentUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (designation !== undefined) updateData.designation = designation
    if (image !== undefined) updateData.image = image

    if (newPassword && typeof newPassword === 'string' && newPassword.trim() !== '') {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 })
      }

      const isValid = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 })
      }

      updateData.password = await bcrypt.hash(newPassword.trim(), 10)
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

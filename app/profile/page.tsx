'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Camera, Key, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Sidebar } from '@/app/components/Sidebar'
import { ThemeToggle } from '@/app/components/ThemeToggle'

type Profile = {
  id: string
  name: string
  email: string
  role: string
  department?: string | null
  phone?: string | null
  designation?: string | null
  dateOfJoining: string
  image?: string | null
}

export default function ProfilePage() {
  const { update: updateSession } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [designation, setDesignation] = useState('')
  const [image, setImage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load profile')
      }

      setProfile(data)
      setName(data.name || '')
      setPhone(data.phone || '')
      setDesignation(data.designation || '')
      setImage(data.image || '')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load profile')
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProfile()
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: Record<string, string | undefined> = {
        name,
        phone,
        designation,
        image,
      }

      if (newPassword.trim() !== '') {
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      await updateSession({ image })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">
        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">My Profile</h1>
          <ThemeToggle />
        </div>

        <form onSubmit={handleSave} autoComplete="off" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
            <div className="relative group w-32 h-32">
              <Image
                src={image || '/default-avatar.svg'}
                alt="Profile"
                width={128}
                height={128}
                className="w-32 h-32 rounded-full object-cover border-2 border-blue-500 shadow-lg"
              />
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold text-white">{profile.name}</h2>
              <p className="text-xs text-slate-400">{profile.email}</p>
              <span className="inline-block mt-2 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300">
                {profile.role} • {profile.department || 'Engineering'}
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Personal & Professional Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Date of Joining</label>
                <input
                  type="text"
                  disabled
                  value={new Date(profile.dateOfJoining).toLocaleDateString()}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 pt-2">Change Password</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Current Password</label>
                <div className="relative mt-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 p-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">New Password</label>
                <div className="relative mt-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 p-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { LayoutDashboard, LogOut, ShieldCheck, User } from 'lucide-react'

type SidebarUser = {
  name?: string | null
  role?: string
  image?: string | null
}

export function Sidebar() {
  const { data: session } = useSession()
  const user = session?.user as SidebarUser | undefined
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const isHR = user?.role === 'HR'
  const dashboardPath = isHR ? '/hr/dashboard' : '/employee/dashboard'
  const avatarSrc = profileImage ?? user?.image ?? ''

  useEffect(() => {
    async function loadUserProfile() {
      if (!session?.user) return

      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const data = await res.json()
          if (data?.image) {
            setProfileImage(data.image)
          } else {
            setProfileImage(null)
          }
        }
      } catch (error) {
        console.error('Failed to load user photo in sidebar:', error)
      }
    }

    loadUserProfile()
  }, [session])

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between hidden md:flex border-r border-slate-800">
      <div className="space-y-6">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-wide text-lg">Zeerostock</h2>
            <p className="text-xs text-slate-400 font-medium">HRMS Enterprise</p>
          </div>
        </div>

        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex items-center space-x-3">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user?.name || 'User Profile'}
              className="w-10 h-10 rounded-full object-cover border border-blue-500/50 shadow"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300">
              {user?.role}
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          <Link
            href={dashboardPath}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white shadow-md shadow-blue-600/30"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </Link>
        </nav>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </aside>
  )
}

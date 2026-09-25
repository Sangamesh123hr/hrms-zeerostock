'use client'

import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { ThemeToggle } from './ThemeToggle'

type HeaderUser = {
  role?: string
  name?: string | null
  email?: string | null
  department?: string | null
  image?: string | null
}

export function Header({ title }: { title: string }) {
  const { data: session } = useSession()
  const user = session?.user as HeaderUser | undefined

  return (
    <header className="flex flex-col items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:bg-gray-800">
      <div className="flex items-center gap-3">
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User profile'}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-sm font-bold text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
        )}

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${user?.role === 'HR' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
              {user?.role || 'USER'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user?.name} ({user?.email}) <span aria-hidden="true">•</span>{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{user?.department || 'Engineering'}</span>
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-end sm:w-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}

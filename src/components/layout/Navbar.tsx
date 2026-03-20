'use client'

import Avatar from '@/components/ui/Avatar'
import { UserProfile } from '@/types'

interface NavbarProps {
  user?: UserProfile | null
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-gray-400 text-sm font-medium">
          {/* Page title rendered by children */}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <Avatar src={user.avatar_url} name={user.full_name ?? user.email} size="sm" />
            <span className="text-sm font-medium text-gray-700">
              {user.full_name ?? user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}

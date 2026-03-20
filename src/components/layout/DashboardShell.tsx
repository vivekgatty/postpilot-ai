import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { Profile } from '@/types'

interface DashboardShellProps {
  children: ReactNode
  user?: Profile | null
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <Navbar user={user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

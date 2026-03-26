import { Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth-store'
import { apiClient } from '@/api/client'

export function Layout() {
  const { user, logout, token } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await apiClient('users/sign_out', { method: 'DELETE', token })
    } catch {
      // Ignore logout errors
    }
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">TaskBoard</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/"
                className="flex items-center gap-2 transition-colors hover:text-foreground/80"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/projects"
                className="flex items-center gap-2 transition-colors hover:text-foreground/80"
              >
                <FolderKanban className="h-4 w-4" />
                Projects
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <span className="text-sm text-muted-foreground">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, ListTodo, CheckCircle2, Clock } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/lib/stores/auth-store'

interface DashboardStats {
  projects_count: number
  tasks_count: number
  pending_tasks_count: number
  completed_tasks_count: number
}

export function DashboardPage() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => apiClient<DashboardStats>('dashboard', { token }),
  })

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.projects_count ?? 0,
      icon: FolderKanban,
      description: 'Active projects',
    },
    {
      title: 'Total Tasks',
      value: stats?.tasks_count ?? 0,
      icon: ListTodo,
      description: 'All tasks',
    },
    {
      title: 'Pending',
      value: stats?.pending_tasks_count ?? 0,
      icon: Clock,
      description: 'Tasks waiting',
    },
    {
      title: 'Completed',
      value: stats?.completed_tasks_count ?? 0,
      icon: CheckCircle2,
      description: 'Tasks done',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your tasks and projects.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, ListTodo, CheckCircle2, Clock, TrendingUp, Activity, AlertCircle } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/lib/stores/auth-store'

interface DashboardStats {
  projects_count: number
  tasks_count: number
  pending_tasks_count: number
  in_progress_tasks_count: number
  completed_tasks_count: number
  overdue_tasks_count: number
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
      title: 'Proyectos',
      value: stats?.projects_count ?? 0,
      icon: FolderKanban,
      description: 'Proyectos activos',
      trend: '+12%',
      trendUp: true,
      color: 'primary',
    },
    {
      title: 'Tareas',
      value: stats?.tasks_count ?? 0,
      icon: ListTodo,
      description: 'Todas las tareas',
      trend: '+8%',
      trendUp: true,
      color: 'secondary',
    },
    {
      title: 'Pendientes',
      value: stats?.pending_tasks_count ?? 0,
      icon: Clock,
      description: 'Tareas esperando',
      trend: '-5%',
      trendUp: false,
      color: 'pending',
    },
    {
      title: 'En Progreso',
      value: stats?.in_progress_tasks_count ?? 0,
      icon: Activity,
      description: 'Tareas en progreso',
      trend: '+15%',
      trendUp: true,
      color: 'progress',
    },
    {
      title: 'Completadas',
      value: stats?.completed_tasks_count ?? 0,
      icon: CheckCircle2,
      description: 'Tareas realizadas',
      trend: '+23%',
      trendUp: true,
      color: 'done',
    },
    {
      title: 'Vencidas',
      value: stats?.overdue_tasks_count ?? 0,
      icon: AlertCircle,
      description: 'Requieren atención',
      trend: '',
      trendUp: false,
      color: 'overdue',
    },
  ]

  const getCardStyles = (color: string) => {
    const styles: Record<string, string> = {
      primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40',
      secondary: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-300',
      pending: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 hover:border-amber-300',
      progress: 'bg-gradient-to-br from-blue-50 to-indigo-100/50 border-indigo-200 hover:border-indigo-300',
      done: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 hover:border-emerald-300',
      overdue: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 hover:border-red-300',
    }
    return styles[color] || styles.primary
  }

  const getIconStyles = (color: string) => {
    const styles: Record<string, string> = {
      primary: 'text-primary bg-primary/10',
      secondary: 'text-blue-600 bg-blue-100',
      pending: 'text-amber-600 bg-amber-100',
      progress: 'text-indigo-600 bg-indigo-100',
      done: 'text-emerald-600 bg-emerald-100',
      overdue: 'text-red-600 bg-red-100',
    }
    return styles[color] || styles.primary
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bienvenido, {user?.first_name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Esto es lo que está pasando con tus proyectos hoy.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Última actualización: ahora mismo</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-28" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((card) => (
            <Card 
              key={card.title} 
              className={`relative overflow-hidden border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${getCardStyles(card.color)}`}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${getIconStyles(card.color)}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                </div>
                  <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${card.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {card.trendUp ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  <span>{card.trend}</span>
                  <span className="text-muted-foreground font-normal">vs semana anterior</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, UserPlus, X, Calendar, User, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/lib/stores/auth-store'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
}

interface Task {
  id: number
  title: string
  status: 'pending' | 'in_progress' | 'done' | 'overdue'
  due_date: string | null
  project_id: number
  user_id: number
  user?: User
  created_at: string
}

interface Project {
  id: number
  name: string
  users: User[]
  owner?: User
}

export function TasksPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [isCreating, setIsCreating] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string>('')
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const token = useAuthStore((state) => state.token)
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => apiClient<Project>(`projects/${projectId}`, { token }),
    enabled: !!projectId,
  })

  const isOwner = project?.owner?.id === currentUser?.id

  const { data: searchResults } = useQuery<User[]>({
    queryKey: ['users-search', searchQuery],
    queryFn: () => apiClient<User[]>(`users/search?q=${encodeURIComponent(searchQuery)}`, { token }),
    enabled: searchQuery.length >= 2,
  })

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => apiClient<Task[]>(`projects/${projectId}/tasks`, { token }),
    enabled: !!projectId,
  })

  const createMutation = useMutation({
    mutationFn: (data: { title: string; due_date?: string; user_id?: string }) =>
      apiClient<Task>(`projects/${projectId}/tasks`, {
        method: 'POST',
        body: { task: data },
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      setIsCreating(false)
      setNewTaskTitle('')
      setNewTaskDueDate('')
      setNewTaskAssignedTo('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ taskId, status, userId }: { taskId: number; status?: string; userId?: string }) =>
      apiClient<Task>(`projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: { task: { ...(status && { status }), ...(userId !== undefined && { user_id: userId || null }) } },
        token,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['tasks', projectId], (old: Task[] | undefined) => {
        if (!old) return old
        return old.map(t => t.id === data.id ? { ...t, ...data } : t)
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['project'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title: newTaskTitle,
      due_date: newTaskDueDate || undefined,
      user_id: newTaskAssignedTo || undefined,
    })
  }

  const addMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      apiClient<User>(`projects/${projectId}/add_member`, {
        method: 'POST',
        body: { user_id: userId },
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['project'] })
      setSearchQuery('')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      apiClient<void>(`projects/${projectId}/remove_member/${userId}`, {
        method: 'DELETE',
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['project'] })
    },
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusStyles = (status: string) => {
    const styles: Record<string, { bg: string, text: string, icon: React.ReactNode, label: string }> = {
      pending: { 
        bg: 'bg-amber-50 border-amber-200', 
        text: 'text-amber-700', 
        icon: <Circle className="h-3.5 w-3.5" />,
        label: 'Pendiente'
      },
      in_progress: { 
        bg: 'bg-blue-50 border-blue-200', 
        text: 'text-blue-700', 
        icon: <Clock className="h-3.5 w-3.5" />,
        label: 'En Progreso'
      },
      done: { 
        bg: 'bg-emerald-50 border-emerald-200', 
        text: 'text-emerald-700', 
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        label: 'Completada'
      },
      overdue: { 
        bg: 'bg-red-50 border-red-200', 
        text: 'text-red-700', 
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        label: 'Vencida'
      },
    }
    return styles[status] || styles.pending
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link to="/projects">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {project?.name || 'Tasks'}
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona las tareas de tu proyecto</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
          {isOwner && (
            <Button variant="outline" onClick={() => setShowMembersModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Miembros
            </Button>
          )}
        </div>
      </div>

      {isCreating && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
            <CardTitle className="text-lg">Crear Nueva Tarea</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Tarea</Label>
                <Input
                  id="title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Implementar característica X"
                  className="bg-background"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha Límite</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Asignar a</Label>
                  <select
                    id="assignedTo"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newTaskAssignedTo}
                    onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {project?.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear Tarea'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => {
            const statusStyle = getStatusStyles(task.status)
            return (
              <Card 
                key={task.id} 
                className={`border-l-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${statusStyle.bg.replace('bg-', 'border-').replace('50', '400')}`}
              >
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${statusStyle.bg}`}>
                      {statusStyle.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{task.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(task.due_date)}
                          </span>
                        )}
                        {task.status === 'pending' ? (
                          <select
                            className="text-xs border rounded px-2 py-1 bg-background"
                            value={task.user_id || ""}
                            onChange={(e) =>
                              updateMutation.mutate({
                                taskId: task.id,
                                userId: e.target.value,
                              })
                            }
                            disabled={updateMutation.isPending}
                          >
                  <option value="">Sin asignar</option>
                            {project?.users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.first_name} {user.last_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.user ? `${task.user.first_name} ${task.user.last_name}` : 'Unassigned'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {task.status === 'overdue' ? (
                    <span className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg">
                      Vencida
                    </span>
                  ) : task.status === 'done' ? (
                    <span className="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg">
                      Completada
                    </span>
                  ) : (
                    <select
                      className="sm:w-36 border rounded-lg px-3 py-2 text-sm bg-background font-medium"
                      value={task.status}
                      onChange={(e) =>
                        updateMutation.mutate({
                          taskId: task.id,
                          status: e.target.value,
                        })
                      }
                      disabled={updateMutation.isPending}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="done">Completada</option>
                    </select>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Sin tareas aún</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-sm">
              Crea tu primera tarea para comenzar a dar seguimiento al progreso de tu proyecto.
            </p>
            <Button onClick={() => setIsCreating(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Crear Tarea
            </Button>
          </CardContent>
        </Card>
      )}

      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle>Miembros del Proyecto</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMembersModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-4 space-y-4">
              {isOwner && (
                <div className="space-y-2">
                  <Label>Agregar Miembros</Label>
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-background"
                  />
                  {searchQuery.length >= 2 && searchResults && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => addMemberMutation.mutate(user.id)}
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {searchResults.length === 0 && (
                        <p className="p-3 text-sm text-muted-foreground text-center">No se encontraron usuarios</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Miembros Actuales</h4>
                {project?.users && project.users.length > 0 ? (
                  project.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {user.first_name} {user.last_name}
                            {user.id === project.owner?.id && (
                              <span className="ml-2 text-xs text-primary font-medium">(Propietario)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {isOwner && user.id !== project.owner?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMemberMutation.mutate(user.id)}
                          disabled={removeMemberMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No members</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

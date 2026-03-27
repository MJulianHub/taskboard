import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Task {
  id: number
  title: string
  status: 'pending' | 'in_progress' | 'done'
  due_date: string | null
  project_id: number
  user_id: number
  created_at: string
}

interface Project {
  id: number
  name: string
}

export function TasksPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [isCreating, setIsCreating] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => apiClient<Project>(`projects/${projectId}`, { token }),
    enabled: !!projectId,
  })

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => apiClient<Task[]>(`projects/${projectId}/tasks`, { token }),
    enabled: !!projectId,
  })

  const createMutation = useMutation({
    mutationFn: (data: { title: string; due_date?: string }) =>
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
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: string }) =>
      apiClient<Task>(`projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: { task: { status } },
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title: newTaskTitle,
      due_date: newTaskDueDate || undefined,
    })
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  }

  const statusLabels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    done: 'Done',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {project?.name || 'Tasks'}
          </h1>
          <p className="text-muted-foreground">Manage your project tasks</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Implement feature X"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </span>
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.due_date && (
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={task.status}
                  onChange={(e) =>
                    updateMutation.mutate({
                      taskId: task.id,
                      status: e.target.value,
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tasks yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

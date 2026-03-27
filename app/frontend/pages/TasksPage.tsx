import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, UserPlus, X } from 'lucide-react'
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
  status: 'pending' | 'in_progress' | 'done'
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
        {isOwner && (
          <Button variant="outline" onClick={() => setShowMembersModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Members
          </Button>
        )}
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
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign to</Label>
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
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      {task.due_date && (
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {task.status === 'pending' ? (
                      <select
                        className="border rounded px-2 py-1 text-sm mt-1"
                        value={task.user_id || ""}
                        onChange={(e) =>
                          updateMutation.mutate({
                            taskId: task.id,
                            userId: e.target.value,
                          })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <option value="">Unassigned</option>
                        {project?.users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm mt-1 text-blue-600">
                        {task.user ? `Assigned to: ${task.user.first_name} ${task.user.last_name}` : 'Unassigned'}
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

      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Members</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMembersModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwner && (
                <div className="space-y-2">
                  <Label>Add Members</Label>
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery.length >= 2 && searchResults && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                          onClick={() => addMemberMutation.mutate(user.id)}
                        >
                          <div>
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {searchResults.length === 0 && (
                        <p className="p-2 text-sm text-muted-foreground">No users found</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Current Members</h4>
                {project?.users && project.users.length > 0 ? (
                  project.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                          {user.id === project.owner?.id && <span className="ml-2 text-xs text-muted-foreground">(Owner)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {isOwner && user.id !== project.owner?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMemberMutation.mutate(user.id)}
                          disabled={removeMemberMutation.isPending}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No members</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

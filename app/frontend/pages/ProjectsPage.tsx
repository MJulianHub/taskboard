import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, FolderKanban } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Project {
  id: number
  name: string
  description: string | null
  created_at: string
  tasks_count: number
}

export function ProjectsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient<Project[]>('projects', { token }),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      apiClient<Project>('projects', {
        method: 'POST',
        body: { project: data },
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsCreating(false)
      setNewProjectName('')
      setNewProjectDescription('')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      name: newProjectName,
      description: newProjectDescription,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your projects</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Project description..."
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24" />
            </Card>
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}/tasks`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <FolderKanban className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {project.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {project.tasks_count} task{project.tasks_count !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="text-sm text-muted-foreground">
              Create your first project to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

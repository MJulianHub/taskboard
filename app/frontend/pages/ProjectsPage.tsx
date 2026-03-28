import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, FolderKanban, Calendar, User, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/lib/stores/auth-store'

interface User {
  id: number
  first_name: string
  last_name: string
}

interface Project {
  id: number
  name: string
  description: string | null
  created_at: string
  tasks_count: number
  owner?: User
}

export function ProjectsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient<Project[]>('projects', { token }),
  })

  const filteredProjects = projects?.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.owner?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.owner?.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground mt-1">Gestiona y seguimiento tus proyectos</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {searchQuery && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/10">
          <span className="text-sm text-muted-foreground">
            Mostrando resultados para "<span className="font-medium text-foreground">{searchQuery}</span>"
          </span>
          <Link to="/projects" className="text-sm text-primary hover:underline">
            Limpiar búsqueda
          </Link>
        </div>
      )}

      {isCreating && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="text-lg">Crear Nuevo Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proyecto</Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Mi Increíble Proyecto"
                  className="bg-background"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Descripción del proyecto..."
                  className="bg-background"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear Proyecto'}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32" />
            </Card>
          ))}
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}/tasks`} className="group">
              <Card className="h-full bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {project.tasks_count} {project.tasks_count === 1 ? 'tarea' : 'tareas'}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                    {project.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>Propietario: {project.owner?.first_name} {project.owner?.last_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : searchQuery ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Sin resultados</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-sm">
              No hay proyectos que coincidan con "{searchQuery}". Intenta con otro término de búsqueda.
            </p>
            <Link to="/projects">
              <Button variant="outline" className="mt-4">
                Limpiar búsqueda
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <FolderKanban className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Sin proyectos aún</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-sm">
              Crea tu primer proyecto para comenzar a organizar tus tareas y colaborar con tu equipo.
            </p>
            <Button onClick={() => setIsCreating(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Crear Proyecto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/auth-store'
import { apiClient } from '@/services/client'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await apiClient<{ user: { id: number; email: string; first_name: string; last_name: string }; token: string }>(
        'users/sign_in',
        {
          method: 'POST',
          body: { user: { email, password } },
        }
      )

      setAuth(response.user, response.token)
      navigate('/')
    } catch (err) {
      setError('Correo electrónico o contraseña incorrectos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="h-14 w-14">
              <rect width="32" height="32" rx="6" fill="#6366f1"/>
              <rect x="6" y="8" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="18" y="8" width="8" height="8" rx="1.5" fill="white" opacity="0.7"/>
              <rect x="6" y="18" width="8" height="8" rx="1.5" fill="white" opacity="0.7"/>
              <rect x="18" y="18" width="8" height="8" rx="1.5" fill="white" opacity="0.5"/>
              <circle cx="9" cy="11" r="1.5" fill="#6366f1"/>
              <circle cx="21" cy="11" r="1.5" fill="#6366f1"/>
              <line x1="8" y1="22" x2="12" y2="22" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="24" x2="11" y2="24" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M20 21 L24 21 M20 24 L23 24" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Bienvenido a TaskBoard</h1>
          <p className="text-muted-foreground mt-2">Inicia sesión para continuar a tu espacio de trabajo</p>
        </div>

        <Card className="border-2 shadow-xl shadow-primary/5">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-background"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-background"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Regístrate
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad
        </p>
      </div>
    </div>
  )
}

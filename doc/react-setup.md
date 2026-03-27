# Setup React Frontend con Tailwind y shadcn/ui

## Fecha de Implementación

26 de Marzo 2026

## Resumen

Se implementó un frontend React integrado en el mismo repositorio que Rails (monolito). Se usa **Vite** como bundler con **jsbundling-rails** para integración con Rails.

## Arquitectura

```
taskboard/
├── app/
│   ├── frontend/           # React frontend
│   │   ├── components/
│   │   │   ├── ui/        # Componentes shadcn/ui
│   │   │   ├── layout/    # Layout principal
│   │   │   └── ...
│   │   ├── pages/         # Páginas principales
│   │   ├── api/           # Cliente API
│   │   ├── lib/           # Utilidades y stores
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── controllers/
│   │   ├── dashboard_controller.rb
│   │   ├── projects_controller.rb
│   │   ├── tasks_controller.rb
│   │   └── users/
│   │       ├── sessions_controller.rb
│   │       └── registrations_controller.rb
│   ├── models/
│   │   ├── user.rb
│   │   ├── project.rb
│   │   ├── task.rb
│   │   └── project_membership.rb
│   └── views/
│       └── dashboard/
├── config/
│   ├── initializers/
│   │   ├── cors.rb
│   │   ├── devise.rb
│   │   └── vite.rb
├── db/
│   └── migrate/
│       └── *_remove_user_id_from_projects.rb
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

## URLs de Desarrollo

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Rails) | 3000 | http://localhost:3000 |

## Cómo Ejecutar

```bash
# Terminal 1: Iniciar Rails backend
bin/rails server -p 3000

# Terminal 2: Iniciar Vite frontend
npm run dev
```

## Tecnologías Utilizadas

### Frontend
- **React 18** + TypeScript
- **Vite** - Bundler
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes base
- **TanStack Query** (React Query) - Data fetching
- **React Router** - Navegación
- **Zustand** - State management

### UI Components (shadcn/ui)
- Button
- Input
- Label
- Card

### Radix UI (base para shadcn)
- @radix-ui/react-slot
- @radix-ui/react-label
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-select
- @radix-ui/react-tabs

## Cambios en Backend

### 1. Gemas Agregadas (Gemfile)

```ruby
gem "rack-cors"
gem "jsbundling-rails"
gem "propshaft"
gem "jwt"
gem "devise-jwt"
```

### 2. CORS Configurado (config/initializers/cors.rb)

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "*"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"]
  end
end
```

### 3. Rutas (config/routes.rb)

```ruby
Rails.application.routes.draw do
  devise_for :users, controllers: { sessions: "users/sessions", registrations: "users/registrations" }

  resources :projects do
    resources :tasks, only: [ :index, :create, :update ]
  end

  get "dashboard", to: "dashboard#index"
  root "dashboard#index"
end
```

### 4. Controladores API

#### Sessions Controller (`app/controllers/users/sessions_controller.rb`)
```ruby
class Users::SessionsController < Devise::SessionsController
  respond_to :json

  def create
    self.resource = warden.authenticate!(auth_options)
    render json: {
      user: {
        id: current_user.id,
        email: current_user.email,
        first_name: current_user.first_name,
        last_name: current_user.last_name
      },
      token: current_user.token
    }
  end
end
```

#### Registrations Controller (`app/controllers/users/registrations_controller.rb`)
```ruby
class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(current_user, _opts = {})
    if current_user.persisted?
      render json: {
        user: {
          id: current_user.id,
          email: current_user.email,
          first_name: current_user.first_name,
          last_name: current_user.last_name
        },
        token: current_user.token
      }
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
```

#### Dashboard Controller (`app/controllers/dashboard_controller.rb`)
```ruby
class DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    render json: {
      projects_count: current_user.projects.count,
      tasks_count: current_user.tasks.count,
      pending_tasks_count: current_user.tasks.where(status: 'pending').count,
      completed_tasks_count: current_user.tasks.where(status: 'completed').count
    }
  end
end
```

### 5. Autenticación JWT (`app/controllers/concerns/jwt_authenticatable.rb`)

```ruby
module JwtAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_with_jwt, if: -> { json_request? }
  end

  private

  def json_request?
    request.format.json? || request.headers["Accept"]&.include?("application/json")
  end

  def authenticate_with_jwt
    token = extract_jwt_token
    return if performed? || token.blank?

    user = User.from_jwt_token(token)
    if user
      sign_in user, event: :authentication
      @current_user = user
    else
      render_unauthorized
    end
  end

  def extract_jwt_token
    header = request.headers["Authorization"]
    header.split(" ").last if header&.starts_with?("Bearer ")
  end
end
```

### 6. Modelo User con JWT (`app/models/user.rb`)

```ruby
class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :project_memberships
  has_many :projects, through: :project_memberships
  has_many :tasks

  validates :first_name, :last_name, presence: true

  def jwt_secret_key
    Rails.application.credentials.devise_jwt_secret_key || ENV["DEVISE_JWT_SECRET_KEY"] || "fallback_secret_key_for_development_only"
  end

  def token
    JWT.encode({ user_id: id, exp: 1.day.from_now.to_i }, jwt_secret_key)
  end

  def self.from_jwt_token(token)
    return nil if token.blank?
    secret = Rails.application.credentials.devise_jwt_secret_key || ENV["DEVISE_JWT_SECRET_KEY"] || "fallback_secret_key_for_development_only"
    decoded = JWT.decode(token, secret, true, { algorithm: "HS256" }).first
    user_id = decoded["user_id"]
    find_by(id: user_id)
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end
end
```

### 7. Configuración Devise JWT (`config/initializers/devise.rb`)

```ruby
jwt_secret = Rails.application.credentials.devise_jwt_secret_key || ENV["DEVISE_JWT_SECRET_KEY"] || "fallback_secret_key_for_development_only"
config.jwt do |jwt|
  jwt.secret = jwt_secret
  jwt.dispatch_requests = [["POST", %r{^/users/sign_in$}]]
  jwt.revocation_requests = [["DELETE", %r{^/users/sign_out$}]]
  jwt.expiration_time = 1.day.to_i
end
```

### 8. Vite Proxy (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './app/frontend') } },
  root: 'app/frontend',
  server: {
    port: 5173,
    proxy: {
      '/users': { target: 'http://localhost:3000', changeOrigin: true },
      '/dashboard': { target: 'http://localhost:3000', changeOrigin: true },
      '/projects': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
```

### 9. API Client (`app/frontend/api/client.ts`)

```typescript
export async function apiClient<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  // ...
}
```

### 10. Migración de Base de Datos

Se eliminó la columna directa `user_id` de projects para usar la tabla intermedia:

```ruby
# db/migrate/2026032618000_remove_user_id_from_projects.rb
class RemoveUserIdFromProjects < ActiveRecord::Migration[8.1]
  def change
    remove_column :projects, :user_id, :integer
  end
end
```

## Estructura de Páginas

### LoginPage (`/login`)
- Formulario de inicio de sesión
- Integración con store de autenticación
- Redirección a Dashboard al autenticarse

### RegisterPage (`/register`)
- Formulario de registro con nombre y apellido
- Creación de cuenta vía API

### DashboardPage (`/`)
- Estadísticas generales
- Cards con contadores de proyectos, tareas, etc.

### ProjectsPage (`/projects`)
- Lista de proyectos
- Creación de nuevos proyectos
- Navegación a tareas del proyecto

### TasksPage (`/projects/:projectId/tasks`)
- Lista de tareas del proyecto
- Cambio de estado de tareas (pending/in_progress/done)
- Creación de nuevas tareas

## Autenticación en Frontend

### Auth Store (Zustand + persist)

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}
```

## Flujo de Autenticación

1. Usuario ingresa credenciales en `/login`
2. `apiClient` hace POST a `/users/sign_in`
3. Vite proxy reenva la petición a Rails
4. Backend retorna `{ user, token }`
5. Store guarda en localStorage via Zustand persist
6. Token se adjunta en headers de futuras peticiones
7. Rutas protegidas verifican `isAuthenticated`

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/users/sign_in` | POST | Login |
| `/users` | POST | Registro |
| `/dashboard` | GET | Estadísticas del usuario |
| `/projects` | GET | Listar proyectos |
| `/projects` | POST | Crear proyecto |
| `/projects/:id/tasks` | GET | Listar tareas |
| `/projects/:id/tasks` | POST | Crear tarea |

## Resolución de Errores

### Error 1: Vite parse error
- **Problema**: `index.html` usaba sintaxis ERB (`<%= %>`) pero Vite parsea HTML plano
- **Solución**: Convertir a HTML plano

### Error 2: 302 redirect en login
- **Problema**: Devise retornaba redirect HTML en lugar de JSON
- **Solución**: Agregar header `Accept: application/json` en frontend y modificar controlador

### Error 3: 401 Unauthorized
- **Problema**: Tokens JWT no se podían validar (diferentes claves secretas)
- **Solución**: Agregar fallback consistente de clave secreta en todos los archivos

### Error 4: NOT NULL constraint failed
- **Problema**: Tabla projects tenía user_id directo pero UI usaba project_memberships
- **Solución**: Migración para eliminar user_id de projects

## Testing

```bash
# Login
curl -X POST http://localhost:3000/users/sign_in \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"user":{"email":"test@test.com","password":"password"}}'

# Dashboard (con token)
curl http://localhost:3000/dashboard \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build
```

## Notas

- CORS está configurado con `origins "*"` para desarrollo. En producción, restringir a dominios específicos.
- El token JWT se guarda en localStorage. Considerar usar httpOnly cookies para mayor seguridad.
- Propshaft se usa como asset pipeline alternativo a Sprockets.
- La relación usuario-proyecto es muchos-a-muchos via tabla `project_memberships`.

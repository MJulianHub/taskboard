# Fix Bugs - Rama de Corrección de Errores

## Objetivo
Esta rama se creó para corregir errores encontrados en la aplicación TaskBoard y agregar funcionalidades faltantes relacionadas con la gestión de proyectos, tareas y miembros.

---

## Problemas Identificados y Soluciones

### 1. Error 404 al obtener detalles de un proyecto
**Problema:** Al entrar en la vista de tareas de un proyecto, se obtenía un error 404 porque no existía la ruta `GET /projects/:id` ni el método `show` en el controlador.

**Solución:**
- Agregada ruta `show` en `config/routes.rb`
- Agregado método `show` en `ProjectsController` con los datos del proyecto y sus miembros

### 2. Dashboard con estadísticas incorrectas
**Problema:** El dashboard no mostraba correctamente las tareas pendientes, en progreso y completadas. El enum de Task usaba `done` pero el controlador buscaba `completed`.

**Solución:**
- Corregido el controlador para usar el status correcto (`done` en lugar de `completed`)
- Agregado contador de tareas `in_progress`
- Actualizado el frontend para mostrar 5 cards (Projects, Total Tasks, Pending, In Progress, Completed)

### 3. Falta de gestión de miembros en proyectos
**Problema:** No existía forma de agregar o remover usuarios de un proyecto desde el frontend.

**Solución:**
- Creado `UsersController` con endpoint de búsqueda (`GET /users/search?q=query`)
- Agregados endpoints en `ProjectsController`:
  - `POST /projects/:id/add_member` - Agregar miembro
  - `DELETE /projects/:id/remove_member/:user_id` - Remover miembro
- Actualizado el frontend con modal de gestión de miembros en `TasksPage`

### 4. Falta propietario (owner) del proyecto
**Problema:** No se registraba quién creaba el proyecto.

**Solución:**
- Migration para agregar `owner_id` a la tabla projects
- Actualizado modelo `Project` con `belongs_to :owner`
- Al crear un proyecto, se asigna el usuario actual como owner
- El frontend muestra el nombre del owner en la lista de proyectos

### 5. Tareas sin asignar por defecto
**Problema:** Al crear una tarea sin asignar, se asignaba automáticamente al usuario actual.

**Solución:**
- Modificado `TasksController` para permitir `user_id` nulo
- Frontend permite crear tareas sin asignar (queda como `nil`)

### 6. Reasignar tareas en cualquier estado
**Problema:** No se podían reasignar tareas una vez creadas.

**Solución:**
- Actualizado `updateMutation` para permitir cambiar `user_id`
- Selector de asignación visible solo en tareas con estado `pending`

### 7. Permisos de owner para gestión de miembros
**Problema:** Cualquier usuario podía agregar o eliminar miembros.

**Solución:**
- Backend: Solo el owner puede agregar/remover miembros
- Frontend: Botón de Members solo visible para el owner
- No se puede eliminar al owner del proyecto

### 8. Errores de cache en React Query
**Problema:** Los cambios no se reflejaban hasta recargar la página.

**Solución:**
- Invalidación correcta de queries después de mutaciones
- Actualización optimista del cache
- Limpieza del cache al hacer logout

### 9. Error 500 al cerrar sesión
**Problema:** El logout intentaba hacer una petición DELETE al servidor que fallaba.

**Solución:**
- Eliminado la llamada al servidor en logout
- Solo limpia el estado local y el cache de React Query

### 10. Uso de Jbuilder para respuestas JSON
**Problema:** El método `show` usaba `render json:` directamente en lugar de jbuilder.

**Solución:**
- Creado `app/views/projects/show.json.jbuilder` con la estructura JSON
- Actualizado método `show` en `ProjectsController` para usar `respond_to`
- Actualizado `index.json.jbuilder` para mantener consistencia

### 11. Scope de búsqueda en modelo User
**Problema:** La lógica de búsqueda de usuarios estaba en el controlador.

**Solución:**
- Agregado scope `search` en el modelo `User`
- Actualizado `UsersController` para usar el scope

---

## Archivos Modificados

### Backend
- `app/controllers/projects_controller.rb` - Métodos show, add_member, remove_member, permisos de owner
- `app/controllers/tasks_controller.rb` - Soporte para user_id nulo, actualización de assignee
- `app/controllers/users_controller.rb` - Búsqueda de usuarios usando scope
- `app/controllers/dashboard_controller.rb` - Estadísticas correctas
- `app/models/project.rb` - Asociación con owner
- `app/models/user.rb` - Scope de búsqueda
- `config/routes.rb` - Rutas para members y users/search
- `app/views/projects/show.json.jbuilder` - Nuevo archivo para renderizar JSON
- `app/views/projects/index.json.jbuilder` - Actualizado para usar jbuilder

### Frontend
- `app/frontend/pages/TasksPage.tsx` - Modal de miembros, selector de assignee, permisos de owner
- `app/frontend/pages/ProjectsPage.tsx` - Mostrar owner del proyecto
- `app/frontend/pages/DashboardPage.tsx` - 5 cards de estadísticas
- `app/frontend/pages/LoginPage.tsx` - Redirect si ya está autenticado
- `app/frontend/components/layout/Layout.tsx` - Logout sin llamada al servidor
- `app/frontend/main.tsx` - Exportar queryClient

### Base de Datos
- `db/migrate/20260327164249_add_owner_to_projects.rb` - Nueva migración para owner_id
- `db/schema.rb` - Actualizado con owner_id

---

## Funcionalidades Implementadas

1. **Ver proyectos** con owner y cantidad de tareas
2. **Crear proyectos** con el usuario actual como owner
3. **Gestión de miembros** (solo owner puede agregar/eliminar)
4. **Búsqueda de usuarios** para agregar como miembros (usando scope)
5. **Crear tareas** sin asignar o asignadas a un miembro
6. **Cambiar assignee** de tareas en estado pending
7. **Estados de tareas:** Pending, In Progress, Done
8. **Dashboard** con estadísticas actualizadas
9. **Logout** correcto sin errores
10. **Respuestas JSON** usando Jbuilder

---

## Cómo Probar

1. Crear un proyecto (el usuario actual será owner)
2. Agregar miembros desde el botón "Members" dentro del proyecto
3. Crear tareas asignadas o sin asignar
4. Cambiar estado de tareas
5. Verificar que solo el owner puede gestionar miembros
6. Cerrar sesión y verificar que los datos se limpian

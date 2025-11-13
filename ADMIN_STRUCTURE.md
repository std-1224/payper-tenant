# Payper Superadmin - Estructura del Panel

## 📋 Descripción General

Panel de administración multitenant para gestionar clientes, módulos y usuarios del ecosistema Payper.

## 🏗️ Arquitectura

### Autenticación (`src/hooks/useAuth.tsx`)

- **AuthProvider**: Contexto global de autenticación
- **useAuth()**: Hook para acceder al estado de auth
- **Estados expuestos**:
  - `user`: Usuario de Supabase
  - `session`: Sesión activa
  - `globalAdmin`: Rol de administrador global (super_admin, support_admin, sales_admin, read_only)
  - `loading`: Estado de carga
  - `signIn()`, `signUp()`, `signOut()`: Métodos de autenticación

### Rutas (`src/App.tsx`)

```
/
├── /auth                    → Página de login/registro
└── /admin/*                 → Layout protegido
    ├── /dashboard           → Dashboard con KPIs
    ├── /tenants             → Lista de tenants
    │   ├── /new            → Wizard de creación
    │   └── /:id            → Detalle del tenant
    ├── /users              → Gestión de usuarios (placeholder)
    └── /audit              → Auditoría (placeholder)
```

### Componentes Principales

#### Layout
- **AdminLayout** (`src/pages/admin/AdminLayout.tsx`): Layout principal con sidebar
- **AppSidebar** (`src/components/AppSidebar.tsx`): Navegación lateral colapsable
- **ProtectedRoute** (`src/components/ProtectedRoute.tsx`): Protección de rutas

#### UI Components
- **StatusBadge** (`src/components/StatusBadge.tsx`): Badges para estados (trial, active, suspended, cancelled)
- **ModuleChip** (`src/components/ModuleChip.tsx`): Chips para módulos

#### Pages

**Dashboard** (`src/pages/admin/Dashboard.tsx`)
- 4 KPI cards: Total Tenants, Activos, En Trial, Suspendidos
- Lista de tenants recientes con contactos y módulos
- Click para navegar al detalle

**Tenants** (`src/pages/admin/Tenants.tsx`)
- Lista completa de tenants
- Búsqueda por nombre
- Filtrado en tiempo real
- Botón "Nuevo Tenant"

**CreateTenant** (`src/pages/admin/CreateTenant.tsx`)
- Wizard de 4 pasos:
  1. **Datos Básicos**: nombre, slug, moneda, timezone, estado
  2. **Contactos**: agregar múltiples contactos con datos
  3. **Módulos**: selección de apps de Payper
  4. **Invitar Usuario**: opcional, asignar owner/admin

**TenantDetail** (`src/pages/admin/TenantDetail.tsx`)
- Tabs:
  - **Información**: datos básicos del tenant
  - **Módulos**: lista de módulos activos
  - **Contactos**: personas de contacto
  - **Notas Internas**: notas del equipo Payper

## 🎨 Sistema de Diseño

### Colores (HSL)

**Light Mode:**
```css
--primary: 234 89% 54%        /* Indigo brillante */
--success: 142 76% 36%        /* Verde */
--warning: 38 92% 50%         /* Naranja/Amarillo */
--destructive: 0 84% 60%      /* Rojo */
```

**Status Colors:**
- Trial: `--status-trial` (naranja)
- Active: `--status-active` (verde)
- Suspended: `--status-suspended` (rojo)
- Cancelled: `--status-cancelled` (gris)

### Componentes Shadcn

- Card, Button, Input, Select
- Sidebar (con colapso)
- Tabs, Badge, Progress
- Toast (Sonner)
- Form (react-hook-form + zod)

## 🗄️ Base de Datos

### Tablas Principales

**global_admins**
- Roles de administradores del panel
- Roles: super_admin, support_admin, sales_admin, read_only

**tenants**
- Empresas/clientes de Payper
- Estados: trial, active, suspended, cancelled

**tenant_contacts**
- Contactos de negocio por tenant
- Campos: name, email, phone, role_label, is_primary

**tenant_modules**
- Relación tenants ↔ apps_registry
- Indica qué módulos tiene cada tenant

**apps_registry**
- Catálogo de módulos de Payper
- Ej: ticketing, cashless_nfc, inventory_stock, recipes, etc.

**tenant_users**
- Usuarios administrativos por tenant
- Roles: tenant_owner, tenant_admin, tenant_ops, tenant_finance, tenant_viewer

**audit_logs**
- Registro de cambios críticos
- Campos: action, entity_type, entity_id, before_data, after_data

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:
- Solo usuarios en `global_admins` pueden acceder
- `super_admin` y `sales_admin` pueden crear/editar tenants
- `support_admin` tiene permisos limitados
- `read_only` solo puede ver datos

## 🔐 Seguridad

### Validaciones
- Validación client-side con **zod**
- Validación de email/passwords
- Slug único verificado antes de crear tenant
- RLS policies en todas las tablas

### Flujo de Autenticación
1. Usuario hace login en `/auth`
2. Sistema verifica que exista en `global_admins`
3. Si no existe → "Acceso Denegado"
4. Si existe → carga rol y permite acceso

### Auditoría
- Todos los cambios críticos se registran en `audit_logs`
- Include: actor, acción, entidad, before/after data
- Usado para compliance y debugging

## 📱 Responsive Design

- **Desktop**: Sidebar completa con texto
- **Tablet**: Sidebar colapsable
- **Mobile**: Sidebar en modo icon, botones adaptados

## 🚀 Próximos Pasos

### Funcionalidades Pendientes

1. **Edición de Tenants**
   - Formulario para modificar datos básicos
   - Agregar/eliminar contactos
   - Cambiar estado

2. **Toggle de Módulos**
   - Activar/desactivar desde el detalle
   - Modal de confirmación
   - Registro en audit_logs

3. **Gestión de Usuarios**
   - Página completa de usuarios
   - Filtros por tenant
   - Cambio de roles y estados

4. **Auditoría Completa**
   - Vista con filtros avanzados
   - Visualización diff (before/after)
   - Paginación

5. **Dashboards Avanzados**
   - Gráficos con recharts
   - Evolución temporal
   - Distribución por status

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Forms**: react-hook-form + zod
- **Routing**: React Router v6
- **State**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Date**: date-fns

## 📝 Convenciones de Código

### Naming
- Componentes: PascalCase (`StatusBadge.tsx`)
- Hooks: camelCase con prefijo `use` (`useAuth.tsx`)
- Páginas: PascalCase (`Dashboard.tsx`)
- Utilities: camelCase

### Estructura de Archivos
```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Shadcn components
│   └── create-tenant/  # Componentes del wizard
├── hooks/              # Custom hooks
├── lib/                # Utilidades
│   └── validations/    # Schemas de zod
├── pages/              # Páginas principales
│   └── admin/          # Páginas del admin
└── integrations/       # Clientes externos (Supabase)
```

### TypeScript
- Interfaces para props de componentes
- Types para datos de API
- Strict mode habilitado

## 🐛 Debugging

### Logs Útiles
```typescript
// Ver estado de auth
const { user, globalAdmin } = useAuth();
console.log({ user, globalAdmin });

// Ver errores de Supabase
const { data, error } = await supabase.from('table').select();
if (error) console.error('Supabase error:', error);
```

### Common Issues

**"Acceso Denegado"**
- Verificar que el usuario esté en `global_admins`
- SQL para agregar admin:
```sql
INSERT INTO global_admins (user_id, role, is_active)
VALUES (auth.uid(), 'super_admin', true);
```

**Slug duplicado**
- El wizard verifica antes de crear
- Mensaje de error claro al usuario

**RLS blocking data**
- Verificar que el usuario tenga rol activo
- Revisar políticas RLS en Cloud UI

---

**Última actualización**: 2025-11-10
**Versión**: v1.0

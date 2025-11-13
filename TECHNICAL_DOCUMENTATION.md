# Payper Superadmin Panel - Technical Documentation

**Version:** 1.0  
**Last Updated:** 2025-11-10  
**Purpose:** Multi-tenant administration panel for managing Payper ecosystem clients, modules, and users

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Integration Points](#api-integration-points)
6. [Frontend Structure](#frontend-structure)
7. [Backend Security (RLS)](#backend-security-rls)
8. [Integration Guide](#integration-guide)
9. [Deployment & Configuration](#deployment--configuration)
10. [Development Guidelines](#development-guidelines)

---

## System Overview

### Purpose

The Payper Superadmin Panel is a centralized management system that allows the Payper team to:
- Manage multiple tenants (businesses/venues using Payper services)
- Assign and configure modules per tenant
- Manage administrative users per tenant
- Track all system changes via audit logs
- View global metrics and KPIs

### Key Features

- **Multi-tenant architecture**: Each tenant is isolated with their own data
- **Role-based access control**: 4 global admin roles (super_admin, support_admin, sales_admin, read_only)
- **Module management**: Enable/disable Payper apps per tenant
- **Audit logging**: Complete history of all critical changes
- **Responsive design**: Works on desktop, tablet, and mobile

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn UI components
- React Router v6
- TanStack Query (React Query)
- react-hook-form + zod (validation)
- date-fns (date formatting)
- lucide-react (icons)

**Backend:**
- Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- Row Level Security for data isolation
- PostgreSQL triggers and functions

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Payper Superadmin Panel                  │
│                  (React SPA - Superadmin UI)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │    Supabase Backend         │
         │  ┌──────────────────────┐   │
         │  │  PostgreSQL Database │   │
         │  │  - Tenants           │   │
         │  │  - Modules           │   │
         │  │  - Users             │   │
         │  │  - Audit Logs        │   │
         │  └──────────────────────┘   │
         │  ┌──────────────────────┐   │
         │  │  Row Level Security  │   │
         │  │  (RLS Policies)      │   │
         │  └──────────────────────┘   │
         │  ┌──────────────────────┐   │
         │  │  Authentication      │   │
         │  │  (Supabase Auth)     │   │
         │  └──────────────────────┘   │
         └─────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   Existing Payper Apps      │
         │   (share same DB/tenant_id) │
         │   - EtiqueTERA              │
         │   - Cashless NFC            │
         │   - Stock Management        │
         │   - QR Orders               │
         │   - PR Tokens               │
         │   - etc.                    │
         └─────────────────────────────┘
```

### Data Flow

1. **Superadmin logs in** → Auth verified against `auth.users` + `global_admins`
2. **Creates/modifies tenant** → Data written to `tenants` table + audit log
3. **Assigns modules** → Records created in `tenant_modules`
4. **Invites users** → Records created in `tenant_users`
5. **Existing apps read** → Query `tenants`, `tenant_modules` filtered by `tenant_id`

---

## Database Schema

### Core Tables

#### `global_admins`
**Purpose:** Users who can access the superadmin panel

```sql
CREATE TABLE global_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  role global_admin_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Roles (enum `global_admin_role`):**
- `super_admin`: Full access (create, edit, delete everything)
- `support_admin`: Read all + limited edits
- `sales_admin`: Create tenants + assign modules
- `read_only`: View-only access

**Key Points:**
- Only users in this table can access `/admin/*`
- `is_active = false` blocks access even if record exists
- Linked to `auth.users` via `user_id`

---

#### `tenants`
**Purpose:** Each business/venue using Payper services

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  default_currency TEXT DEFAULT 'ARS',
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  status tenant_status DEFAULT 'trial',
  onboarding_step INTEGER DEFAULT 0,
  notes_internal TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Status (enum `tenant_status`):**
- `trial`: Initial state, testing
- `active`: Paying customer
- `suspended`: Temporarily disabled
- `cancelled`: Permanently closed

**Key Fields:**
- `slug`: URL-friendly unique identifier (e.g., "bar-palermo")
- `default_currency`: Used by all tenant apps
- `timezone`: For date/time displays and scheduling
- `notes_internal`: Private notes for Payper team only

**Integration Point:**  
**All existing Payper apps MUST filter by `tenant_id`** when querying their own tables.

---

#### `tenant_contacts`
**Purpose:** Business contacts for each tenant

```sql
CREATE TABLE tenant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_label TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Usage:**
- Store multiple contacts per tenant
- Mark one as `is_primary = true` (main contact)
- Use for business communications, invoicing, etc.

---

#### `tenant_users`
**Purpose:** Link users to tenants with specific roles

```sql
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role tenant_user_role NOT NULL,
  status tenant_user_status DEFAULT 'invited',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
```

**Roles (enum `tenant_user_role`):**
- `tenant_owner`: Full control of tenant
- `tenant_admin`: Manage users, settings
- `tenant_ops`: Daily operations
- `tenant_finance`: View reports, billing
- `tenant_viewer`: Read-only access

**Status (enum `tenant_user_status`):**
- `invited`: Invitation sent, not accepted yet
- `active`: User is active
- `disabled`: User blocked

**Integration Point:**  
Your existing apps should check this table to determine:
- Which tenants a user has access to
- What permissions they have (via `role`)

---

#### `apps_registry`
**Purpose:** Catalog of all Payper modules/apps

```sql
CREATE TABLE apps_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_core BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Pre-seeded modules:**
```sql
INSERT INTO apps_registry (key, name, description, is_core) VALUES
  ('ticketing', 'EtiqueTERA', 'Event ticketing system', true),
  ('tables_orders', 'QR Orders', 'QR code ordering + table management', true),
  ('cashless_nfc', 'Cashless NFC', 'Cashless payment system with NFC', false),
  ('inventory_stock', 'Stock & Inventory', 'Inventory management', false),
  ('recipes', 'Recipes', 'Recipe and production management', false),
  ('pr_tokens', 'PR Tokens', 'PR tokens system', false),
  ('qr_analytics', 'QR Analytics', 'QR scan analytics', false),
  ('guestlist_events', 'Guest List', 'Guest list management', false),
  ('complimentary_gifts', 'Complimentary', 'Complimentary gifts management', false);
```

**Usage:**
- Add your existing apps here with unique `key`
- Set `is_core = true` for essential modules
- Description appears in UI when assigning modules

---

#### `tenant_modules`
**Purpose:** Which modules are enabled for each tenant

```sql
CREATE TABLE tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  app_id UUID REFERENCES apps_registry(id) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, app_id)
);
```

**Key Fields:**
- `enabled`: Boolean flag for quick checks
- `config`: JSONB for app-specific configuration (limits, features, etc.)
- `activated_at` / `deactivated_at`: Timestamps for history

**Integration Point:**  
Your apps should query this table to check if they're enabled:

```typescript
const { data } = await supabase
  .from('tenant_modules')
  .select('enabled, config')
  .eq('tenant_id', currentTenantId)
  .eq('app_id', 'YOUR_APP_ID') // or join with apps_registry.key
  .single();

if (!data?.enabled) {
  // Show "Module not enabled" message
  return;
}

// Use data.config for app-specific settings
```

---

#### `tenant_locations`
**Purpose:** Physical locations/venues per tenant

```sql
CREATE TABLE tenant_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, code)
);
```

**Usage:**
- A tenant can have multiple locations (e.g., "Bar Palermo", "Bar Córdoba")
- Use `code` for internal reference in existing apps
- Filter operations by location if needed

---

#### `audit_logs`
**Purpose:** Track all critical changes in the system

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Common Actions:**
- `TENANT_CREATED`
- `TENANT_UPDATED`
- `TENANT_DELETED`
- `MODULE_ENABLED`
- `MODULE_DISABLED`
- `USER_INVITED`
- `USER_ROLE_CHANGED`

**Fields:**
- `before_data`: JSON snapshot before change
- `after_data`: JSON snapshot after change
- `actor_user_id` + `actor_role`: Who made the change

**Integration Point:**  
Your apps can also write to this table for important actions:

```typescript
await supabase.from('audit_logs').insert({
  actor_user_id: currentUserId,
  actor_role: 'tenant_admin',
  action: 'ORDER_CANCELLED',
  entity_type: 'order',
  entity_id: orderId,
  before_data: { status: 'pending', amount: 100 },
  after_data: { status: 'cancelled', amount: 0 }
});
```

---

## Authentication & Authorization

### Authentication Flow

1. **User Registration/Login** (`/auth` page)
   ```typescript
   // Sign up
   const { error } = await supabase.auth.signUp({
     email,
     password,
     options: { emailRedirectTo: window.location.origin + '/' }
   });

   // Sign in
   const { error } = await supabase.auth.signInWithPassword({
     email,
     password
   });
   ```

2. **Session Management** (handled by `AuthProvider`)
   ```typescript
   // On auth state change
   supabase.auth.onAuthStateChange((event, session) => {
     // Set user and session
     // Query global_admins for role
   });
   ```

3. **Protected Routes** (via `ProtectedRoute` component)
   - Check if user exists
   - Check if user has entry in `global_admins` with `is_active = true`
   - If not → redirect to `/auth` or show "Access Denied"

### Authorization Levels

**Global Admins (Superadmin Panel):**
| Role | Create Tenants | Edit Tenants | Delete | View All | Manage Users | Audit Logs |
|------|----------------|--------------|--------|----------|--------------|------------|
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| sales_admin | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| support_admin | ❌ | Limited | ❌ | ✅ | ✅ | ✅ |
| read_only | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

**Tenant Users (App Level):**
| Role | Full Access | Manage Settings | Daily Ops | Reports | View Only |
|------|-------------|-----------------|-----------|---------|-----------|
| tenant_owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| tenant_admin | ❌ | ✅ | ✅ | ✅ | ✅ |
| tenant_ops | ❌ | ❌ | ✅ | Limited | ✅ |
| tenant_finance | ❌ | ❌ | ❌ | ✅ | ✅ |
| tenant_viewer | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## API Integration Points

### How Your Existing Apps Connect

#### 1. Get Current Tenant

All your apps should determine which tenant the logged-in user belongs to:

```typescript
// Get user's tenants
const { data: userTenants } = await supabase
  .from('tenant_users')
  .select(`
    tenant_id,
    role,
    status,
    tenants (*)
  `)
  .eq('user_id', auth.uid())
  .eq('status', 'active');

// If user has multiple tenants, show selector
// If single tenant, use it as currentTenantId
const currentTenantId = userTenants[0].tenant_id;
```

#### 2. Check Module Access

Before rendering your app, verify it's enabled:

```typescript
const { data: moduleAccess } = await supabase
  .from('tenant_modules')
  .select(`
    enabled,
    config,
    apps_registry (key, name)
  `)
  .eq('tenant_id', currentTenantId)
  .eq('apps_registry.key', 'YOUR_APP_KEY') // e.g., 'cashless_nfc'
  .maybeSingle();

if (!moduleAccess?.enabled) {
  return <div>This module is not enabled for your tenant</div>;
}

// Use moduleAccess.config for app settings
const settings = moduleAccess.config;
```

#### 3. Filter All Queries by Tenant

**CRITICAL:** All your app's tables should have a `tenant_id` column and be filtered:

```typescript
// ❌ WRONG - exposes all tenants' data
const { data } = await supabase
  .from('orders')
  .select('*');

// ✅ CORRECT - filtered by tenant
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('tenant_id', currentTenantId);
```

**Implement RLS on your tables:**

```sql
-- Example for orders table
CREATE POLICY "Users can only see their tenant's orders"
ON orders
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users
    WHERE user_id = auth.uid() AND status = 'active'
  )
);
```

#### 4. Get Tenant Settings

```typescript
const { data: tenant } = await supabase
  .from('tenants')
  .select('*')
  .eq('id', currentTenantId)
  .single();

// Use tenant.default_currency for prices
// Use tenant.timezone for date displays
```

#### 5. Write Audit Logs (Optional)

For important actions in your apps:

```typescript
await supabase.from('audit_logs').insert({
  actor_user_id: auth.uid(),
  action: 'ORDER_COMPLETED',
  entity_type: 'order',
  entity_id: order.id,
  after_data: { total: order.total, status: 'completed' }
});
```

---

## Backend Security (RLS)

### Row Level Security Policies

All tables have RLS enabled. Here are the key policies:

#### Global Admins Table

```sql
-- Superadmins can read their own role
CREATE POLICY "allow_select_own_role" ON global_admins
  FOR SELECT USING (user_id = auth.uid());

-- Only super_admins can manage global_admins
CREATE POLICY "allow_superadmin_manage" ON global_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM global_admins
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
        AND is_active = true
    )
  );
```

#### Tenants Table

```sql
-- All global admins can read tenants
CREATE POLICY "allow_admin_read_tenants" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM global_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Only super_admin and sales_admin can create/edit tenants
CREATE POLICY "allow_admin_manage_tenants" ON tenants
  FOR ALL USING (
    current_global_role() IN ('super_admin', 'sales_admin')
  );
```

#### Tenant Users Table

```sql
-- Global admins can read all tenant_users
CREATE POLICY "allow_admin_read_tenant_users" ON tenant_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM global_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Superadmin, sales, support can manage
CREATE POLICY "allow_admin_manage_tenant_users" ON tenant_users
  FOR ALL USING (
    current_global_role() IN ('super_admin', 'sales_admin', 'support_admin')
  );
```

### Helper Function: `current_global_role()`

```sql
CREATE OR REPLACE FUNCTION current_global_role()
RETURNS global_admin_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM global_admins
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1
$$;
```

**Usage:** Simplifies RLS policies by returning the current user's global admin role.

---

## Frontend Structure

### Directory Layout

```
src/
├── components/
│   ├── ui/                      # Shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sidebar.tsx
│   │   └── ...
│   ├── create-tenant/           # Wizard steps
│   │   ├── BasicInfoStep.tsx
│   │   ├── ContactsStep.tsx
│   │   ├── ModulesStep.tsx
│   │   └── InviteUserStep.tsx
│   ├── AppSidebar.tsx           # Main navigation
│   ├── ProtectedRoute.tsx       # Auth guard
│   ├── StatusBadge.tsx          # Status indicators
│   └── ModuleChip.tsx           # Module badges
├── hooks/
│   └── useAuth.tsx              # Auth context & hooks
├── lib/
│   ├── utils.ts                 # Utility functions
│   └── validations/
│       └── tenant.ts            # Zod schemas
├── pages/
│   ├── Auth.tsx                 # Login/signup
│   ├── NotFound.tsx             # 404 page
│   └── admin/
│       ├── AdminLayout.tsx      # Admin shell
│       ├── Dashboard.tsx        # Main dashboard
│       ├── Tenants.tsx          # Tenant list
│       ├── TenantDetail.tsx     # Tenant detail view
│       ├── CreateTenant.tsx     # Tenant wizard
│       ├── Users.tsx            # Users page
│       └── Audit.tsx            # Audit page
├── integrations/
│   └── supabase/
│       ├── client.ts            # Supabase client
│       └── types.ts             # Generated types
├── App.tsx                      # Root component
├── main.tsx                     # Entry point
└── index.css                    # Global styles
```

### Key Components

#### `useAuth()` Hook

```typescript
const { 
  user,          // Supabase user object
  session,       // Current session
  globalAdmin,   // Global admin role object
  loading,       // Loading state
  signIn,        // Login function
  signUp,        // Signup function
  signOut        // Logout function
} = useAuth();
```

#### `ProtectedRoute` Component

Wraps admin routes to ensure authentication:

```typescript
<Route path="/admin/*" element={
  <ProtectedRoute>
    <AdminLayout />
  </ProtectedRoute>
} />
```

#### `AppSidebar` Component

Main navigation with:
- Dashboard
- Tenants
- Users
- Audit
- Logout button
- Role display

---

## Integration Guide

### Step-by-Step Integration

#### Step 1: Add `tenant_id` to Your Tables

All your existing app tables should have:

```sql
ALTER TABLE your_table
ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL;

CREATE INDEX idx_your_table_tenant_id ON your_table(tenant_id);
```

#### Step 2: Implement Tenant Context in Your App

Create a context/hook to manage current tenant:

```typescript
// hooks/useTenant.tsx
export const useTenant = () => {
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Fetch user's tenants
      supabase
        .from('tenant_users')
        .select('tenant_id, tenants(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .then(({ data }) => {
          if (data?.length === 1) {
            setCurrentTenantId(data[0].tenant_id);
          } else {
            // Show tenant selector
          }
        });
    }
  }, [user]);

  return { currentTenantId };
};
```

#### Step 3: Filter All Queries

Wrap your Supabase client or create a helper:

```typescript
// lib/supabase-tenant.ts
export const getTenantQuery = (table: string, tenantId: string) => {
  return supabase.from(table).select('*').eq('tenant_id', tenantId);
};

// Usage
const { data } = await getTenantQuery('orders', currentTenantId);
```

#### Step 4: Check Module Access

Create a hook:

```typescript
// hooks/useModuleAccess.tsx
export const useModuleAccess = (moduleKey: string) => {
  const { currentTenantId } = useTenant();
  const [enabled, setEnabled] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (currentTenantId) {
      supabase
        .from('tenant_modules')
        .select('enabled, config, apps_registry(key)')
        .eq('tenant_id', currentTenantId)
        .eq('apps_registry.key', moduleKey)
        .maybeSingle()
        .then(({ data }) => {
          setEnabled(data?.enabled ?? false);
          setConfig(data?.config);
        });
    }
  }, [currentTenantId, moduleKey]);

  return { enabled, config };
};

// Usage in your app
const { enabled, config } = useModuleAccess('cashless_nfc');

if (!enabled) {
  return <div>Module not enabled</div>;
}
```

#### Step 5: Add RLS Policies to Your Tables

```sql
-- Example for orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_users_can_read_orders" ON orders
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "tenant_users_can_insert_orders" ON orders
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Similar for UPDATE and DELETE
```

#### Step 6: Register Your App in `apps_registry`

```sql
INSERT INTO apps_registry (key, name, description, is_core)
VALUES ('your_app_key', 'Your App Name', 'Description', false);
```

#### Step 7: Test Multi-Tenant Isolation

1. Create two test tenants in superadmin
2. Assign different users to each tenant
3. Create test data for each tenant
4. Verify users can only see their tenant's data

---

## Deployment & Configuration

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Building for Production

```bash
npm run build
```

Output: `dist/` folder ready to deploy

### Supabase Configuration

1. **Enable Email Confirmations** (optional):
   - Go to Authentication > Email Auth > Email Confirmations
   - Toggle based on your needs
   - For dev: disable for faster testing

2. **Configure Auth URLs**:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: Add all domains where app will run

3. **Set up SMTP** (for email invitations):
   - Configure SMTP in Auth > Email settings
   - Or use Supabase's default email service

### Granting Superadmin Access

To give a user superadmin access:

```sql
-- First, the user must sign up via /auth
-- Then run this SQL in Supabase SQL Editor:

INSERT INTO global_admins (user_id, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'super_admin',
  true
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin', is_active = true;
```

---

## Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **Components**: PascalCase (e.g., `StatusBadge.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.tsx`)
- **Constants**: UPPER_SNAKE_CASE
- **Props interfaces**: Suffix with `Props`

### Best Practices

1. **Always filter by `tenant_id`** in queries
2. **Use RLS policies** for security, not just client-side checks
3. **Validate inputs** with zod schemas
4. **Handle errors** gracefully with user-friendly messages
5. **Write audit logs** for critical actions
6. **Test multi-tenant isolation** thoroughly
7. **Use TypeScript** for type safety
8. **Keep components small** and focused
9. **Avoid prop drilling** - use contexts for global state
10. **Document complex logic** with comments

### Testing Multi-Tenant Features

```typescript
// Test: User A can't see User B's data
describe('Multi-tenant isolation', () => {
  it('should only return data for current tenant', async () => {
    // Login as User A (Tenant 1)
    const { data: tenant1Data } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenant1Id);

    // Login as User B (Tenant 2)
    const { data: tenant2Data } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenant2Id);

    // Verify no overlap
    expect(tenant1Data).not.toContainEqual(
      expect.objectContaining({ tenant_id: tenant2Id })
    );
  });
});
```

### Common Pitfalls

❌ **Don't:**
- Query without filtering by `tenant_id`
- Store sensitive data in `localStorage`
- Use hardcoded tenant IDs
- Skip RLS policies thinking client-side checks are enough
- Forget to handle loading/error states

✅ **Do:**
- Always filter by `tenant_id`
- Use Supabase session for auth state
- Make tenant selection dynamic
- Implement RLS on all tables
- Show user-friendly error messages

---

## API Reference

### Supabase Client Usage

```typescript
import { supabase } from '@/integrations/supabase/client';

// Query with relations
const { data, error } = await supabase
  .from('tenants')
  .select(`
    *,
    tenant_contacts (*),
    tenant_modules (
      *,
      apps_registry (*)
    )
  `)
  .eq('id', tenantId)
  .single();

// Insert with audit log
const { data: newTenant } = await supabase
  .from('tenants')
  .insert({ name: 'New Tenant', slug: 'new-tenant' })
  .select()
  .single();

await supabase.from('audit_logs').insert({
  actor_user_id: user.id,
  action: 'TENANT_CREATED',
  entity_type: 'tenant',
  entity_id: newTenant.id,
  after_data: newTenant
});
```

### Common Queries

**Get tenants for a user:**
```typescript
const { data } = await supabase
  .from('tenant_users')
  .select('tenant_id, role, tenants(*)')
  .eq('user_id', userId)
  .eq('status', 'active');
```

**Check if module is enabled:**
```typescript
const { data } = await supabase
  .from('tenant_modules')
  .select('enabled, config')
  .eq('tenant_id', tenantId)
  .eq('app_id', appId)
  .maybeSingle();
```

**Get tenant settings:**
```typescript
const { data } = await supabase
  .from('tenants')
  .select('default_currency, timezone, status')
  .eq('id', tenantId)
  .single();
```

---

## Migration Checklist

### For Integrating Existing Apps

- [ ] Add `tenant_id` column to all your tables
- [ ] Create foreign key constraints to `tenants(id)`
- [ ] Add indexes on `tenant_id` columns
- [ ] Implement RLS policies on all tables
- [ ] Create tenant context in your app
- [ ] Update all queries to filter by `tenant_id`
- [ ] Add module access checks
- [ ] Test with multiple tenants
- [ ] Verify data isolation
- [ ] Register your app in `apps_registry`
- [ ] Document integration points
- [ ] Update deployment scripts

---

## Support & Troubleshooting

### Common Issues

**Issue:** User can't access superadmin panel  
**Solution:** Verify they're in `global_admins` with `is_active = true`

**Issue:** Tenant data not showing in existing app  
**Solution:** Check that `tenant_id` is being passed correctly in queries

**Issue:** RLS blocking legitimate queries  
**Solution:** Verify user has entry in `tenant_users` with `status = 'active'`

**Issue:** Module shows as disabled  
**Solution:** Check `tenant_modules` table, ensure `enabled = true`

### Debug Queries

```sql
-- Check user's global admin status
SELECT * FROM global_admins WHERE user_id = auth.uid();

-- Check user's tenant access
SELECT * FROM tenant_users WHERE user_id = auth.uid();

-- Check tenant's enabled modules
SELECT tm.*, ar.name, ar.key
FROM tenant_modules tm
JOIN apps_registry ar ON ar.id = tm.app_id
WHERE tm.tenant_id = 'TENANT_ID' AND tm.enabled = true;

-- Check recent audit logs
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## Glossary

- **Tenant**: A business/venue using Payper services
- **Global Admin**: Payper team member who manages the superadmin panel
- **Tenant User**: End user who belongs to a tenant and uses Payper apps
- **Module**: A Payper app/feature (e.g., ticketing, cashless, stock)
- **RLS**: Row Level Security - PostgreSQL security feature
- **Slug**: URL-friendly unique identifier (e.g., "bar-palermo")

---

## Contact & Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Query**: https://tanstack.com/query
- **Shadcn UI**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

---

**End of Technical Documentation**

For questions or clarifications, contact the Payper development team.

# Payper Superadmin - Integration Quickstart

**Target Audience:** Developers integrating existing Payper apps  
**Time Required:** 2-4 hours  
**Difficulty:** Intermediate

---

## Prerequisites

- Access to Supabase project
- Understanding of React + TypeScript
- Familiarity with PostgreSQL
- Existing Payper app to integrate

---

## Quick Integration in 5 Steps

### Step 1: Add Tenant Column (5 mins)

Add `tenant_id` to all your app's tables:

```sql
-- For each of your tables:
ALTER TABLE your_table
ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL;

CREATE INDEX idx_your_table_tenant_id ON your_table(tenant_id);

-- Example for orders table:
ALTER TABLE orders ADD COLUMN tenant_id UUID REFERENCES tenants(id) NOT NULL;
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
```

### Step 2: Enable RLS (10 mins)

Add Row Level Security to your tables:

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY "tenant_isolation_select" ON orders
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy: Users can only insert for their tenant
CREATE POLICY "tenant_isolation_insert" ON orders
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Repeat for UPDATE and DELETE
CREATE POLICY "tenant_isolation_update" ON orders
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "tenant_isolation_delete" ON orders
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

**Repeat for all your tables!**

### Step 3: Create Tenant Context (15 mins)

Add tenant management to your app:

```typescript
// src/contexts/TenantContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth'; // or your auth hook

interface TenantContextType {
  currentTenantId: string | null;
  tenantName: string | null;
  loading: boolean;
  switchTenant: (tenantId: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserTenants();
    } else {
      setCurrentTenantId(null);
      setTenantName(null);
      setLoading(false);
    }
  }, [user]);

  const loadUserTenants = async () => {
    const { data, error } = await supabase
      .from('tenant_users')
      .select(`
        tenant_id,
        role,
        tenants (
          id,
          name,
          status
        )
      `)
      .eq('user_id', user!.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading tenants:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      // If user has only one tenant, auto-select it
      const tenantId = data[0].tenant_id;
      const name = data[0].tenants.name;
      setCurrentTenantId(tenantId);
      setTenantName(name);
      
      // Store in localStorage for persistence
      localStorage.setItem('currentTenantId', tenantId);
    }

    setLoading(false);
  };

  const switchTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    localStorage.setItem('currentTenantId', tenantId);
  };

  return (
    <TenantContext.Provider value={{ currentTenantId, tenantName, loading, switchTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
```

### Step 4: Update All Queries (30 mins)

Wrap your app in `TenantProvider` and update queries:

```typescript
// App.tsx
import { TenantProvider } from './contexts/TenantContext';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        {/* Your app */}
      </TenantProvider>
    </AuthProvider>
  );
}

// In your components:
import { useTenant } from '@/contexts/TenantContext';

function OrdersList() {
  const { currentTenantId } = useTenant();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (currentTenantId) {
      loadOrders();
    }
  }, [currentTenantId]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', currentTenantId) // ← KEY LINE
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
  };

  // When creating new records:
  const createOrder = async (orderData) => {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        tenant_id: currentTenantId // ← KEY LINE
      });
  };
}
```

### Step 5: Check Module Access (15 mins)

Verify your app is enabled for the tenant:

```typescript
// hooks/useModuleAccess.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export const useModuleAccess = (moduleKey: string) => {
  const { currentTenantId } = useTenant();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenantId) {
      checkAccess();
    }
  }, [currentTenantId, moduleKey]);

  const checkAccess = async () => {
    const { data, error } = await supabase
      .from('tenant_modules')
      .select(`
        enabled,
        config,
        apps_registry!inner (key)
      `)
      .eq('tenant_id', currentTenantId)
      .eq('apps_registry.key', moduleKey)
      .maybeSingle();

    if (data) {
      setEnabled(data.enabled);
      setConfig(data.config);
    }
    setLoading(false);
  };

  return { enabled, config, loading };
};

// Usage in your app component:
function YourApp() {
  const { enabled, config, loading } = useModuleAccess('your_app_key');

  if (loading) return <div>Loading...</div>;
  
  if (!enabled) {
    return (
      <div className="text-center p-8">
        <h2>Module Not Enabled</h2>
        <p>This module is not enabled for your tenant.</p>
        <p>Contact your administrator to enable it.</p>
      </div>
    );
  }

  return <div>Your app content</div>;
}
```

---

## Testing Your Integration

### 1. Create Test Data

In Superadmin panel:
1. Go to `/admin/tenants/new`
2. Create "Test Tenant 1"
3. Assign your module to it
4. Create a test user

### 2. Login & Verify

1. Login as the test user
2. Check console: `useTenant()` should return the tenant ID
3. Create test data in your app
4. Verify in database: all records have correct `tenant_id`

### 3. Test Isolation

1. Create "Test Tenant 2" with different user
2. Add data in both tenants
3. Verify users can't see each other's data
4. Check RLS is working (try direct SQL queries)

### 4. Checklist

- [ ] All tables have `tenant_id` column
- [ ] RLS policies are active on all tables
- [ ] `useTenant()` hook returns correct tenant ID
- [ ] All queries filter by `tenant_id`
- [ ] Module access check is working
- [ ] Users can't see other tenants' data
- [ ] New records get correct `tenant_id`
- [ ] No errors in browser console

---

## Common Issues & Solutions

### Issue: "relation does not exist"
**Solution:** Run the migration to add `tenant_id` columns

### Issue: "RLS policy violation"
**Solution:** User not in `tenant_users` or status is not 'active'

```sql
-- Check user access:
SELECT * FROM tenant_users WHERE user_id = auth.uid();

-- If missing, add user to tenant:
INSERT INTO tenant_users (tenant_id, user_id, role, status)
VALUES ('TENANT_ID', 'USER_ID', 'tenant_admin', 'active');
```

### Issue: "Module shows as disabled"
**Solution:** Module not assigned to tenant

```sql
-- Check tenant modules:
SELECT tm.*, ar.name FROM tenant_modules tm
JOIN apps_registry ar ON ar.id = tm.app_id
WHERE tm.tenant_id = 'TENANT_ID';

-- If missing, enable module in superadmin panel
-- Or manually:
INSERT INTO tenant_modules (tenant_id, app_id, enabled, activated_at)
VALUES (
  'TENANT_ID',
  (SELECT id FROM apps_registry WHERE key = 'your_app_key'),
  true,
  now()
);
```

### Issue: "Can't query data"
**Solution:** Missing `tenant_id` in WHERE clause

```typescript
// ❌ Wrong:
const { data } = await supabase.from('orders').select('*');

// ✅ Correct:
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('tenant_id', currentTenantId);
```

---

## Register Your App

Add your app to the registry so it appears in the superadmin:

```sql
INSERT INTO apps_registry (key, name, description, is_core)
VALUES (
  'your_app_key',           -- Unique key (e.g., 'cashless_nfc')
  'Your App Name',          -- Display name
  'App description here',   -- Short description
  false                     -- Set true if core/essential module
);
```

---

## Next Steps

1. **Migration Script:** Create a script to migrate existing data with `tenant_id`
2. **Audit Logs:** Add logging for critical actions in your app
3. **Multi-location:** If needed, add `location_id` filtering
4. **Advanced RLS:** Add role-based policies within tenants
5. **Performance:** Add indexes on frequently queried columns

---

## Need Help?

- Check `TECHNICAL_DOCUMENTATION.md` for complete reference
- Test with `ADMIN_STRUCTURE.md` for system overview
- Review RLS policies in Supabase dashboard
- Check browser console for error messages

---

**Integration Complete!** 🎉

Your app is now multi-tenant aware and integrated with Payper Superadmin.

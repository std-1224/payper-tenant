-- COMPLETE FIX: Remove ALL recursion issues

-- Step 1: Drop ALL policies that could cause recursion
DROP POLICY IF EXISTS "allow_admin_read_tenants" ON public.tenants;
DROP POLICY IF EXISTS "allow_admin_manage_tenants" ON public.tenants;
DROP POLICY IF EXISTS "allow_admin_read_contacts" ON public.tenant_contacts;
DROP POLICY IF EXISTS "allow_admin_manage_contacts" ON public.tenant_contacts;
DROP POLICY IF EXISTS "allow_admin_read_tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "allow_admin_manage_tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "allow_admin_read_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "allow_admin_manage_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "allow_admin_read_locations" ON public.tenant_locations;
DROP POLICY IF EXISTS "allow_admin_manage_locations" ON public.tenant_locations;

DROP POLICY IF EXISTS "tenant_users_read_own_tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "tenant_admins_manage_own_tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "global_admins_read_all_tenant_users" ON public.tenant_users;

DROP POLICY IF EXISTS "tenant_users_read_own_contacts" ON public.tenant_contacts;
DROP POLICY IF EXISTS "tenant_admins_manage_own_contacts" ON public.tenant_contacts;
DROP POLICY IF EXISTS "global_admins_read_all_tenant_contacts" ON public.tenant_contacts;

DROP POLICY IF EXISTS "tenant_users_read_own_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "tenant_owners_manage_own_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "global_admins_read_all_tenant_modules" ON public.tenant_modules;

DROP POLICY IF EXISTS "tenant_users_read_own_locations" ON public.tenant_locations;
DROP POLICY IF EXISTS "tenant_admins_manage_own_locations" ON public.tenant_locations;
DROP POLICY IF EXISTS "global_admins_read_all_tenant_locations" ON public.tenant_locations;

DROP POLICY IF EXISTS "tenant_users_read_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "tenant_owners_update_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "global_admins_read_all_tenants" ON public.tenants;

-- Step 2: Create simple, non-recursive policies for global admins
-- Using direct EXISTS checks instead of functions that query the same table

-- TENANTS: Global admins can do everything
CREATE POLICY "global_admin_all_tenants"
ON public.tenants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.global_admins ga
    WHERE ga.user_id = auth.uid() AND ga.is_active = true
  )
);

-- TENANT_CONTACTS: Global admins can do everything
CREATE POLICY "global_admin_all_contacts"
ON public.tenant_contacts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.global_admins ga
    WHERE ga.user_id = auth.uid() AND ga.is_active = true
  )
);

-- TENANT_USERS: Global admins can do everything
CREATE POLICY "global_admin_all_tenant_users"
ON public.tenant_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.global_admins ga
    WHERE ga.user_id = auth.uid() AND ga.is_active = true
  )
);

-- TENANT_MODULES: Global admins can do everything
CREATE POLICY "global_admin_all_modules"
ON public.tenant_modules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.global_admins ga
    WHERE ga.user_id = auth.uid() AND ga.is_active = true
  )
);

-- TENANT_LOCATIONS: Global admins can do everything
CREATE POLICY "global_admin_all_locations"
ON public.tenant_locations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.global_admins ga
    WHERE ga.user_id = auth.uid() AND ga.is_active = true
  )
);
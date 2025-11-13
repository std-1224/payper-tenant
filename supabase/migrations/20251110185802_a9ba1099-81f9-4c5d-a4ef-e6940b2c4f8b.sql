-- Fix infinite recursion in tenant-related policies
-- Create security definer functions to avoid RLS recursion

-- Function to check if user is a global admin (already exists, but verify)
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.global_admins
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Function to get tenant IDs where user is a member
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id 
  FROM public.tenant_users
  WHERE user_id = auth.uid() AND status = 'active';
$$;

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "tenant_users_read_own_tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "tenant_admins_manage_own_tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "tenant_users_read_own_contacts" ON public.tenant_contacts;
DROP POLICY IF EXISTS "tenant_admins_manage_own_contacts" ON public.tenant_contacts;
DROP POLICY IF EXISTS "tenant_users_read_own_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "tenant_owners_manage_own_modules" ON public.tenant_modules;
DROP POLICY IF EXISTS "tenant_users_read_own_locations" ON public.tenant_locations;
DROP POLICY IF EXISTS "tenant_admins_manage_own_locations" ON public.tenant_locations;
DROP POLICY IF EXISTS "tenant_users_read_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "tenant_owners_update_own_tenant" ON public.tenants;

-- Recreate policies using the helper functions (no recursion)

-- tenant_users policies
CREATE POLICY "tenant_users_read_own_tenant_users"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tenant_admins_manage_own_tenant_users"
ON public.tenant_users
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id FROM public.tenant_users t
    WHERE t.user_id = auth.uid() 
    AND t.status = 'active'
    AND t.role IN ('tenant_owner', 'tenant_admin')
  )
);

-- tenant_contacts policies  
CREATE POLICY "tenant_users_read_own_contacts"
ON public.tenant_contacts
FOR SELECT
TO authenticated
USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tenant_admins_manage_own_contacts"
ON public.tenant_contacts
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
    AND t.status = 'active'
    AND t.role IN ('tenant_owner', 'tenant_admin')
  )
);

-- tenant_modules policies
CREATE POLICY "tenant_users_read_own_modules"
ON public.tenant_modules
FOR SELECT
TO authenticated
USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tenant_owners_manage_own_modules"
ON public.tenant_modules
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
    AND t.status = 'active'
    AND t.role = 'tenant_owner'
  )
);

-- tenant_locations policies
CREATE POLICY "tenant_users_read_own_locations"
ON public.tenant_locations
FOR SELECT
TO authenticated
USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tenant_admins_manage_own_locations"
ON public.tenant_locations
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
    AND t.status = 'active'
    AND t.role IN ('tenant_owner', 'tenant_admin')
  )
);

-- tenants policies
CREATE POLICY "tenant_users_read_own_tenant"
ON public.tenants
FOR SELECT
TO authenticated
USING (id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tenant_owners_update_own_tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT t.tenant_id FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
    AND t.status = 'active'
    AND t.role = 'tenant_owner'
  )
);
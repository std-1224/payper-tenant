-- Add global admin policies so admins can see all data
-- These are in addition to the tenant-specific policies

-- Global admins can read all tenants
CREATE POLICY "global_admins_read_all_tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (public.is_global_admin());

-- Global admins can read all tenant_users
CREATE POLICY "global_admins_read_all_tenant_users"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (public.is_global_admin());

-- Global admins can read all tenant_contacts  
CREATE POLICY "global_admins_read_all_tenant_contacts"
ON public.tenant_contacts
FOR SELECT
TO authenticated
USING (public.is_global_admin());

-- Global admins can read all tenant_modules
CREATE POLICY "global_admins_read_all_tenant_modules"
ON public.tenant_modules
FOR SELECT
TO authenticated
USING (public.is_global_admin());

-- Global admins can read all tenant_locations
CREATE POLICY "global_admins_read_all_tenant_locations"
ON public.tenant_locations
FOR SELECT
TO authenticated
USING (public.is_global_admin());
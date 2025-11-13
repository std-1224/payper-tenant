-- Drop existing function and policies with CASCADE
DROP FUNCTION IF EXISTS public.current_global_role() CASCADE;

-- Create a security definer function to check global admin role
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.current_global_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.global_admins
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$;

-- Recreate policies on global_admins
CREATE POLICY "Users can view their own global admin record"
ON public.global_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all global admins"
ON public.global_admins
FOR SELECT
TO authenticated
USING (public.current_global_role() = 'super_admin');

CREATE POLICY "Super admins can insert global admins"
ON public.global_admins
FOR INSERT
TO authenticated
WITH CHECK (public.current_global_role() = 'super_admin');

CREATE POLICY "Super admins can update global admins"
ON public.global_admins
FOR UPDATE
TO authenticated
USING (public.current_global_role() = 'super_admin');

CREATE POLICY "Super admins can delete global admins"
ON public.global_admins
FOR DELETE
TO authenticated
USING (public.current_global_role() = 'super_admin');

-- Recreate policies on other tables that were dropped
CREATE POLICY "allow_admin_manage_tenants"
ON public.tenants
FOR ALL
TO authenticated
USING (public.current_global_role() IN ('super_admin', 'support_admin', 'sales_admin'));

CREATE POLICY "allow_admin_manage_contacts"
ON public.tenant_contacts
FOR ALL
TO authenticated
USING (public.current_global_role() IN ('super_admin', 'support_admin', 'sales_admin'));

CREATE POLICY "allow_admin_manage_tenant_users"
ON public.tenant_users
FOR ALL
TO authenticated
USING (public.current_global_role() IN ('super_admin', 'support_admin', 'sales_admin'));

CREATE POLICY "allow_superadmin_manage_apps"
ON public.apps_registry
FOR ALL
TO authenticated
USING (public.current_global_role() = 'super_admin');

CREATE POLICY "allow_admin_manage_modules"
ON public.tenant_modules
FOR ALL
TO authenticated
USING (public.current_global_role() IN ('super_admin', 'support_admin', 'sales_admin'));

CREATE POLICY "allow_admin_manage_locations"
ON public.tenant_locations
FOR ALL
TO authenticated
USING (public.current_global_role() IN ('super_admin', 'support_admin', 'sales_admin'));

CREATE POLICY "allow_admin_read_audit"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.current_global_role() IN ('super_admin', 'support_admin', 'read_only'));
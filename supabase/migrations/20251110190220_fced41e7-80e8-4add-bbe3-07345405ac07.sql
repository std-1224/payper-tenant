-- Helper functions to avoid RLS recursion on tenant_users checks
CREATE OR REPLACE FUNCTION public.is_member_of_tenant(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.tenant_users
    where tenant_id = _tenant_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.tenant_users
    where tenant_id = _tenant_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('tenant_owner','tenant_admin')
  );
$$;

-- Rebuild tenant_users policies to remove any self-referencing subqueries
DROP POLICY IF EXISTS "tenant_users_read_own_tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "tenant_admins_manage_own_tenant_users" ON public.tenant_users;

CREATE POLICY "tenant_users_read_own_tenant_users"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (public.is_member_of_tenant(tenant_id));

CREATE POLICY "tenant_admins_manage_own_tenant_users"
ON public.tenant_users
FOR ALL
TO authenticated
USING (public.is_tenant_admin(tenant_id));

-- Ensure global_admins only has the safe, non-recursive SELECT policy
DROP POLICY IF EXISTS "Super admins can delete global admins" ON public.global_admins;
DROP POLICY IF EXISTS "Super admins can insert global admins" ON public.global_admins;
DROP POLICY IF EXISTS "Super admins can update global admins" ON public.global_admins;
DROP POLICY IF EXISTS "Super admins can view all global admins" ON public.global_admins;
DROP POLICY IF EXISTS "allow_select_own_role" ON public.global_admins;
DROP POLICY IF EXISTS "allow_superadmin_manage" ON public.global_admins;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'global_admins' AND policyname = 'Users can view their own global admin record'
  ) THEN
    CREATE POLICY "Users can view their own global admin record"
    ON public.global_admins
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;
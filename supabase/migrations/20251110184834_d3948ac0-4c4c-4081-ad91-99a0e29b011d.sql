-- Fix apps_registry RLS policy to use the safe function
DROP POLICY IF EXISTS "allow_admin_read_apps" ON public.apps_registry;

CREATE POLICY "allow_admin_read_apps"
ON public.apps_registry
FOR SELECT
TO authenticated
USING (
  public.current_global_role() IS NOT NULL
);
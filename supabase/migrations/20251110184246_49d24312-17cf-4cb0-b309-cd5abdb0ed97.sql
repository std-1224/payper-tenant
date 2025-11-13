-- Fix infinite recursion on global_admins policies by removing function-based policies
-- These policies referenced current_global_role(), which queries global_admins and caused recursion

DROP POLICY IF EXISTS "Super admins can view all global admins" ON public.global_admins;
DROP POLICY IF EXISTS "Super admins can insert global admins" ON public.global_admins;
DROP POLICY IF EXISTS "Super admins can update global admins" ON public.global_admins;
DROP POLICY IF EXISTS "Super admins can delete global admins" ON public.global_admins;

-- Keep minimal, safe policy: users can view only their own record
-- (already exists from previous migration). If missing, recreate it:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'global_admins' 
      AND policyname = 'Users can view their own global admin record'
  ) THEN
    CREATE POLICY "Users can view their own global admin record"
    ON public.global_admins
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;
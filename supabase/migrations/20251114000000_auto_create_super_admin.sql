-- Migration: Auto-create super_admin for new users
-- Purpose: Automatically add new users to global_admins table with super_admin role
-- This ensures all registered users can immediately access the superadmin panel

-- ============================================================================
-- APPROACH: Frontend-triggered auto-creation
-- Since we cannot create triggers on auth.users (requires superuser permissions),
-- we'll create a function that the frontend can call after signup
-- ============================================================================

-- Create function to auto-create global admin record
-- This function can be called by the frontend after successful signup
CREATE OR REPLACE FUNCTION public.create_super_admin_for_user(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new user into global_admins with super_admin role
  INSERT INTO public.global_admins (user_id, role, is_active)
  VALUES (user_id_param, 'super_admin', true)
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate entries
END;
$$;

-- Grant execute permission to authenticated users (so they can call it after signup)
GRANT EXECUTE ON FUNCTION public.create_super_admin_for_user(UUID) TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_super_admin_for_user(UUID) IS
'Creates a global_admins record with super_admin role for the specified user.
Should be called by the frontend immediately after user signup.';

-- ============================================================================
-- ALTERNATIVE: Create a helper function that users can call for themselves
-- ============================================================================

-- Create function that allows a user to auto-register as super_admin
-- This is called automatically by the frontend after signup
CREATE OR REPLACE FUNCTION public.register_as_super_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert current user into global_admins with super_admin role
  INSERT INTO public.global_admins (user_id, role, is_active)
  VALUES (auth.uid(), 'super_admin', true)
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate entries
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_as_super_admin() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.register_as_super_admin() IS
'Allows the current authenticated user to register themselves as a super_admin.
Called automatically by the frontend after signup.';

-- ============================================================================
-- USAGE INSTRUCTIONS:
-- ============================================================================
-- After running this migration, update the frontend signup function to call:
--
-- await supabase.rpc('register_as_super_admin')
--
-- This will automatically add the user to global_admins with super_admin role
-- ============================================================================


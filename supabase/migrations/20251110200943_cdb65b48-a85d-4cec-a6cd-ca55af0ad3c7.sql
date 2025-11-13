-- Fix audit logs security: Restrict insertion to secure function only
-- Drop the insecure policy that allows any authenticated user to insert
DROP POLICY IF EXISTS "allow_system_insert_audit" ON public.audit_logs;

-- Create a secure SECURITY DEFINER function for inserting audit logs
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_before_data JSONB DEFAULT NULL,
  p_after_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_actor_role TEXT;
BEGIN
  -- Get the actor's role from global_admins
  SELECT role::text INTO v_actor_role
  FROM public.global_admins
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data
  ) VALUES (
    auth.uid(),
    v_actor_role,
    p_action,
    p_entity_type,
    p_entity_id,
    p_before_data,
    p_after_data
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_audit_log TO authenticated;
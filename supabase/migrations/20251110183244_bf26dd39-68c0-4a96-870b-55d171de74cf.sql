-- Add multi-tenant RLS policies to allow tenant users to access their own tenant's data

-- tenant_contacts: Allow tenant users to read their own tenant's contacts
CREATE POLICY "tenant_users_read_own_contacts"
ON public.tenant_contacts
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- tenant_contacts: Allow tenant admins/owners to manage their own tenant's contacts
CREATE POLICY "tenant_admins_manage_own_contacts"
ON public.tenant_contacts
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    AND role IN ('tenant_owner', 'tenant_admin')
  )
);

-- tenant_users: Allow tenant users to read their own tenant's users
CREATE POLICY "tenant_users_read_own_tenant_users"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- tenant_users: Allow tenant admins/owners to manage their own tenant's users
CREATE POLICY "tenant_admins_manage_own_tenant_users"
ON public.tenant_users
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    AND role IN ('tenant_owner', 'tenant_admin')
  )
);

-- tenant_modules: Allow tenant users to read their own tenant's modules
CREATE POLICY "tenant_users_read_own_modules"
ON public.tenant_modules
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- tenant_modules: Allow tenant owners to manage their own tenant's modules
CREATE POLICY "tenant_owners_manage_own_modules"
ON public.tenant_modules
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    AND role = 'tenant_owner'
  )
);

-- tenant_locations: Allow tenant users to read their own tenant's locations
CREATE POLICY "tenant_users_read_own_locations"
ON public.tenant_locations
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- tenant_locations: Allow tenant admins/owners to manage their own tenant's locations
CREATE POLICY "tenant_admins_manage_own_locations"
ON public.tenant_locations
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    AND role IN ('tenant_owner', 'tenant_admin')
  )
);

-- tenants: Allow tenant users to read their own tenant
CREATE POLICY "tenant_users_read_own_tenant"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- tenants: Allow tenant owners to update their own tenant
CREATE POLICY "tenant_owners_update_own_tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    AND role = 'tenant_owner'
  )
);
-- Create enum for global admin roles
CREATE TYPE public.global_admin_role AS ENUM ('super_admin', 'support_admin', 'sales_admin', 'read_only');

-- Create enum for tenant status
CREATE TYPE public.tenant_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');

-- Create enum for tenant user roles
CREATE TYPE public.tenant_user_role AS ENUM ('tenant_owner', 'tenant_admin', 'tenant_ops', 'tenant_finance', 'tenant_viewer');

-- Create enum for tenant user status
CREATE TYPE public.tenant_user_status AS ENUM ('invited', 'active', 'disabled');

-- Table: global_admins
CREATE TABLE public.global_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role global_admin_role NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  default_currency TEXT DEFAULT 'ARS' NOT NULL,
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
  status tenant_status DEFAULT 'trial' NOT NULL,
  onboarding_step INTEGER DEFAULT 0 NOT NULL,
  notes_internal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: tenant_contacts
CREATE TABLE public.tenant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_label TEXT,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table: tenant_users
CREATE TABLE public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role tenant_user_role NOT NULL,
  status tenant_user_status DEFAULT 'invited' NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Table: apps_registry
CREATE TABLE public.apps_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_core BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table: tenant_modules
CREATE TABLE public.tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  app_id UUID REFERENCES public.apps_registry(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  config JSONB,
  activated_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, app_id)
);

-- Table: tenant_locations
CREATE TABLE public.tenant_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, code)
);

-- Table: audit_logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create helper function to get current user's global role
CREATE OR REPLACE FUNCTION public.current_global_role()
RETURNS global_admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.global_admins 
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1
$$;

-- Enable RLS on all tables
ALTER TABLE public.global_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for global_admins
CREATE POLICY "allow_select_own_role" ON public.global_admins
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "allow_superadmin_manage" ON public.global_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.global_admins 
      WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- RLS Policies for tenants
CREATE POLICY "allow_admin_read_tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.global_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "allow_admin_manage_tenants" ON public.tenants
  FOR ALL USING (
    public.current_global_role() IN ('super_admin', 'sales_admin')
  );

-- RLS Policies for tenant_contacts
CREATE POLICY "allow_admin_read_contacts" ON public.tenant_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.global_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "allow_admin_manage_contacts" ON public.tenant_contacts
  FOR ALL USING (
    public.current_global_role() IN ('super_admin', 'sales_admin', 'support_admin')
  );

-- RLS Policies for tenant_users
CREATE POLICY "allow_admin_read_tenant_users" ON public.tenant_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.global_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "allow_admin_manage_tenant_users" ON public.tenant_users
  FOR ALL USING (
    public.current_global_role() IN ('super_admin', 'sales_admin', 'support_admin')
  );

-- RLS Policies for apps_registry (read-only for all admins)
CREATE POLICY "allow_admin_read_apps" ON public.apps_registry
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.global_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "allow_superadmin_manage_apps" ON public.apps_registry
  FOR ALL USING (
    public.current_global_role() = 'super_admin'
  );

-- RLS Policies for tenant_modules
CREATE POLICY "allow_admin_read_modules" ON public.tenant_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.global_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "allow_admin_manage_modules" ON public.tenant_modules
  FOR ALL USING (
    public.current_global_role() IN ('super_admin', 'sales_admin')
  );

-- RLS Policies for tenant_locations
CREATE POLICY "allow_admin_read_locations" ON public.tenant_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.global_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "allow_admin_manage_locations" ON public.tenant_locations
  FOR ALL USING (
    public.current_global_role() IN ('super_admin', 'sales_admin', 'support_admin')
  );

-- RLS Policies for audit_logs (read-only for super_admin and support_admin)
CREATE POLICY "allow_admin_read_audit" ON public.audit_logs
  FOR SELECT USING (
    public.current_global_role() IN ('super_admin', 'support_admin')
  );

CREATE POLICY "allow_system_insert_audit" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_global_admins_user_id ON public.global_admins(user_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenant_contacts_tenant_id ON public.tenant_contacts(tenant_id);
CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX idx_tenant_modules_tenant_id ON public.tenant_modules(tenant_id);
CREATE INDEX idx_tenant_modules_app_id ON public.tenant_modules(app_id);
CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Seed apps_registry with Payper modules
INSERT INTO public.apps_registry (key, name, description, is_core) VALUES
  ('ticketing', 'EtiqueTERA', 'Sistema de etiquetera y gestión de eventos', true),
  ('tables_orders', 'QR Orders', 'Sistema de pedidos por QR y gestión de mesas', true),
  ('cashless_nfc', 'Cashless NFC', 'Sistema de pagos sin efectivo con NFC', false),
  ('inventory_stock', 'Stock & Inventario', 'Gestión de inventario y stock', false),
  ('recipes', 'Recetas', 'Gestión de recetas y producción', false),
  ('pr_tokens', 'PR Tokens', 'Sistema de tokens para relaciones públicas', false),
  ('qr_analytics', 'QR Analytics', 'Analíticas de escaneos QR', false),
  ('guestlist_events', 'Guest List', 'Gestión de listas de invitados', false),
  ('complimentary_gifts', 'Cortesías', 'Gestión de cortesías y regalos', false);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_global_admins_updated_at BEFORE UPDATE ON public.global_admins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_users_updated_at BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_modules_updated_at BEFORE UPDATE ON public.tenant_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
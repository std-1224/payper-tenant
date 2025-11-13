-- Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_sync timestamptz,
  is_offline boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create venue_bars table
CREATE TABLE IF NOT EXISTS public.venue_bars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stock_items table
CREATE TABLE IF NOT EXISTS public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid REFERENCES public.venue_bars(id) ON DELETE CASCADE NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  min_quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'units',
  updated_at timestamptz DEFAULT now()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create recipe_items table
CREATE TABLE IF NOT EXISTS public.recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient_id uuid NOT NULL,
  ingredient_name text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create venue_users table
CREATE TABLE IF NOT EXISTS public.venue_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  balance numeric NOT NULL DEFAULT 0,
  has_nfc boolean DEFAULT false,
  nfc_card_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  permissions jsonb DEFAULT '{}',
  last_action_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create venue_orders table
CREATE TABLE IF NOT EXISTS public.venue_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.venue_users(id) ON DELETE SET NULL,
  bar_id uuid REFERENCES public.venue_bars(id) ON DELETE SET NULL NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric NOT NULL DEFAULT 0,
  items jsonb DEFAULT '[]',
  prep_time_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create venue_cashflow table
CREATE TABLE IF NOT EXISTS public.venue_cashflow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  bar_id uuid REFERENCES public.venue_bars(id) ON DELETE SET NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  bar_id uuid REFERENCES public.venue_bars(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create qr_codes table for bars/tables
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid REFERENCES public.venue_bars(id) ON DELETE CASCADE NOT NULL,
  table_number text NOT NULL,
  qr_code text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  restrictions jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for global admins
CREATE POLICY "Global admins can manage all venues" ON public.venues
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all venue_bars" ON public.venue_bars
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all stock_items" ON public.stock_items
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all recipes" ON public.recipes
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all recipe_items" ON public.recipe_items
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all venue_users" ON public.venue_users
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all staff" ON public.staff
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all venue_orders" ON public.venue_orders
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all venue_cashflow" ON public.venue_cashflow
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all system_alerts" ON public.system_alerts
FOR ALL USING (is_global_admin());

CREATE POLICY "Global admins can manage all qr_codes" ON public.qr_codes
FOR ALL USING (is_global_admin());

-- Create indexes for better performance
CREATE INDEX idx_venue_bars_venue_id ON public.venue_bars(venue_id);
CREATE INDEX idx_stock_items_bar_id ON public.stock_items(bar_id);
CREATE INDEX idx_recipe_items_recipe_id ON public.recipe_items(recipe_id);
CREATE INDEX idx_venue_users_venue_id ON public.venue_users(venue_id);
CREATE INDEX idx_staff_venue_id ON public.staff(venue_id);
CREATE INDEX idx_venue_orders_venue_id ON public.venue_orders(venue_id);
CREATE INDEX idx_venue_orders_status ON public.venue_orders(status);
CREATE INDEX idx_venue_cashflow_venue_id ON public.venue_cashflow(venue_id);
CREATE INDEX idx_system_alerts_venue_id ON public.system_alerts(venue_id);
CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX idx_qr_codes_bar_id ON public.qr_codes(bar_id);

-- Create triggers for updated_at
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venue_bars_updated_at BEFORE UPDATE ON public.venue_bars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venue_users_updated_at BEFORE UPDATE ON public.venue_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venue_orders_updated_at BEFORE UPDATE ON public.venue_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
global_admins - Superadmin users
tenants - Business clients
tenant_contacts - Contact persons per tenant
tenant_users - Users assigned to tenants
apps_registry - Available Payper modules
tenant_modules - Modules enabled per tenant
tenant_locations - Physical locations per tenant
audit_logs - Change history




{
  name: "Payper Admin",
  slug: "admin-payperapp",
  legal_name: "Payper Admin Services",
  status: "active",
  default_currency: "USD",
  timezone: "America/Argentina/Buenos_Aires"
}


{
  name: "Payper Main",
  slug: "payperapp",
  legal_name: "Payper Main Platform",
  status: "active",
  default_currency: "USD",
  timezone: "America/Argentina/Buenos_Aires"
}


{
  name: "Table Restaurant",
  slug: "table-restaurant",
  legal_name: "Table Restaurant Service",
  status: "active",
  default_currency: "USD",
  timezone: "America/Argentina/Buenos_Aires"
}




-- ============================================================================
-- PAYPER MODULES REGISTRATION
-- ============================================================================

-- Main Module: StockQR (Core Module for Admin Dashboard)
-- This is the parent/main module that contains all admin functionalities
INSERT INTO public.apps_registry (key, name, description, is_core) VALUES
  ('stockqr', 'StockQR', 'Complete admin dashboard for restaurant/venue management', true);
  ('qrmenu', 'QRMENU', 'Customer menu viewing and courtesy account management', true);

-- Sub-functionalities of StockQR (Additional Modules - Not Core)
-- These are the 6 features within the StockQR admin dashboard
INSERT INTO public.apps_registry (key, name, description, is_core) VALUES
  ('stockqr_orders', 'Gestión de Pedidos', 'Order management system - manage and track all orders', false),
  ('stockqr_finances', 'Panel de Finanzas', 'Finance panel - financial reports and analytics', false),
  ('stockqr_roles', 'Administración de Roles', 'Role administration - manage user roles and permissions', false),
  ('stockqr_menu', 'Gestión de Carta', 'Menu management - create and manage menu items', false),
  ('stockqr_qr_tracking', 'Barras & QRs', 'QR tracking - manage bars and QR codes', false),
  ('stockqr_stock', 'Stock & Reasignaciones', 'Stock management and reassignments', false);


Main Module : [https://.payperapp.io/dashboard](https://adminqr.payperapp.io/dashboard) :Stock[QR](https://adminqr.payperapp.io/dashboard)

Sub functionalities of the module: 

- [Gestión de Pedidos](https://admin.payperapp.io/orders)
- [Panel de Finanzas](https://admin.payperapp.io/finances)
- [Administración de Roles](https://admin.payperapp.io/roles)
- [Gestión de Carta](https://admin.payperapp.io/menu)
- [Barras & QRs](https://admin.payperapp.io/qr-tracking)
- [Stock & Reasignaciones](https://admin.payperapp.io/stock)

-- Main Module: Commander (Core Module for Table Restaurant)
-- This is the complete table service system
INSERT INTO public.apps_registry (key, name, description, is_core) VALUES
  ('commander', 'Commander', 'Complete table service and ordering system for restaurants', true);

Main Module : [https://payperapp.io/dashboard] QR Menu

Sub functionalities of the module:

INSERT INTO public.apps_registry (key, name, description, is_core)
VALUES
  ('add_balance', 'Agregar Saldo', 'Add balance functionality - top up account balance', false)



  📋 Explanation of the Structure
Module Keys:
stockqr - Main admin dashboard module (core)
stockqr_orders - Orders sub-functionality (additional)
stockqr_finances - Finances sub-functionality (additional)
stockqr_roles - Roles sub-functionality (additional)
stockqr_menu - Menu sub-functionality (additional)
stockqr_qr_tracking - QR Tracking sub-functionality (additional)
stockqr_stock - Stock sub-functionality (additional)
commander - Table restaurant module (core)
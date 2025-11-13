import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Tenants from "./pages/admin/Tenants";
import TenantDetail from "./pages/admin/TenantDetail";
import CreateTenant from "./pages/admin/CreateTenant";
import Users from "./pages/admin/Users";
import Audit from "./pages/admin/Audit";
import Venues from "./pages/admin/Venues";
import VenueDetail from "./pages/admin/VenueDetail";
import Orders from "./pages/admin/Orders";
import Stock from "./pages/admin/Stock";
import Recipes from "./pages/admin/Recipes";
import Bars from "./pages/admin/Bars";
import VenueUsers from "./pages/admin/VenueUsers";
import Staff from "./pages/admin/Staff";
import Cashflow from "./pages/admin/Cashflow";
import Alerts from "./pages/admin/Alerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="tenants/new" element={<CreateTenant />} />
              <Route path="tenants/:id" element={<TenantDetail />} />
              <Route path="users" element={<Users />} />
              <Route path="audit" element={<Audit />} />
              <Route path="venues" element={<Venues />} />
              <Route path="venues/:id" element={<VenueDetail />} />
              <Route path="orders" element={<Orders />} />
              <Route path="stock" element={<Stock />} />
              <Route path="recipes" element={<Recipes />} />
              <Route path="bars" element={<Bars />} />
              <Route path="venue-users" element={<VenueUsers />} />
              <Route path="staff" element={<Staff />} />
              <Route path="cashflow" element={<Cashflow />} />
              <Route path="alerts" element={<Alerts />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          <Toaster />
          <Sonner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

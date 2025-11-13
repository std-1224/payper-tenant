import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Package, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ModuleChip } from "@/components/ModuleChip";
import { format, subDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  freeTenants: number;
  suspendedTenants: number;
}

interface RecentTenant {
  id: string;
  name: string;
  status: string;
  created_at: string;
  modules: { name: string; is_core: boolean }[];
  contacts: { name: string; email: string }[];
}

interface UserGrowthData {
  date: string;
  usuarios: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    freeTenants: 0,
    suspendedTenants: 0,
  });
  const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("status");

      if (tenantsError) throw tenantsError;

      const stats = {
        totalTenants: tenants?.length || 0,
        activeTenants: tenants?.filter((t) => t.status === "active").length || 0,
        trialTenants: tenants?.filter((t) => t.status === "trial").length || 0,
        freeTenants: tenants?.filter((t) => t.status === "free").length || 0,
        suspendedTenants: tenants?.filter((t) => t.status === "suspended").length || 0,
      };
      setStats(stats);

      // Fetch recent tenants
      const { data: recentData, error: recentError } = await supabase
        .from("tenants")
        .select(`
          id,
          name,
          status,
          created_at,
          tenant_contacts (name, email, is_primary),
          tenant_modules (
            apps_registry (name, is_core)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const formatted = recentData?.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        created_at: tenant.created_at,
        modules: tenant.tenant_modules
          .filter((m: any) => m.apps_registry)
          .map((m: any) => ({
            name: m.apps_registry.name,
            is_core: m.apps_registry.is_core,
          })),
        contacts: tenant.tenant_contacts
          .filter((c: any) => c.is_primary)
          .map((c: any) => ({ name: c.name, email: c.email })),
      })) || [];

      setRecentTenants(formatted);

      // Fetch user growth data (last 30 days)
      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
      const { data: usersData, error: usersError } = await supabase
        .from("tenant_users")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (usersError) throw usersError;

      // Group by date
      const growthMap = new Map<string, number>();
      usersData?.forEach((user) => {
        const dateKey = format(new Date(user.created_at), "dd MMM", { locale: es });
        growthMap.set(dateKey, (growthMap.get(dateKey) || 0) + 1);
      });

      // Convert to array and fill missing dates
      const growthArray: UserGrowthData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateKey = format(date, "dd MMM", { locale: es });
        growthArray.push({
          date: dateKey,
          usuarios: growthMap.get(dateKey) || 0,
        });
      }

      setUserGrowth(growthArray);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Vista general del sistema</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/40 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground/60" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold">{stats.totalTenants}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-success/60" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-success">{stats.activeTenants}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trial</CardTitle>
              <Package className="h-4 w-4 text-warning/60" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-warning">{stats.trialTenants}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Free</CardTitle>
              <Users className="h-4 w-4 text-primary/60" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-primary">{stats.freeTenants}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suspendidos</CardTitle>
              <Users className="h-4 w-4 text-destructive/60" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-destructive">{stats.suspendedTenants}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Crecimiento de Usuarios</CardTitle>
          <p className="text-xs text-muted-foreground">Registros en los últimos 30 días</p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
                />
                <Line
                  type="monotone"
                  dataKey="usuarios"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Comercios Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTenants.length === 0 ? (
              <p className="text-center text-muted-foreground/70 py-12 text-sm">
                No hay comercios registrados aún
              </p>
            ) : (
              recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border border-border/40 rounded-md hover:border-border hover:bg-accent/30 transition-all cursor-pointer gap-3"
                  onClick={() => window.location.href = `/admin/tenants/${tenant.id}`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm truncate">{tenant.name}</h3>
                      <StatusBadge status={tenant.status as any} />
                    </div>
                    {tenant.contacts[0] && (
                      <p className="text-xs text-muted-foreground truncate">
                        {tenant.contacts[0].name} • {tenant.contacts[0].email}
                      </p>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      {tenant.modules.slice(0, 3).map((module, idx) => (
                        <ModuleChip key={idx} name={module.name} isCore={module.is_core} />
                      ))}
                      {tenant.modules.length > 3 && (
                        <span className="text-xs text-muted-foreground/60 self-center">
                          +{tenant.modules.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground sm:ml-4 shrink-0">
                    {format(new Date(tenant.created_at), "d MMM yyyy", { locale: es })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

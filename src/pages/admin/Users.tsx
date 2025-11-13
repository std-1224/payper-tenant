import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus, Mail, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StatusBadge } from "@/components/StatusBadge";

interface UserWithTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
  tenant: {
    name: string;
    slug: string;
  };
}

const Users = () => {
  const [users, setUsers] = useState<UserWithTenant[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithTenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("tenant_users")
        .select(`
          *,
          tenants!inner(name, slug)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = data?.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        tenant_id: item.tenant_id,
        role: item.role,
        status: item.status,
        created_at: item.created_at,
        last_login_at: item.last_login_at,
        tenant: {
          name: item.tenants.name,
          slug: item.tenants.slug,
        },
      })) || [];

      setUsers(formatted);
      setFilteredUsers(formatted);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      tenant_owner: "Propietario",
      tenant_admin: "Administrador",
      tenant_manager: "Manager",
      tenant_user: "Usuario",
      tenant_viewer: "Viewer",
      tenant_ops: "Operaciones",
      tenant_finance: "Finanzas",
    };
    return labels[role] || role;
  };

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status as any} />;
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    invited: users.filter((u) => u.status === "invited").length,
    disabled: users.filter((u) => u.status === "disabled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de usuarios por comercio</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Usuarios</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold text-success">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Invitados</p>
              <p className="text-2xl font-bold text-warning">{stats.invited}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Deshabilitados</p>
              <p className="text-2xl font-bold text-muted-foreground">{stats.disabled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por comercio o ID de usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="invited">Invitados</SelectItem>
            <SelectItem value="disabled">Deshabilitados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="tenant_owner">Propietario</SelectItem>
            <SelectItem value="tenant_admin">Administrador</SelectItem>
            <SelectItem value="tenant_manager">Manager</SelectItem>
            <SelectItem value="tenant_user">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm || statusFilter !== "all" || roleFilter !== "all"
                  ? "No se encontraron usuarios con los filtros aplicados"
                  : "No hay usuarios registrados aún"}
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm font-mono">{user.user_id.substring(0, 8)}...</p>
                      {getStatusBadge(user.status)}
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>{user.tenant.name}</span>
                      <span className="text-xs">({user.tenant.slug})</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Agregado {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}</span>
                      {user.last_login_at && (
                        <>
                          <span>•</span>
                          <span>Último acceso {format(new Date(user.last_login_at), "d MMM yyyy", { locale: es })}</span>
                        </>
                      )}
                    </div>
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

export default Users;
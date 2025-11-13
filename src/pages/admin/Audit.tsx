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
import { Search, Filter, FileText, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_user_id: string | null;
  actor_role: string | null;
  before_data: any;
  after_data: any;
  ip_address: string | null;
  created_at: string;
}

const Audit = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter((log) =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.actor_user_id && log.actor_user_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    if (entityFilter !== "all") {
      filtered = filtered.filter((log) => log.entity_type === entityFilter);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, actionFilter, entityFilter, logs]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      TENANT_CREATED: "Comercio Creado",
      TENANT_UPDATED: "Comercio Actualizado",
      TENANT_DELETED: "Comercio Eliminado",
      USER_INVITED: "Usuario Invitado",
      USER_REMOVED: "Usuario Removido",
      MODULE_ACTIVATED: "Módulo Activado",
      MODULE_DEACTIVATED: "Módulo Desactivado",
      DEMO_DATA_CREATED: "Datos Demo Creados",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATED") || action.includes("ACTIVATED") || action.includes("INVITED")) {
      return "text-success bg-success/10";
    }
    if (action.includes("DELETED") || action.includes("REMOVED") || action.includes("DEACTIVATED")) {
      return "text-destructive bg-destructive/10";
    }
    if (action.includes("UPDATED")) {
      return "text-warning bg-warning/10";
    }
    return "text-muted-foreground bg-muted";
  };

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));
  const uniqueEntities = Array.from(new Set(logs.map((log) => log.entity_type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando registros de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-muted-foreground">
          Registro de cambios y actividad del sistema (últimos 100 eventos)
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Eventos</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tipos de Acción</p>
              <p className="text-2xl font-bold">{uniqueActions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tipos de Entidad</p>
              <p className="text-2xl font-bold">{uniqueEntities.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por acción, entidad o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {getActionLabel(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            {uniqueEntities.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {entity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Eventos ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm || actionFilter !== "all" || entityFilter !== "all"
                  ? "No se encontraron eventos con los filtros aplicados"
                  : "No hay eventos de auditoría registrados"}
              </p>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {log.entity_type}
                        </span>
                        {log.actor_role && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {log.actor_role}
                          </span>
                        )}
                      </div>

                      {log.after_data && (
                        <div className="text-sm text-muted-foreground">
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.after_data, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                        </span>
                        {log.actor_user_id && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.actor_user_id.substring(0, 8)}...
                            </span>
                          </>
                        )}
                        {log.ip_address && (
                          <>
                            <span>•</span>
                            <span>IP: {log.ip_address}</span>
                          </>
                        )}
                      </div>
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

export default Audit;
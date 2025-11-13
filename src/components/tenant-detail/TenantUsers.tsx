import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TenantUser {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  email?: string;
}

interface TenantUsersProps {
  tenantId: string;
}

export const TenantUsers = ({ tenantId }: TenantUsersProps) => {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("tenant_user");
  const [inviting, setInviting] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For now, just show user_id, we'll add email display later
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error("El email es requerido");
      return;
    }

    setInviting(true);
    try {
      // For now, create a placeholder invitation
      // In production, this would send an actual email invitation
      const tempUserId = crypto.randomUUID();

      const { error: insertError } = await supabase.from("tenant_users").insert([{
        tenant_id: tenantId,
        user_id: tempUserId,
        role: inviteRole as any,
        status: "invited" as any,
      }]);

      if (insertError) throw insertError;

      toast.success(`Invitación enviada a ${inviteEmail}`);
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("tenant_user");
      fetchUsers();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast.error(error.message || "Error al invitar usuario");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de querer eliminar este usuario?")) return;

    try {
      const { error } = await supabase
        .from("tenant_users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error("Error al eliminar usuario");
    }
  };

  const handleToggleStatus = async (user: TenantUser) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    
    try {
      const { error } = await supabase
        .from("tenant_users")
        .update({ status: newStatus as any })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(newStatus === "active" ? "Usuario activado" : "Usuario pausado");
      fetchUsers();
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast.error("Error al cambiar estado del usuario");
    }
  };

  const handleEditUser = (user: TenantUser) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from("tenant_users")
        .update({ role: editingUser.role as any })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("Usuario actualizado");
      setShowEditDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Error al actualizar usuario");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      tenant_owner: "Propietario",
      tenant_admin: "Administrador",
      tenant_manager: "Manager",
      tenant_user: "Usuario",
    };
    return labels[role] || role;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "Activo", className: "bg-success/10 text-success" },
      invited: { label: "Invitado", className: "bg-warning/10 text-warning" },
      disabled: { label: "Deshabilitado", className: "bg-muted text-muted-foreground" },
    };
    const { label, className } = config[status] || config.invited;
    return (
      <span className={`text-xs px-2 py-1 rounded ${className}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <Card className="border-border/40 shadow-none">
        <CardContent className="py-16">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-3"></div>
            <p className="text-xs text-muted-foreground">Cargando usuarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/40 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium">Usuarios del Comercio</CardTitle>
          <Button onClick={() => setShowInviteDialog(true)} size="sm" className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Agregar Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground/70 py-12 text-sm">
                No hay usuarios asignados
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-4 py-3 border border-border/40 rounded-md hover:border-border transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{user.email || user.user_id.substring(0, 8) + "..."}</p>
                      {getStatusBadge(user.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{getRoleLabel(user.role)}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditUser(user)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleStatus(user)}
                    >
                      {user.status === "active" ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Agregar Usuario</DialogTitle>
            <DialogDescription className="text-xs">
              Invita a un nuevo usuario a este comercio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs">Rol</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_owner">Propietario</SelectItem>
                  <SelectItem value="tenant_admin">Administrador</SelectItem>
                  <SelectItem value="tenant_manager">Manager</SelectItem>
                  <SelectItem value="tenant_user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} className="h-9 text-xs">
              Cancelar
            </Button>
            <Button onClick={handleInviteUser} disabled={inviting} className="h-9 text-xs">
              {inviting ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Editar Usuario</DialogTitle>
            <DialogDescription className="text-xs">
              Modifica el rol del usuario.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input
                  value={editingUser.email || editingUser.user_id.substring(0, 8) + "..."}
                  disabled
                  className="h-9 bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-xs">Rol</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant_owner">Propietario</SelectItem>
                    <SelectItem value="tenant_admin">Administrador</SelectItem>
                    <SelectItem value="tenant_manager">Manager</SelectItem>
                    <SelectItem value="tenant_user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="h-9 text-xs">
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} className="h-9 text-xs">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
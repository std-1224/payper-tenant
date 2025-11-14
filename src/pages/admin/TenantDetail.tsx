import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Mail, MapPin, Package, Users, Phone, Edit, Pause, Play, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ModuleChip } from "@/components/ModuleChip";
import { format } from "date-fns";
import { TenantUsers } from "@/components/tenant-detail/TenantUsers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  status: string;
  default_currency: string;
  timezone: string;
  notes_internal: string | null;
  created_at: string;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role_label: string | null;
    is_primary: boolean;
  }>;
  modules: Array<{
    id: string;
    enabled: boolean;
    activated_at: string | null;
    app: {
      name: string;
      key: string;
      is_core: boolean;
    };
  }>;
  locations: Array<{
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    status: string;
  }>;
}

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    legal_name: "",
    default_currency: "",
    timezone: "",
    notes_internal: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTenantDetail();
    }
  }, [id]);

  const fetchTenantDetail = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          tenant_contacts:tenant_contacts (*),
          tenant_modules:tenant_modules (
            id,
            enabled,
            activated_at,
            apps_registry (name, key, is_core)
          ),
          tenant_locations:tenant_locations (*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setTenant(null);
        return;
      }

      const formatted: TenantDetail = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        legal_name: data.legal_name,
        status: data.status,
        default_currency: data.default_currency,
        timezone: data.timezone,
        notes_internal: data.notes_internal,
        created_at: data.created_at,
        contacts: data.tenant_contacts || [],
        modules: (data.tenant_modules || []).map((m: any) => ({
          id: m.id,
          enabled: m.enabled,
          activated_at: m.activated_at,
          app: m.apps_registry,
        })),
        locations: data.tenant_locations || [],
      };

      setTenant(formatted);
    } catch (error) {
      console.error("Error fetching tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!tenant) return;
    
    setActionLoading(true);
    try {
      const newStatus = tenant.status === "suspended" ? "active" : "suspended";
      const beforeData = { status: tenant.status };
      
      const { error } = await supabase
        .from("tenants")
        .update({ status: newStatus })
        .eq("id", tenant.id);

      if (error) throw error;

      // Log the action
      await supabase.rpc("insert_audit_log", {
        p_action: newStatus === "suspended" ? "TENANT_SUSPENDED" : "TENANT_ACTIVATED",
        p_entity_type: "tenant",
        p_entity_id: tenant.id,
        p_before_data: beforeData,
        p_after_data: { status: newStatus },
      });

      toast.success(
        newStatus === "suspended"
          ? "Tenant paused successfully"
          : "Tenant activated successfully"
      );
      fetchTenantDetail();
    } catch (error: any) {
      console.error("Error toggling tenant status:", error);
      toast.error("Error changing tenant status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;
    
    setActionLoading(true);
    try {
      const beforeData = {
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      };

      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenant.id);

      if (error) throw error;

      // Log the action
      await supabase.rpc("insert_audit_log", {
        p_action: "TENANT_DELETED",
        p_entity_type: "tenant",
        p_entity_id: tenant.id,
        p_before_data: beforeData,
      });

      toast.success("Tenant deleted successfully");
      navigate("/admin/tenants");
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      toast.error("Error deleting tenant");
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const openEditDialog = () => {
    if (!tenant) return;
    setEditForm({
      name: tenant.name,
      legal_name: tenant.legal_name || "",
      default_currency: tenant.default_currency,
      timezone: tenant.timezone,
      notes_internal: tenant.notes_internal || "",
    });
    setShowEditDialog(true);
  };

  const handleEdit = async () => {
    if (!tenant) return;
    
    setActionLoading(true);
    try {
      const beforeData = {
        name: tenant.name,
        legal_name: tenant.legal_name,
        default_currency: tenant.default_currency,
        timezone: tenant.timezone,
        notes_internal: tenant.notes_internal,
      };

      const { error } = await supabase
        .from("tenants")
        .update({
          name: editForm.name,
          legal_name: editForm.legal_name || null,
          default_currency: editForm.default_currency,
          timezone: editForm.timezone,
          notes_internal: editForm.notes_internal || null,
        })
        .eq("id", tenant.id);

      if (error) throw error;

      // Log the action
      await supabase.rpc("insert_audit_log", {
        p_action: "TENANT_UPDATED",
        p_entity_type: "tenant",
        p_entity_id: tenant.id,
        p_before_data: beforeData,
        p_after_data: editForm,
      });

      toast.success("Tenant updated successfully");
      setShowEditDialog(false);
      fetchTenantDetail();
    } catch (error: any) {
      console.error("Error updating tenant:", error);
      toast.error("Error updating tenant");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading tenant...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tenant not found</p>
        <Button onClick={() => navigate("/admin/tenants")} className="mt-4">
          Back to Tenants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tenants")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
              <StatusBadge status={tenant.status as any} />
            </div>
            <p className="text-muted-foreground mt-1">
              {tenant.slug} • Created {format(new Date(tenant.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openEditDialog}
            disabled={actionLoading}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={actionLoading}
          >
            {tenant.status === "suspended" ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activar
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={actionLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modules</p>
                <p className="text-2xl font-bold">{tenant.modules.filter(m => m.enabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Mail className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold">{tenant.contacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <MapPin className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locations</p>
                <p className="text-2xl font-bold">{tenant.locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Users</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre Comercial</p>
                <p className="text-base font-medium">{tenant.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
                <p className="text-base">{tenant.legal_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slug</p>
                <p className="text-base font-mono text-sm">{tenant.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <StatusBadge status={tenant.status as any} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Moneda</p>
                <p className="text-base">{tenant.default_currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Zona Horaria</p>
                <p className="text-base">{tenant.timezone}</p>
              </div>
              {tenant.notes_internal && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Notas Internas</p>
                  <p className="text-base">{tenant.notes_internal}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.contacts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No contacts registered</p>
                ) : (
                  tenant.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contact.name}</p>
                          {contact.is_primary && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                        {contact.role_label && (
                          <p className="text-sm text-muted-foreground">{contact.role_label}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.modules.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No modules assigned</p>
                ) : (
                  tenant.modules.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <ModuleChip name={module.app.name} isCore={module.app.is_core} />
                        <div>
                          <p className="font-medium">{module.app.name}</p>
                          {module.activated_at && (
                            <p className="text-sm text-muted-foreground">
                              Activated {format(new Date(module.activated_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        {module.enabled ? (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <TenantUsers tenantId={tenant.id} />
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.locations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No locations registered</p>
                ) : (
                  tenant.locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{location.name}</p>
                          {location.code && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                              {location.code}
                            </span>
                          )}
                        </div>
                        {location.address && (
                          <p className="text-sm text-muted-foreground pl-6">{location.address}</p>
                        )}
                        {(location.city || location.country) && (
                          <p className="text-sm text-muted-foreground pl-6">
                            {[location.city, location.country].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={location.status as any} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tenant{" "}
              <strong>{tenant.name}</strong> and all associated data (contacts, modules, locations, users).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Modify the information for tenant {tenant.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre Comercial *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Ej: Mi Negocio SA"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-legal-name">Razón Social</Label>
              <Input
                id="edit-legal-name"
                value={editForm.legal_name}
                onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })}
                placeholder="Ej: Mi Negocio Sociedad Anónima"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-currency">Moneda *</Label>
                <Input
                  id="edit-currency"
                  value={editForm.default_currency}
                  onChange={(e) => setEditForm({ ...editForm, default_currency: e.target.value })}
                  placeholder="ARS"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-timezone">Zona Horaria *</Label>
                <Input
                  id="edit-timezone"
                  value={editForm.timezone}
                  onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                  placeholder="America/Argentina/Buenos_Aires"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notas Internas</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes_internal}
                onChange={(e) => setEditForm({ ...editForm, notes_internal: e.target.value })}
                placeholder="Notas para uso interno..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={actionLoading || !editForm.name}>
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantDetail;
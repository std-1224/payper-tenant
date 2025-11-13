import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import {
  BasicInfoFormData,
  ContactFormData,
  InviteUserFormData,
  basicInfoSchema,
} from "@/lib/validations/tenant";
import { BasicInfoStep } from "@/components/create-tenant/BasicInfoStep";
import { ContactsStep } from "@/components/create-tenant/ContactsStep";
import { ModulesStep } from "@/components/create-tenant/ModulesStep";
import { InviteUserStep } from "@/components/create-tenant/InviteUserStep";

interface Contact extends ContactFormData {
  id: string;
}

const STEPS = [
  { id: 1, title: "Datos Básicos" },
  { id: 2, title: "Contactos" },
  { id: 3, title: "Módulos" },
  { id: 4, title: "Invitar Usuario" },
];

const CreateTenant = () => {
  const navigate = useNavigate();
  const { user, globalAdmin } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [inviteData, setInviteData] = useState<Partial<InviteUserFormData> | null>({
    email: "",
    role: "tenant_owner",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: "",
      legal_name: "",
      slug: "",
      default_currency: "ARS",
      timezone: "America/Argentina/Buenos_Aires",
      status: "trial",
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const nextStep = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createTenant = async (data: BasicInfoFormData) => {
    setIsSubmitting(true);
    try {
      // 1. Check if slug exists
      const { data: existingTenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", data.slug)
        .maybeSingle();

      if (existingTenant) {
        toast.error("El slug ya está en uso. Por favor elige otro.");
        setCurrentStep(1);
        return;
      }

      // 2. Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: data.name,
          legal_name: data.legal_name || null,
          slug: data.slug,
          default_currency: data.default_currency,
          timezone: data.timezone,
          status: data.status,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 3. Create contacts
      if (contacts.length > 0) {
        const { error: contactsError } = await supabase.from("tenant_contacts").insert(
          contacts.map((c) => ({
            tenant_id: tenant.id,
            name: c.name,
            email: c.email,
            phone: c.phone || null,
            role_label: c.role_label || null,
            is_primary: c.is_primary,
          }))
        );

        if (contactsError) throw contactsError;
      }

      // 4. Activate modules
      if (selectedModules.length > 0) {
        const { error: modulesError } = await supabase.from("tenant_modules").insert(
          selectedModules.map((moduleId) => ({
            tenant_id: tenant.id,
            app_id: moduleId,
            enabled: true,
            activated_at: new Date().toISOString(),
            created_by: user?.id,
          }))
        );

        if (modulesError) throw modulesError;
      }

      // 5. Invite user (if provided)
      if (inviteData?.email) {
        // Note: En producción, aquí se enviaría un email de invitación
        // Por ahora solo creamos el registro con status 'invited'
        const { error: userError } = await supabase.from("tenant_users").insert({
          tenant_id: tenant.id,
          user_id: user!.id, // Temporal - en producción se asignaría al aceptar la invitación
          role: inviteData.role as any,
          status: "invited",
        });

        if (userError && userError.code !== "23505") {
          // Ignore duplicate errors
          console.error("User invite error:", userError);
        }
      }

      // 6. Create audit log using secure function
      await supabase.rpc("insert_audit_log", {
        p_action: "TENANT_CREATED",
        p_entity_type: "tenant",
        p_entity_id: tenant.id,
        p_after_data: {
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          modules_count: selectedModules.length,
          contacts_count: contacts.length,
        },
      });

      toast.success("Comercio creado exitosamente");
      navigate(`/admin/tenants/${tenant.id}`);
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      toast.error(error.message || "Error al crear el comercio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = form.handleSubmit(createTenant);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tenants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Comercio</h1>
          <p className="text-muted-foreground">
            Paso {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].title}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm">
          {STEPS.map((step) => (
            <span
              key={step.id}
              className={
                step.id <= currentStep
                  ? "font-medium text-primary"
                  : "text-muted-foreground"
              }
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && <BasicInfoStep form={form} />}
          {currentStep === 2 && (
            <ContactsStep contacts={contacts} setContacts={setContacts} />
          )}
          {currentStep === 3 && (
            <ModulesStep
              selectedModules={selectedModules}
              setSelectedModules={setSelectedModules}
            />
          )}
          {currentStep === 4 && (
            <InviteUserStep inviteData={inviteData} setInviteData={setInviteData} />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={nextStep} disabled={isSubmitting}>
            Siguiente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              "Creando..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Crear Comercio
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreateTenant;

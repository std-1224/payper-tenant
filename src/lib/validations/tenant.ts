import { z } from "zod";

export const basicInfoSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  legal_name: z.string().max(200).optional(),
  slug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  default_currency: z.string().default("ARS"),
  timezone: z.string().default("America/Argentina/Buenos_Aires"),
  status: z.enum(["trial", "active", "suspended", "cancelled"]).default("trial"),
});

export const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  phone: z.string().max(20).optional(),
  role_label: z.string().max(50).optional(),
  is_primary: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  role: z.enum(["tenant_owner", "tenant_admin", "tenant_ops", "tenant_finance", "tenant_viewer"]),
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type InviteUserFormData = z.infer<typeof inviteUserSchema>;

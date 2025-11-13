import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BasicInfoFormData } from "@/lib/validations/tenant";

interface BasicInfoStepProps {
  form: UseFormReturn<BasicInfoFormData>;
}

export const BasicInfoStep = ({ form }: BasicInfoStepProps) => {
  const { register, formState: { errors }, setValue, watch } = form;
  const name = watch("name");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const slug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", slug);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">Primary tenant information</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Business Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            onChange={(e) => {
              register("name").onChange(e);
              handleNameChange(e);
            }}
            placeholder="e.g: Bar Palermo"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            {...register("slug")}
            placeholder="bar-palermo"
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Used in URLs and integrations. Only lowercase, numbers and hyphens.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="legal_name">Legal Name</Label>
          <Input
            id="legal_name"
            {...register("legal_name")}
            placeholder="Bar Palermo Inc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="default_currency">Currency</Label>
            <Select
              defaultValue="ARS"
              onValueChange={(value) => setValue("default_currency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS - Argentine Peso</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select
              defaultValue="trial"
              onValueChange={(value: any) => setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            defaultValue="America/Argentina/Buenos_Aires"
            onValueChange={(value) => setValue("timezone", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
              <SelectItem value="America/Argentina/Cordoba">Cordoba (GMT-3)</SelectItem>
              <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
              <SelectItem value="America/Santiago">Santiago (GMT-3)</SelectItem>
              <SelectItem value="America/Montevideo">Montevideo (GMT-3)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

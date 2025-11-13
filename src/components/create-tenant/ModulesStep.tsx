import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  key: string;
  name: string;
  description: string;
  is_core: boolean;
}

interface ModulesStepProps {
  selectedModules: string[];
  setSelectedModules: (modules: string[]) => void;
}

export const ModulesStep = ({ selectedModules, setSelectedModules }: ModulesStepProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from("apps_registry")
        .select("*")
        .order("is_core", { ascending: false })
        .order("name");

      if (error) throw error;
      setModules(data || []);

      // Auto-select core modules
      const coreModuleIds = data?.filter((m) => m.is_core).map((m) => m.id) || [];
      setSelectedModules(coreModuleIds);
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(selectedModules.filter((id) => id !== moduleId));
    } else {
      setSelectedModules([...selectedModules, moduleId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando módulos...</p>
        </div>
      </div>
    );
  }

  const coreModules = modules.filter((m) => m.is_core);
  const optionalModules = modules.filter((m) => !m.is_core);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Módulos</h2>
        <p className="text-muted-foreground">
          Selecciona los módulos de Payper que este comercio podrá usar
        </p>
      </div>

      {/* Core Modules */}
      {coreModules.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Módulos Base</h3>
            <Badge variant="default" className="text-xs">Core</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Módulos principales recomendados para todos los comercios
          </p>
          <div className="grid gap-3">
            {coreModules.map((module) => (
              <Card key={module.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={module.id}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => toggleModule(module.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={module.id}
                      className="text-base font-medium cursor-pointer"
                    >
                      {module.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Optional Modules */}
      {optionalModules.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Módulos Adicionales</h3>
          <p className="text-sm text-muted-foreground">
            Funcionalidades opcionales según las necesidades del comercio
          </p>
          <div className="grid gap-3">
            {optionalModules.map((module) => (
              <Card key={module.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={module.id}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => toggleModule(module.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={module.id}
                      className="text-base font-medium cursor-pointer"
                    >
                      {module.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="bg-accent/50 p-4 rounded-lg">
        <p className="text-sm font-medium">
          {selectedModules.length} módulo{selectedModules.length !== 1 ? "s" : ""}{" "}
          seleccionado{selectedModules.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

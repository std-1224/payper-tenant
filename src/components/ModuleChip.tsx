import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ModuleChipProps {
  name: string;
  isCore?: boolean;
  className?: string;
}

export const ModuleChip = ({ name, isCore, className }: ModuleChipProps) => {
  return (
    <Badge 
      variant={isCore ? "default" : "secondary"} 
      className={cn("text-xs", className)}
    >
      {name}
    </Badge>
  );
};

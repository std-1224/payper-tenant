import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { InviteUserFormData } from "@/lib/validations/tenant";

interface InviteUserStepProps {
  inviteData: Partial<InviteUserFormData> | null;
  setInviteData: (data: Partial<InviteUserFormData> | null) => void;
}

const roleLabels = {
  tenant_owner: "Owner - Full access",
  tenant_admin: "Admin - Complete management",
  tenant_ops: "Operations - Daily usage",
  tenant_finance: "Finance - Reports and data",
  tenant_viewer: "Viewer - Read only",
};

export const InviteUserStep = ({ inviteData, setInviteData }: InviteUserStepProps) => {
  const [skipInvite, setSkipInvite] = useState(inviteData === null);

  const handleSkipChange = (checked: boolean) => {
    setSkipInvite(checked);
    if (checked) {
      setInviteData(null);
    } else {
      setInviteData({ email: "", role: "tenant_owner" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Invite User (Optional)</h2>
        <p className="text-muted-foreground">
          Invite the user who will manage this tenant. You can add more users later.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="skip_invite"
          checked={skipInvite}
          onCheckedChange={handleSkipChange}
        />
        <Label htmlFor="skip_invite" className="text-sm font-normal cursor-pointer">
          Skip this step (add users later)
        </Label>
      </div>

      {!skipInvite && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite_email">
              User Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invite_email"
              type="email"
              value={inviteData?.email || ""}
              onChange={(e) =>
                setInviteData({ ...inviteData, email: e.target.value })
              }
              placeholder="admin@company.com"
            />
            <p className="text-xs text-muted-foreground">
              An invitation email will be sent to this address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite_role">User Role</Label>
            <Select
              value={inviteData?.role || "tenant_owner"}
              onValueChange={(value: any) =>
                setInviteData({ ...inviteData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-accent/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Permissions by role:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Owner:</strong> Complete tenant control</li>
              <li>• <strong>Admin:</strong> User and configuration management</li>
              <li>• <strong>Operations:</strong> Daily use of active modules</li>
              <li>• <strong>Finance:</strong> Access to reports and financial data</li>
              <li>• <strong>Viewer:</strong> View information only</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

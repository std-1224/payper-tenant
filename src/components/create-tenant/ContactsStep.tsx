import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, User } from "lucide-react";
import { ContactFormData } from "@/lib/validations/tenant";

interface Contact extends ContactFormData {
  id: string;
}

interface ContactsStepProps {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
}

export const ContactsStep = ({ contacts, setContacts }: ContactsStepProps) => {
  const [newContact, setNewContact] = useState<Partial<ContactFormData>>({
    name: "",
    email: "",
    phone: "",
    role_label: "",
    is_primary: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateContact = (contact: Partial<ContactFormData>): boolean => {
    const newErrors: Record<string, string> = {};

    if (!contact.name || contact.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      newErrors.email = "Invalid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addContact = () => {
    if (!validateContact(newContact)) return;

    const contact: Contact = {
      id: Math.random().toString(36).substr(2, 9),
      name: newContact.name!,
      email: newContact.email!,
      phone: newContact.phone,
      role_label: newContact.role_label,
      is_primary: newContact.is_primary || false,
    };

    // If this is primary, remove primary from others
    const updatedContacts = newContact.is_primary
      ? contacts.map((c) => ({ ...c, is_primary: false }))
      : contacts;

    setContacts([...updatedContacts, contact]);
    setNewContact({
      name: "",
      email: "",
      phone: "",
      role_label: "",
      is_primary: false,
    });
    setErrors({});
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const togglePrimary = (id: string) => {
    setContacts(
      contacts.map((c) => ({
        ...c,
        is_primary: c.id === id,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Contacts</h2>
        <p className="text-muted-foreground">
          Add tenant contact persons. At least one contact is recommended.
        </p>
      </div>

      {/* Added contacts list */}
      {contacts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Added Contacts ({contacts.length})</h3>
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contact.name}</p>
                      {contact.is_primary && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                    {contact.phone && (
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    )}
                    {contact.role_label && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {contact.role_label}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePrimary(contact.id)}
                    disabled={contact.is_primary}
                  >
                    Mark as Primary
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form to add new contact */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Add New Contact</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact_name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="john@company.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone</Label>
              <Input
                id="contact_phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+1 555 1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_role">Role/Position</Label>
              <Input
                id="contact_role"
                value={newContact.role_label}
                onChange={(e) =>
                  setNewContact({ ...newContact, role_label: e.target.value })
                }
                placeholder="e.g: Owner, Manager, etc."
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={newContact.is_primary}
              onCheckedChange={(checked) =>
                setNewContact({ ...newContact, is_primary: checked as boolean })
              }
            />
            <Label htmlFor="is_primary" className="text-sm font-normal cursor-pointer">
              Mark as primary contact
            </Label>
          </div>

          <Button type="button" onClick={addContact} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </Card>
    </div>
  );
};

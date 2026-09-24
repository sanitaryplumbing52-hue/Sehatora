import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Mail, MessageCircle, Plus, ShieldCheck, Sliders, UserCog } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { api } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";

const SECTIONS = [
  { key: "profile", label: "Profile", icon: UserCog },
  { key: "roles", label: "Roles & Permissions", icon: ShieldCheck },
  { key: "custom-fields", label: "Custom Fields", icon: Sliders },
  { key: "integrations", label: "Integrations", icon: Mail },
];

export function SettingsPage() {
  const [section, setSection] = useState("profile");

  return (
    <div className="flex flex-col md:flex-row">
      <nav className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border dark:border-border-dark px-4 md:px-3 py-4 flex md:flex-col gap-1 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={clsx(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-left",
              section === s.key ? "bg-primary-light text-primary dark:bg-primary/20 dark:text-blue-300" : "text-muted hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <s.icon size={16} /> {s.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 p-4 md:p-6">
        {section === "profile" && <ProfileSection />}
        {section === "roles" && <RolesSection />}
        {section === "custom-fields" && <CustomFieldsSection />}
        {section === "integrations" && <IntegrationsSection />}
      </div>
    </div>
  );
}

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
    job_title: user?.job_title ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await api.patch("/auth/me/", form);
      setUser(response.data);
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First name">
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </FormField>
          <FormField label="Last name">
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Job title">
          <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
        </FormField>
        <FormField label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>
        <Button onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}

function RolesSection() {
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/auth/roles/").then((r) => r.data.results as { id: string; name: string; permissions: Record<string, string[]> }[]),
  });

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {roles?.map((role) => (
        <Card key={role.id}>
          <CardHeader>
            <CardTitle>{role.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {Object.entries(role.permissions).map(([module, actions]) => (
              <div key={module} className="min-w-[140px]">
                <p className="text-xs font-medium text-muted capitalize mb-1">{module}</p>
                <div className="flex flex-wrap gap-1">
                  {actions.length ? actions.map((a) => <Badge key={a}>{a}</Badge>) : <span className="text-xs text-muted">No access</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CustomFieldsSection() {
  const qc = useQueryClient();
  const { data: fields } = useQuery({
    queryKey: ["custom-fields"],
    queryFn: () => api.get("/custom-fields/", { params: { page_size: 100 } }).then((r) => r.data.results),
  });
  const [entity, setEntity] = useState("contact");
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");

  const createField = useMutation({
    mutationFn: () =>
      api.post("/custom-fields/", {
        entity,
        label,
        key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        field_type: fieldType,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-fields"] });
      setLabel("");
      toast.success("Custom field created");
    },
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add custom field</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <FormField label="Entity">
            <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="w-36">
              {["contact", "company", "lead", "deal", "ticket"].map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Label">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Insurance Provider" />
          </FormField>
          <FormField label="Type">
            <Select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="w-40">
              {["text", "long_text", "number", "email", "phone", "date", "dropdown", "multiselect", "checkbox", "currency", "url"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <Button onClick={() => createField.mutate()} loading={createField.isPending} disabled={!label}>
            <Plus size={16} /> Add field
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing custom fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields?.length ? (
            fields.map((f: { id: string; label: string; entity: string; field_type: string }) => (
              <div key={f.id} className="flex items-center justify-between text-sm border-b border-border dark:border-border-dark last:border-0 py-2">
                <span className="text-ink dark:text-slate-100">{f.label}</span>
                <div className="flex gap-2">
                  <Badge tone="muted">{f.entity}</Badge>
                  <Badge>{f.field_type}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No custom fields yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationsSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
      <Card>
        <CardContent className="flex items-start gap-3 pt-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink dark:text-slate-100">Email (SMTP/IMAP)</p>
            <p className="mt-1 text-xs text-muted">
              Configured via environment variables (EMAIL_HOST, EMAIL_HOST_USER, ...). Works out of the box with the
              console backend in development.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-start gap-3 pt-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary shrink-0">
            <MessageCircle size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink dark:text-slate-100">WhatsApp</p>
            <p className="mt-1 text-xs text-muted">
              Modular provider adapter (Phase 2) -- connects to WhatsApp Cloud API or a BSP without code changes.
              Runs without credentials in development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

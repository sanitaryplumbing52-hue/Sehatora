import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useCreateContact } from "@/hooks/useContacts";
import type { Contact } from "@/types";

const LEAD_SOURCES = ["website", "google", "facebook", "instagram", "linkedin", "email", "whatsapp", "referral", "direct", "other"];

export function ContactFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createContact = useCreateContact();
  const [form, setForm] = useState<Partial<Contact>>({ lead_source: "website" });

  function set<K extends keyof Contact>(key: K, value: Contact[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    await createContact.mutateAsync(form);
    setForm({ lead_source: "website" });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Contact"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={createContact.isPending} disabled={!form.first_name}>
            Create Contact
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First name">
          <Input value={form.first_name ?? ""} onChange={(e) => set("first_name", e.target.value)} />
        </FormField>
        <FormField label="Last name">
          <Input value={form.last_name ?? ""} onChange={(e) => set("last_name", e.target.value)} />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </FormField>
        <FormField label="Phone">
          <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </FormField>
        <FormField label="Job title">
          <Input value={form.job_title ?? ""} onChange={(e) => set("job_title", e.target.value)} />
        </FormField>
        <FormField label="Lead source">
          <Select value={form.lead_source} onChange={(e) => set("lead_source", e.target.value)}>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
    </Modal>
  );
}

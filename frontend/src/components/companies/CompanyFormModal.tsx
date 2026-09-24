import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useCreateCompany } from "@/hooks/useCompanies";
import type { Company } from "@/types";

export function CompanyFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createCompany = useCreateCompany();
  const [form, setForm] = useState<Partial<Company>>({});

  function set<K extends keyof Company>(key: K, value: Company[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    await createCompany.mutateAsync(form);
    setForm({});
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Company"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={createCompany.isPending} disabled={!form.name}>
            Create Company
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Company name">
          <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </FormField>
        <FormField label="Website">
          <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
        </FormField>
        <FormField label="Industry">
          <Input value={form.industry ?? ""} onChange={(e) => set("industry", e.target.value)} />
        </FormField>
        <FormField label="Phone">
          <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </FormField>
        <FormField label="Country">
          <Input value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useContacts } from "@/hooks/useContacts";
import { useCreateLead } from "@/hooks/useLeads";

export function LeadFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createLead = useCreateLead();
  const { data: contacts } = useContacts({ page_size: 100 });
  const [contactId, setContactId] = useState("");
  const [source, setSource] = useState("website");

  async function handleSubmit() {
    await createLead.mutateAsync({ contact: contactId, source });
    setContactId("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Lead"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={createLead.isPending} disabled={!contactId}>
            Create Lead
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Contact">
          <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">Select a contact</option>
            {contacts?.results.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} {c.company_name ? `(${c.company_name})` : ""}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Source">
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            {["website", "google", "facebook", "instagram", "linkedin", "email", "whatsapp", "referral", "direct", "other"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
        </FormField>
      </div>
    </Modal>
  );
}

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useCreateDeal } from "@/hooks/useDeals";
import { useContacts } from "@/hooks/useContacts";
import type { Pipeline } from "@/types";

export function DealFormModal({
  open,
  onClose,
  pipelines,
  defaultPipelineId,
}: {
  open: boolean;
  onClose: () => void;
  pipelines: Pipeline[];
  defaultPipelineId?: string;
}) {
  const createDeal = useCreateDeal();
  const { data: contacts } = useContacts({ page_size: 100 });
  const [name, setName] = useState("");
  const [pipelineId, setPipelineId] = useState(defaultPipelineId ?? pipelines[0]?.id ?? "");
  const [contactId, setContactId] = useState("");
  const [amount, setAmount] = useState("");

  const pipeline = pipelines.find((p) => p.id === pipelineId);
  const firstStage = pipeline?.stages[0];

  async function handleSubmit() {
    if (!firstStage) return;
    await createDeal.mutateAsync({
      name,
      pipeline: pipelineId,
      stage: firstStage.id,
      contact: contactId || undefined,
      amount: amount || "0",
    });
    setName("");
    setAmount("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Deal"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={createDeal.isPending} disabled={!name || !pipelineId}>
            Create Deal
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Deal name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp - Annual Plan" />
        </FormField>
        <FormField label="Pipeline">
          <Select value={pipelineId} onChange={(e) => setPipelineId(e.target.value)}>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Contact">
          <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">No contact</option>
            {contacts?.results.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Amount">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </FormField>
      </div>
    </Modal>
  );
}

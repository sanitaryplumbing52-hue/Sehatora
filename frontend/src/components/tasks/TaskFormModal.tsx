import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useCreateTask } from "@/hooks/useTasks";
import type { Task } from "@/types";

export function TaskFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createTask = useCreateTask();
  const [form, setForm] = useState<Partial<Task>>({ priority: "medium", task_type: "task" });

  function set<K extends keyof Task>(key: K, value: Task[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    await createTask.mutateAsync(form);
    setForm({ priority: "medium", task_type: "task" });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Task"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={createTask.isPending} disabled={!form.name}>
            Create Task
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Task name">
          <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type">
            <Select value={form.task_type} onChange={(e) => set("task_type", e.target.value)}>
              {["task", "call", "email", "meeting"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority">
            <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {["low", "medium", "high"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Due date">
          <Input type="datetime-local" onChange={(e) => set("due_date", e.target.value ? new Date(e.target.value).toISOString() : null)} />
        </FormField>
      </div>
    </Modal>
  );
}

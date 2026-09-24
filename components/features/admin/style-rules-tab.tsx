"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface StyleRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
}

export function StyleRulesTab() {
  const { toast } = useToast();
  const [rules, setRules] = useState<StyleRule[]>([]);
  const [form, setForm] = useState({ name: "", description: "", conditions: "{}", actions: "{}" });

  function reload() {
    fetch("/api/admin/style-rules")
      .then((r) => r.json())
      .then((json) => setRules(json.rules ?? []));
  }

  useEffect(reload, []);

  async function createRule() {
    try {
      const res = await fetch("/api/admin/style-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          conditions: JSON.parse(form.conditions),
          actions: JSON.parse(form.actions),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setForm({ name: "", description: "", conditions: "{}", actions: "{}" });
      reload();
      toast({ title: "Rule created" });
    } catch (err) {
      toast({ title: "Invalid rule", description: err instanceof Error ? err.message : "Check JSON syntax.", variant: "destructive" });
    }
  }

  async function toggleActive(rule: StyleRule) {
    await fetch(`/api/admin/style-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    reload();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Rule name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Textarea
            placeholder='Conditions JSON, e.g. {"occasion": "Business Meeting"}'
            value={form.conditions}
            onChange={(e) => setForm({ ...form, conditions: e.target.value })}
          />
          <Textarea
            placeholder='Actions JSON, e.g. {"preferCategories": ["shirt", "blazer"]}'
            value={form.actions}
            onChange={(e) => setForm({ ...form, actions: e.target.value })}
          />
        </div>
        <Button onClick={createRule}>Add rule</Button>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-medium">{rule.name}</p>
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={rule.isActive ? "success" : "outline"}>{rule.isActive ? "Active" : "Inactive"}</Badge>
              <Button size="sm" variant="outline" onClick={() => toggleActive(rule)}>
                {rule.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

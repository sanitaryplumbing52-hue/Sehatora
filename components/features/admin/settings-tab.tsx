"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Setting {
  key: string;
  value: unknown;
}

export function SettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState({ key: "", value: "{}" });

  function reload() {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((json) => {
        setSettings(json.settings ?? []);
        const d: Record<string, string> = {};
        for (const s of json.settings ?? []) d[s.key] = JSON.stringify(s.value, null, 2);
        setDrafts(d);
      });
  }

  useEffect(reload, []);

  async function save(key: string) {
    try {
      const value = JSON.parse(drafts[key] ?? "{}");
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: `${key} updated` });
      reload();
    } catch (err) {
      toast({ title: "Invalid JSON", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
  }

  async function createSetting() {
    try {
      const value = JSON.parse(newKey.value);
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.key, value }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setNewKey({ key: "", value: "{}" });
      reload();
    } catch (err) {
      toast({ title: "Invalid JSON", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Controls AI provider selection, recommendation limits, and prompts — no code changes required.
      </p>
      <div className="space-y-4">
        {settings.map((s) => (
          <div key={s.key} className="rounded-xl border border-border p-4">
            <p className="mb-2 font-mono text-sm font-medium">{s.key}</p>
            <Textarea
              value={drafts[s.key] ?? ""}
              onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
              className="font-mono text-xs"
            />
            <Button size="sm" className="mt-2" onClick={() => save(s.key)}>
              Save
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="mb-2 text-sm font-medium">Add new setting</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <Input placeholder="key" value={newKey.key} onChange={(e) => setNewKey({ ...newKey, key: e.target.value })} />
          <Input placeholder='value JSON, e.g. {"active":"demo"}' value={newKey.value} onChange={(e) => setNewKey({ ...newKey, value: e.target.value })} />
          <Button onClick={createSetting}>Add</Button>
        </div>
      </div>
    </div>
  );
}

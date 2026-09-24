"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ColorRow {
  id: string;
  name: string;
  hex: string;
  family: string;
  undertone: string;
  isNeutral: boolean;
}

export function ColorsTab() {
  const { toast } = useToast();
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [form, setForm] = useState({ name: "", hex: "#000000", family: "", undertone: "NEUTRAL" });

  function reload() {
    fetch("/api/admin/colors")
      .then((r) => r.json())
      .then((json) => setColors(json.colors ?? []));
  }

  useEffect(reload, []);

  async function createColor() {
    if (!form.name || !form.family) {
      toast({ title: "Name and family are required" });
      return;
    }
    const res = await fetch("/api/admin/colors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", hex: "#000000", family: "", undertone: "NEUTRAL" });
      reload();
      toast({ title: "Color created" });
    } else {
      toast({ title: "Couldn't create color", description: (await res.json()).error, variant: "destructive" });
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/colors/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-5">
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input type="color" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} className="h-11" />
        <Input placeholder="Family (blue, green...)" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} />
        <Select value={form.undertone} onValueChange={(v) => setForm({ ...form, undertone: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WARM">Warm</SelectItem>
            <SelectItem value="COOL">Cool</SelectItem>
            <SelectItem value="NEUTRAL">Neutral</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={createColor}>Add color</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {colors.map((c) => (
          <div key={c.id} className="flex flex-col items-center gap-2 rounded-xl border border-border p-3">
            <span className="h-10 w-10 rounded-full border border-black/5" style={{ backgroundColor: c.hex }} />
            <span className="text-xs font-medium">{c.name}</span>
            <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

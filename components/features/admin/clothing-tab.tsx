"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Option {
  id: string;
  name: string;
}

interface ClothingItem {
  id: string;
  name: string;
  isActive: boolean;
  category: { name: string };
  color: { name: string } | null;
  brand: { name: string } | null;
}

export function ClothingTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [colors, setColors] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [form, setForm] = useState({ name: "", categoryId: "", colorId: "", brandId: "" });

  function reload() {
    fetch("/api/admin/clothing-items")
      .then((r) => r.json())
      .then((json) => setItems(json.items ?? []));
  }

  useEffect(() => {
    reload();
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((json) => {
        setCategories(json.categories ?? []);
        setColors(json.colors ?? []);
        setBrands(json.brands ?? []);
      });
  }, []);

  async function createItem() {
    if (!form.name || !form.categoryId) {
      toast({ title: "Name and category are required" });
      return;
    }
    const res = await fetch("/api/admin/clothing-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        categoryId: form.categoryId,
        colorId: form.colorId || undefined,
        brandId: form.brandId || undefined,
      }),
    });
    if (res.ok) {
      setForm({ name: "", categoryId: "", colorId: "", brandId: "" });
      reload();
      toast({ title: "Item created" });
    }
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/clothing-items/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-5">
        <Input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={form.colorId} onValueChange={(v) => setForm({ ...form, colorId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            {colors.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={createItem}>Add item</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Color</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.category.name}</td>
                <td className="p-3">{item.color?.name ?? "—"}</td>
                <td className="p-3">{item.brand?.name ?? "—"}</td>
                <td className="p-3">
                  <Badge variant={item.isActive ? "success" : "outline"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="p-3 text-right">
                  {item.isActive && (
                    <Button size="sm" variant="outline" onClick={() => deactivate(item.id)}>
                      Deactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

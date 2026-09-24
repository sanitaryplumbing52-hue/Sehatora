"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyAED } from "@/lib/utils";

interface Option {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: number | null;
  inStock: boolean;
  brand: { name: string } | null;
  category: { name: string };
}

export function ProductsTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [form, setForm] = useState({ name: "", categoryId: "", brandId: "", price: "", imageUrl: "", affiliateUrl: "" });

  function reload() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((json) => setProducts(json.products ?? []));
  }

  useEffect(() => {
    reload();
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((json) => {
        setCategories(json.categories ?? []);
        setBrands(json.brands ?? []);
      });
  }, []);

  async function createProduct() {
    if (!form.name || !form.categoryId) {
      toast({ title: "Name and category are required" });
      return;
    }
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        categoryId: form.categoryId,
        brandId: form.brandId || undefined,
        price: form.price ? Number(form.price) : undefined,
        imageUrl: form.imageUrl || undefined,
        affiliateUrl: form.affiliateUrl || undefined,
      }),
    });
    if (res.ok) {
      setForm({ name: "", categoryId: "", brandId: "", price: "", imageUrl: "", affiliateUrl: "" });
      reload();
      toast({ title: "Product added" });
    } else {
      toast({ title: "Couldn't add product", description: (await res.json()).error, variant: "destructive" });
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-3">
        <Input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
        <Input placeholder="Price (AED)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <Input placeholder="Affiliate URL" value={form.affiliateUrl} onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })} />
        <Button onClick={createProduct} className="sm:col-span-3">
          Add product
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Price</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.category.name}</td>
                <td className="p-3">{p.brand?.name ?? "—"}</td>
                <td className="p-3">{p.price ? formatCurrencyAED(p.price) : "—"}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => remove(p.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

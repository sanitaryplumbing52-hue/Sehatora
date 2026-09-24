"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BUDGET_TIERS } from "@/lib/constants";
import { formatCurrencyAED } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  affiliateUrl: string | null;
  rating: number | null;
  brand: { name: string } | null;
  category: { name: string };
}

export function ShoppingView() {
  const [budgetMax, setBudgetMax] = useState<number | undefined>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (budgetMax) params.set("budgetMax", String(budgetMax));
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => setProducts(json.products ?? []))
      .finally(() => setLoading(false));
  }, [budgetMax]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <Button size="sm" variant={budgetMax === undefined ? "default" : "outline"} onClick={() => setBudgetMax(undefined)}>
          All budgets
        </Button>
        {BUDGET_TIERS.map((tier) => (
          <Button key={tier.label} size="sm" variant={budgetMax === tier.value ? "default" : "outline"} onClick={() => setBudgetMax(tier.value)}>
            {tier.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No products connected yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Shopping Mode connects to real fashion store APIs and affiliate feeds. An admin can add products
              from the Admin Panel, or connect a live feed in production.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Card key={p.id}>
              <div className="relative aspect-square overflow-hidden rounded-t-xl bg-secondary">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
                )}
              </div>
              <CardContent className="space-y-1 pt-4">
                <p className="text-xs text-muted-foreground">{p.brand?.name}</p>
                <p className="font-medium">{p.name}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold">{p.price ? formatCurrencyAED(p.price) : "—"}</span>
                  {p.rating && <Badge variant="outline">★ {p.rating.toFixed(1)}</Badge>}
                </div>
                <Button size="sm" className="mt-2 w-full" disabled={!p.affiliateUrl} asChild={Boolean(p.affiliateUrl)}>
                  {p.affiliateUrl ? (
                    <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
                      Buy Now <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span>Unavailable</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

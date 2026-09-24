"use client";

import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { OutfitSuggestion } from "@/ai/types";

export function OutfitCard({ outfit, outfitId }: { outfit: OutfitSuggestion; outfitId?: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = outfitId
        ? await fetch("/api/saved-outfits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ outfitId }),
          })
        : await fetch("/api/outfits/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: outfit.name, items: outfit.items }),
          });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Look saved", description: "Find it under Saved Looks in your dashboard." });
    } catch (err) {
      toast({ title: "Couldn't save look", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: outfit.name, text: `Check out this look from STYLEAI: ${outfit.name}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied" });
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{outfit.name}</CardTitle>
        <Badge variant="accent">{outfit.styleMatch}% Style Match</Badge>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {outfit.items.map((item) => (
          <div key={`${item.slot}-${item.label}`} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
            <span className="text-muted-foreground">{item.slot}</span>
            <span className="font-medium">
              {item.colorName ? `${item.colorName} ` : ""}
              {item.label}
            </span>
          </div>
        ))}
        <p className="pt-2 text-xs text-muted-foreground">{outfit.reasoning}</p>
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleSave} disabled={saving}>
            <Heart className="h-3.5 w-3.5" /> Save Look
          </Button>
          <Button size="sm" variant="ghost" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

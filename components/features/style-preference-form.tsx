"use client";

import { useState } from "react";
import type { StylePreference } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FASHION_PROFILES, OCCASIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StylePreferenceForm({ initial }: { initial: StylePreference | null }) {
  const { toast } = useToast();
  const [fashionProfiles, setFashionProfiles] = useState<string[]>(initial?.fashionProfiles ?? []);
  const [favoriteOccasions, setFavoriteOccasions] = useState<string[]>(initial?.favoriteOccasions ?? []);
  const [budgetMax, setBudgetMax] = useState<string>(initial?.budgetMax?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/style-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stylePreference: {
            fashionProfiles,
            favoriteOccasions,
            budgetMax: budgetMax ? Number(budgetMax) : undefined,
            preferredBrands: initial?.preferredBrands ?? [],
            avoidColors: initial?.avoidColors ?? [],
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Preferences saved" });
    } catch (err) {
      toast({ title: "Couldn't save preferences", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block">Fashion profiles</Label>
        <div className="flex flex-wrap gap-2">
          {FASHION_PROFILES.map((p) => (
            <button key={p} type="button" onClick={() => toggle(fashionProfiles, setFashionProfiles, p)}>
              <Badge
                variant={fashionProfiles.includes(p) ? "accent" : "outline"}
                className={cn("cursor-pointer transition-transform hover:-translate-y-0.5")}
              >
                {p}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Favorite occasions</Label>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button key={o} type="button" onClick={() => toggle(favoriteOccasions, setFavoriteOccasions, o)}>
              <Badge variant={favoriteOccasions.includes(o) ? "accent" : "outline"} className="cursor-pointer">
                {o}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="budget" className="mb-2 block">
          Monthly budget (AED)
        </Label>
        <Input id="budget" type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
      </div>

      <Button onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save preferences"}
      </Button>
    </div>
  );
}

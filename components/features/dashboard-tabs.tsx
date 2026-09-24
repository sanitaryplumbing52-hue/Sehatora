"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FREE_PLAN_MONTHLY_GENERATIONS } from "@/lib/constants";

const TABS = ["Profile", "Photos", "Style Profile", "Saved Looks", "Colors", "History", "Wishlist", "Settings"];

export function DashboardTabs({
  user,
  photos,
  styleProfile,
  savedOutfits,
  favoriteColors,
  wishlistCount,
  recommendations,
  subscription,
}: {
  user: { name: string | null; email: string; createdAt: Date } | null;
  profile: unknown;
  photos: Array<{ id: string; url: string; createdAt: Date }>;
  styleProfile: { bodyShape: string | null; undertone: string | null; skinTone: string | null } | null;
  savedOutfits: Array<{
    id: string;
    outfit: { id: string; name: string; items: Array<{ slot: string; clothingItem: { name: string; color: { name: string } | null } }> };
  }>;
  favoriteColors: Array<{ id: string; name: string; hex: string }>;
  wishlistCount: number;
  recommendations: Array<{ id: string; type: string; createdAt: Date }>;
  subscription: { plan: string; status: string } | null;
}) {
  const { toast } = useToast();
  const [photoList, setPhotoList] = useState(photos);

  async function deletePhoto(id: string) {
    const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotoList((list) => list.filter((p) => p.id !== id));
      toast({ title: "Photo deleted" });
    }
  }

  return (
    <Tabs defaultValue="Profile">
      <TabsList className="flex-wrap">
        {TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="Profile">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span> {user?.name}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {user?.email}
            </p>
            <p>
              <span className="text-muted-foreground">Member since:</span>{" "}
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-muted-foreground">Plan:</span>
              <Badge variant={subscription?.plan === "PRO" ? "accent" : "secondary"}>{subscription?.plan ?? "FREE"}</Badge>
              {subscription?.plan !== "PRO" && (
                <span className="text-xs text-muted-foreground">{FREE_PLAN_MONTHLY_GENERATIONS} generations / month</span>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="Photos">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {photoList.length === 0 && <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>}
          {photoList.map((photo) => (
            <div key={photo.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-border">
              <Image src={photo.url} alt="Uploaded photo" fill className="object-cover" unoptimized />
              <button
                onClick={() => deletePhoto(photo.id)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="Style Profile">
        {styleProfile ? (
          <Card>
            <CardContent className="space-y-2 pt-6 text-sm">
              <p>
                <span className="text-muted-foreground">Body shape:</span> {styleProfile.bodyShape}
              </p>
              <p>
                <span className="text-muted-foreground">Undertone:</span> {styleProfile.undertone}
              </p>
              <p>
                <span className="text-muted-foreground">Skin tone:</span> {styleProfile.skinTone}
              </p>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link href="/style-profile">Edit full profile →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            No style profile yet.{" "}
            <Link href="/try" className="underline underline-offset-4">
              Upload a photo
            </Link>{" "}
            to generate one.
          </p>
        )}
      </TabsContent>

      <TabsContent value="Saved Looks">
        {savedOutfits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved looks yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedOutfits.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-base">{s.outfit.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  {s.outfit.items.map((i) => (
                    <p key={i.slot}>
                      {i.slot}: {i.clothingItem.color ? `${i.clothingItem.color.name} ` : ""}
                      {i.clothingItem.name}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="Colors">
        {favoriteColors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No favorite colors yet.{" "}
            <Link href="/colors" className="underline underline-offset-4">
              Browse colors
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {favoriteColors.map((c) => (
              <div key={c.id} className="flex flex-col items-center gap-2">
                <span className="h-12 w-12 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                <span className="text-xs">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="History">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendation history yet.</p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((r) => (
              <div key={r.id} className="flex justify-between rounded-lg border border-border px-4 py-2 text-sm">
                <Badge variant="outline">{r.type}</Badge>
                <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="Wishlist">
        <p className="text-sm text-muted-foreground">
          {wishlistCount} item{wishlistCount === 1 ? "" : "s"} saved.{" "}
          <Link href="/shopping" className="underline underline-offset-4">
            Continue shopping
          </Link>
          .
        </p>
      </TabsContent>

      <TabsContent value="Settings">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">
              Manage your account. Deleting your account permanently removes your photos, style profile, and
              saved looks.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

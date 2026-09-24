import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";
import { DashboardTabs } from "@/components/features/dashboard-tabs";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/dashboard");

  const [profile, photos, styleProfile, savedOutfits, favorites, recommendations, subscription, dbUser] = await Promise.all([
    db.profile.findUnique({ where: { userId: user.id } }),
    db.photo.findMany({ where: { userId: user.id, status: { not: "DELETED" } }, orderBy: { createdAt: "desc" } }),
    db.styleProfile.findUnique({ where: { userId: user.id } }),
    db.savedOutfit.findMany({
      where: { userId: user.id },
      include: { outfit: { include: { items: { include: { clothingItem: { include: { color: true } } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.recommendation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.subscription.findUnique({ where: { userId: user.id } }),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, createdAt: true } }),
  ]);

  const storage = getStorageProvider();
  const photosWithUrls = await Promise.all(
    photos.map(async (p) => ({ ...p, url: await storage.getSignedReadUrl(p.storageKey, 900) }))
  );

  const colorFavorites = favorites.filter((f) => f.targetType === "COLOR");
  const productFavorites = favorites.filter((f) => f.targetType === "PRODUCT");
  const favoriteColors = colorFavorites.length
    ? await db.color.findMany({ where: { id: { in: colorFavorites.map((f) => f.targetId) } } })
    : [];

  return (
    <div className="container py-16">
      <h1 className="font-serif text-3xl font-semibold">My Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Manage your profile, photos, style, and saved looks.</p>

      <div className="mt-10">
        <DashboardTabs
          user={dbUser}
          profile={profile}
          photos={photosWithUrls}
          styleProfile={styleProfile}
          savedOutfits={savedOutfits}
          favoriteColors={favoriteColors}
          wishlistCount={productFavorites.length}
          recommendations={recommendations}
          subscription={subscription}
        />
      </div>
    </div>
  );
}

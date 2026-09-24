import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { getStorageProvider } from "@/lib/storage";

export async function GET() {
  try {
    const user = await requireUser();
    const photos = await db.photo.findMany({
      where: { userId: user.id, status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
    });

    const storage = getStorageProvider();
    const withFreshUrls = await Promise.all(
      photos.map(async (p) => ({ ...p, url: await storage.getSignedReadUrl(p.storageKey, 900) }))
    );

    return apiOk({ photos: withFreshUrls });
  } catch (err) {
    return apiError(err);
  }
}

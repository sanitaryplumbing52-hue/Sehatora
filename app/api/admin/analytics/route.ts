import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAdmin();

    const [userCount, photoUploads, generations, tryOns, savedOutfits, proSubscribers, recentEvents] = await Promise.all([
      db.user.count(),
      db.photo.count(),
      db.aIGeneration.count(),
      db.tryOnSession.count(),
      db.savedOutfit.count(),
      db.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
      db.analyticsEvent.groupBy({ by: ["event"], _count: { event: true }, orderBy: { _count: { event: "desc" } }, take: 10 }),
    ]);

    return apiOk({
      userCount,
      photoUploads,
      generations,
      tryOns,
      savedOutfits,
      proSubscribers,
      topEvents: recentEvents.map((e) => ({ event: e.event, count: e._count.event })),
    });
  } catch (err) {
    return apiError(err);
  }
}

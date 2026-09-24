import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAdmin();
    const outfits = await db.outfit.findMany({
      include: { items: { include: { clothingItem: { include: { color: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return apiOk({ outfits });
  } catch (err) {
    return apiError(err);
  }
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { tryOnRequestSchema } from "@/lib/validation";
import { checkAndReserveGeneration } from "@/lib/usage";
import { createTryOnJob, processTryOnJob } from "@/lib/jobs/tryon-job";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = tryOnRequestSchema.parse(await req.json());

    const photo = await db.photo.findFirst({ where: { id: parsed.photoId, userId: user.id } });
    if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

    const quota = await checkAndReserveGeneration(user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "You've reached your monthly generation limit on the Free plan. Upgrade to Pro for more." },
        { status: 402 }
      );
    }

    const items = await db.clothingItem.findMany({
      where: { id: { in: parsed.items.map((i) => i.clothingItemId) } },
      include: { category: true, color: true },
    });

    const selection = parsed.items
      .map((sel) => {
        const item = items.find((i) => i.id === sel.clothingItemId);
        if (!item) return null;
        return {
          slot: sel.slot,
          clothingItemId: item.id,
          name: item.name,
          colorHex: item.color?.hex,
          categorySlug: item.category.slug,
        };
      })
      .filter((v): v is NonNullable<typeof v> => Boolean(v));

    const session = await createTryOnJob({
      userId: user.id,
      photoId: parsed.photoId,
      outfitId: parsed.outfitId,
      items: selection,
    });
    void processTryOnJob(session.id);

    return apiOk({ sessionId: session.id, status: "QUEUED" });
  } catch (err) {
    return apiError(err);
  }
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { saveOutfitSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const saved = await db.savedOutfit.findMany({
      where: { userId: user.id },
      include: { outfit: { include: { items: { include: { clothingItem: { include: { color: true } } } } } } },
      orderBy: { createdAt: "desc" },
    });
    return apiOk({ saved });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { outfitId, note } = saveOutfitSchema.parse(await req.json());

    const outfit = await db.outfit.findUnique({ where: { id: outfitId } });
    if (!outfit) return NextResponse.json({ error: "Outfit not found." }, { status: 404 });

    const saved = await db.savedOutfit.upsert({
      where: { userId_outfitId: { userId: user.id, outfitId } },
      update: { note },
      create: { userId: user.id, outfitId, note },
    });

    return apiOk({ saved });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { outfitId } = saveOutfitSchema.pick({ outfitId: true }).parse(await req.json());
    await db.savedOutfit.deleteMany({ where: { userId: user.id, outfitId } });
    return apiOk({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}

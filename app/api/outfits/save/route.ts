import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

const schema = z.object({
  name: z.string().min(1).max(120),
  items: z.array(
    z.object({
      slot: z.enum(["TOP", "BOTTOM", "FOOTWEAR", "ACCESSORY"]),
      label: z.string().min(1),
    })
  ),
});

/** Persists an AI-generated outfit suggestion as a real Outfit so it can be saved/tried on. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { name, items } = schema.parse(await req.json());

    const matched = await Promise.all(
      items.map(async (i) => ({ slot: i.slot, item: await db.clothingItem.findFirst({ where: { name: i.label } }) }))
    );
    const validItems = matched.filter((m): m is { slot: typeof m.slot; item: NonNullable<typeof m.item> } => Boolean(m.item));

    if (validItems.length === 0) {
      return NextResponse.json({ error: "This look couldn't be matched to catalog items." }, { status: 422 });
    }

    const outfit = await db.outfit.create({
      data: {
        name,
        source: "AI",
        items: { create: validItems.map((v) => ({ slot: v.slot, clothingItemId: v.item.id })) },
      },
    });

    const saved = await db.savedOutfit.upsert({
      where: { userId_outfitId: { userId: user.id, outfitId: outfit.id } },
      update: {},
      create: { userId: user.id, outfitId: outfit.id },
    });

    return apiOk({ outfitId: outfit.id, saved });
  } catch (err) {
    return apiError(err);
  }
}

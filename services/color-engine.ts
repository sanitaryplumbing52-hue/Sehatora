import { db } from "@/lib/db";
import type { Undertone } from "@prisma/client";

export interface ColorCard {
  id: string;
  name: string;
  hex: string;
  family: string;
  isNeutral: boolean;
}

export interface ColorRecommendationSet {
  best: ColorCard[];
  neutrals: ColorCard[];
  accents: ColorCard[];
  careful: ColorCard[];
}

const OPPOSITE: Record<Undertone, Undertone> = {
  WARM: "COOL",
  COOL: "WARM",
  NEUTRAL: "NEUTRAL",
};

/**
 * Buckets the full color catalog against a user's undertone into the four
 * sections the Color Recommendation Engine shows (section 5): colors that
 * suit them, colors to use carefully, best neutrals, and best accents.
 */
export async function getColorRecommendations(undertone: Undertone | null | undefined): Promise<ColorRecommendationSet> {
  const colors = await db.color.findMany();
  const effectiveUndertone = undertone ?? "NEUTRAL";

  const neutrals = colors.filter((c) => c.isNeutral);
  const matching = colors.filter((c) => !c.isNeutral && c.undertone === effectiveUndertone);
  const opposite = colors.filter(
    (c) => !c.isNeutral && effectiveUndertone !== "NEUTRAL" && c.undertone === OPPOSITE[effectiveUndertone]
  );

  return {
    best: [...matching, ...neutrals.slice(0, 2)].slice(0, 8),
    neutrals: neutrals.slice(0, 6),
    accents: matching.filter((c) => c.family !== "grey" && c.family !== "neutral").slice(0, 6),
    careful: opposite.slice(0, 6),
  };
}

export async function persistColorRecommendations(userId: string, set: ColorRecommendationSet) {
  const entries: Array<{ colorId: string; category: "BEST" | "NEUTRAL" | "ACCENT" | "CAREFUL" }> = [
    ...set.best.map((c) => ({ colorId: c.id, category: "BEST" as const })),
    ...set.neutrals.map((c) => ({ colorId: c.id, category: "NEUTRAL" as const })),
    ...set.accents.map((c) => ({ colorId: c.id, category: "ACCENT" as const })),
    ...set.careful.map((c) => ({ colorId: c.id, category: "CAREFUL" as const })),
  ];

  await db.$transaction(
    entries.map((e) =>
      db.colorRecommendation.upsert({
        where: { userId_colorId_category: { userId, colorId: e.colorId, category: e.category } },
        update: {},
        create: { userId, colorId: e.colorId, category: e.category },
      })
    )
  );
}

/** Tap a color → outfit combinations built around it (section 5). */
export async function buildOutfitsForColor(colorId: string) {
  const color = await db.color.findUnique({ where: { id: colorId } });
  if (!color) return [];

  const anchorItems = await db.clothingItem.findMany({
    where: { colorId, isActive: true },
    include: { category: true, color: true },
    take: 3,
  });

  const neutralBottoms = await db.clothingItem.findMany({
    where: { category: { group: "BOTTOM" }, isActive: true },
    include: { category: true, color: true },
    take: 3,
  });

  const footwear = await db.clothingItem.findMany({
    where: { category: { group: "FOOTWEAR" }, isActive: true },
    include: { category: true, color: true },
    take: 2,
  });

  return anchorItems.map((top) => ({
    name: `${color.name} ${top.category.name} Look`,
    items: [
      { slot: "TOP", label: top.name, colorName: top.color?.name },
      ...(neutralBottoms[0] ? [{ slot: "BOTTOM", label: neutralBottoms[0].name, colorName: neutralBottoms[0].color?.name }] : []),
      ...(footwear[0] ? [{ slot: "FOOTWEAR", label: footwear[0].name, colorName: footwear[0].color?.name }] : []),
    ],
  }));
}

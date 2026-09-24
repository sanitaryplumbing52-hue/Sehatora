import type { StyleProfileSnapshot } from "@/ai/types";
import { db } from "@/lib/db";

export interface JeansRecommendation {
  shade: string;
  fit: string;
  reason: string;
  clothingItemId?: string;
  imageUrl?: string | null;
}

const SHADES_BY_UNDERTONE: Record<string, string[]> = {
  WARM: ["Medium Blue", "Dark Blue", "Off-White"],
  COOL: ["Dark Blue", "Black", "Grey"],
  NEUTRAL: ["Dark Blue", "Medium Blue", "Black"],
};

const FIT_BY_BODY_SHAPE: Record<string, { fit: string; reason: string }> = {
  Rectangle: { fit: "Straight", reason: "A straight leg adds structure to a balanced frame." },
  Triangle: { fit: "Relaxed", reason: "A relaxed leg balances broader hips with the rest of the silhouette." },
  "Inverted Triangle": { fit: "Tapered", reason: "A tapered leg balances broader shoulders for a proportional silhouette." },
  Oval: { fit: "Straight", reason: "A straight, mid-rise cut sits comfortably and elongates the leg line." },
  Trapezoid: { fit: "Slim", reason: "A slim leg complements your balanced proportions cleanly." },
};

export async function recommendJeans(profile: StyleProfileSnapshot): Promise<JeansRecommendation[]> {
  const undertoneKey = profile.undertone ?? "NEUTRAL";
  const shades = SHADES_BY_UNDERTONE[undertoneKey] ?? SHADES_BY_UNDERTONE.NEUTRAL!;
  const fitInfo = (profile.bodyShape && FIT_BY_BODY_SHAPE[profile.bodyShape]) || { fit: "Regular", reason: "A regular fit is a versatile, reliable choice." };

  const jeansItems = await db.clothingItem.findMany({
    where: { category: { slug: "jeans" }, isActive: true },
    include: { color: true },
  });

  return shades.map((shade) => {
    const match = jeansItems.find((j) => j.color?.name.toLowerCase().includes(shade.toLowerCase().split(" ")[0] ?? ""));
    return {
      shade,
      fit: fitInfo.fit,
      reason: fitInfo.reason,
      clothingItemId: match?.id,
      imageUrl: match?.imageUrl,
    };
  });
}

import type { StyleProfileSnapshot } from "@/ai/types";
import { db } from "@/lib/db";

export type TopCategorySlug = "t-shirt" | "shirt" | "polo" | "overshirt" | "jacket" | "blazer";

export interface TopRecommendation {
  categorySlug: TopCategorySlug;
  recommendedColor: string;
  recommendedFit: string;
  recommendedStyle: string;
  matchingBottom: string;
  matchingFootwear: string;
  matchingAccessory: string;
}

const COLOR_BY_UNDERTONE: Record<string, string> = {
  WARM: "Cream",
  COOL: "Navy",
  NEUTRAL: "White",
};

const CATEGORY_GUIDANCE: Record<TopCategorySlug, { style: string; bottom: string; footwear: string; accessory: string }> = {
  "t-shirt": { style: "Casual", bottom: "Dark Blue Jeans or Chinos", footwear: "Sneakers", accessory: "Watch" },
  shirt: { style: "Smart Casual", bottom: "Chinos or Formal Trousers", footwear: "Loafers", accessory: "Watch" },
  polo: { style: "Smart Casual", bottom: "Chinos", footwear: "Sneakers or Loafers", accessory: "Watch" },
  overshirt: { style: "Layered Casual", bottom: "Jeans", footwear: "Boots or Sneakers", accessory: "Watch" },
  jacket: { style: "Modern", bottom: "Jeans or Chinos", footwear: "Sneakers or Boots", accessory: "Sunglasses" },
  blazer: { style: "Classic", bottom: "Formal Trousers", footwear: "Formal Shoes or Loafers", accessory: "Belt" },
};

const FIT_BY_BODY_SHAPE: Record<string, string> = {
  Rectangle: "Regular",
  Triangle: "Slim",
  "Inverted Triangle": "Relaxed",
  Oval: "Straight",
  Trapezoid: "Slim",
};

export async function recommendTop(categorySlug: TopCategorySlug, profile: StyleProfileSnapshot): Promise<TopRecommendation> {
  const undertoneKey = profile.undertone ?? "NEUTRAL";
  const guidance = CATEGORY_GUIDANCE[categorySlug];
  const fit = (profile.bodyShape && FIT_BY_BODY_SHAPE[profile.bodyShape]) || "Regular";

  return {
    categorySlug,
    recommendedColor: COLOR_BY_UNDERTONE[undertoneKey] ?? "White",
    recommendedFit: fit,
    recommendedStyle: guidance.style,
    matchingBottom: guidance.bottom,
    matchingFootwear: guidance.footwear,
    matchingAccessory: guidance.accessory,
  };
}

export async function listItemsForCategory(categorySlug: TopCategorySlug, take = 6) {
  return db.clothingItem.findMany({
    where: { category: { slug: categorySlug }, isActive: true },
    include: { color: true, brand: true },
    take,
  });
}

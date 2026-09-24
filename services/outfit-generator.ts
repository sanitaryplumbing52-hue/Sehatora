import { db } from "@/lib/db";
import type { CategoryGroup } from "@prisma/client";
import type { OutfitSuggestion, StyleRecommendationInput } from "@/ai/types";
import { computeStyleMatch } from "@/services/style-score";

interface OccasionRule {
  top: string[];
  bottom: string[];
  footwear: string[];
  accessory: string[];
}

const OCCASION_RULES: Record<string, OccasionRule> = {
  Casual: { top: ["t-shirt", "polo", "hoodie"], bottom: ["jeans", "chinos"], footwear: ["sneakers"], accessory: ["watch", "cap"] },
  Office: { top: ["shirt", "overshirt"], bottom: ["chinos", "formal-trousers"], footwear: ["loafers"], accessory: ["watch", "belt"] },
  "Business Meeting": { top: ["shirt", "blazer"], bottom: ["formal-trousers"], footwear: ["formal-shoes", "loafers"], accessory: ["watch", "belt"] },
  Date: { top: ["shirt", "overshirt"], bottom: ["chinos", "jeans"], footwear: ["loafers", "sneakers"], accessory: ["watch"] },
  Party: { top: ["shirt", "blazer"], bottom: ["jeans", "chinos"], footwear: ["loafers", "sneakers"], accessory: ["watch", "sunglasses"] },
  Wedding: { top: ["blazer", "shirt"], bottom: ["formal-trousers"], footwear: ["formal-shoes"], accessory: ["watch", "belt"] },
  Travel: { top: ["hoodie", "t-shirt", "jacket"], bottom: ["jeans", "cargo-pants"], footwear: ["sneakers", "boots"], accessory: ["cap", "bag"] },
  Gym: { top: ["t-shirt", "sweatshirt"], bottom: ["shorts", "cargo-pants"], footwear: ["sneakers"], accessory: ["cap"] },
  Dinner: { top: ["shirt", "overshirt"], bottom: ["chinos", "formal-trousers"], footwear: ["loafers"], accessory: ["watch"] },
  Weekend: { top: ["t-shirt", "polo", "sweatshirt"], bottom: ["jeans", "chinos"], footwear: ["sneakers"], accessory: ["watch", "sunglasses"] },
  Beach: { top: ["t-shirt"], bottom: ["shorts"], footwear: ["sneakers", "loafers"], accessory: ["sunglasses", "cap"] },
  "Formal Event": { top: ["blazer", "shirt"], bottom: ["formal-trousers"], footwear: ["formal-shoes"], accessory: ["watch", "belt"] },
};

const DEFAULT_RULE: OccasionRule = OCCASION_RULES.Casual!;

function weatherAdjust(rule: OccasionRule, weather?: string): OccasionRule {
  if (!weather) return rule;
  if (weather === "Hot") {
    return { ...rule, top: rule.top.filter((t) => t !== "jacket" && t !== "hoodie"), bottom: rule.bottom.includes("shorts") ? rule.bottom : [...rule.bottom, "shorts"] };
  }
  if (weather === "Cold") {
    return { ...rule, top: ["jacket", "sweatshirt", ...rule.top] };
  }
  if (weather === "Rainy") {
    return { ...rule, footwear: ["boots", ...rule.footwear] };
  }
  return rule;
}

async function pickItems(slugs: string[], group: CategoryGroup, colorFocus?: string, take = 3) {
  return db.clothingItem.findMany({
    where: {
      isActive: true,
      category: { slug: { in: slugs }, group },
      ...(colorFocus ? { color: { name: { equals: colorFocus, mode: "insensitive" } } } : {}),
    },
    include: { category: true, color: true },
    take,
  });
}

export async function buildOutfitSuggestions(input: StyleRecommendationInput): Promise<OutfitSuggestion[]> {
  const rule = weatherAdjust(OCCASION_RULES[input.occasion ?? ""] ?? DEFAULT_RULE, input.weather);
  const count = Math.min(input.count ?? 3, 5);

  let tops = await pickItems(rule.top, "TOP", input.colorFocus, count);
  let bottoms = await pickItems(rule.bottom, "BOTTOM", undefined, count);
  const footwear = await pickItems(rule.footwear, "FOOTWEAR", undefined, count);
  const accessories = await pickItems(rule.accessory, "ACCESSORY", undefined, count);

  if (tops.length === 0) tops = await pickItems(DEFAULT_RULE.top, "TOP", undefined, count);
  if (bottoms.length === 0) bottoms = await pickItems(DEFAULT_RULE.bottom, "BOTTOM", undefined, count);

  const suggestions: OutfitSuggestion[] = [];
  const n = Math.max(1, Math.min(count, Math.max(tops.length, 1)));

  for (let i = 0; i < n; i++) {
    const top = tops[i % Math.max(tops.length, 1)];
    const bottom = bottoms[i % Math.max(bottoms.length, 1)];
    const shoe = footwear[i % Math.max(footwear.length, 1)];
    const accessory = accessories[i % Math.max(accessories.length, 1)];
    if (!top || !bottom) continue;

    const outfitColorNames = [top.color?.name, bottom.color?.name, shoe?.color?.name].filter(
      (v): v is string => Boolean(v)
    );

    const match = computeStyleMatch({
      profile: input.styleProfile,
      outfitColorNames,
      occasion: input.occasion,
      style: input.style,
    });

    suggestions.push({
      name: `Look ${String(i + 1).padStart(2, "0")}`,
      items: [
        { slot: "TOP", label: top.name, colorName: top.color?.name },
        { slot: "BOTTOM", label: bottom.name, colorName: bottom.color?.name },
        ...(shoe ? [{ slot: "FOOTWEAR" as const, label: shoe.name, colorName: shoe.color?.name }] : []),
        ...(accessory ? [{ slot: "ACCESSORY" as const, label: accessory.name, colorName: accessory.color?.name }] : []),
      ],
      styleMatch: match.overall,
      reasoning: match.explanation.join(" "),
    });
  }

  return suggestions;
}

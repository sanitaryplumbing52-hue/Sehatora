import { PrismaClient, CategoryGroup, Fit, Undertone, OutfitSlot, OutfitSource } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const COLORS: Array<{ name: string; hex: string; family: string; undertone: Undertone; isNeutral: boolean }> = [
  { name: "Navy", hex: "#1B2A4A", family: "blue", undertone: "COOL", isNeutral: true },
  { name: "Cream", hex: "#F1E7D0", family: "neutral", undertone: "WARM", isNeutral: true },
  { name: "White", hex: "#FFFFFF", family: "neutral", undertone: "NEUTRAL", isNeutral: true },
  { name: "Olive", hex: "#6B6E3A", family: "green", undertone: "WARM", isNeutral: false },
  { name: "Charcoal", hex: "#36393D", family: "grey", undertone: "COOL", isNeutral: true },
  { name: "Burgundy", hex: "#6E1F2A", family: "red", undertone: "COOL", isNeutral: false },
  { name: "Beige", hex: "#D9C7A7", family: "neutral", undertone: "WARM", isNeutral: true },
  { name: "Black", hex: "#111111", family: "neutral", undertone: "NEUTRAL", isNeutral: true },
  { name: "Dark Blue", hex: "#233A5E", family: "blue", undertone: "COOL", isNeutral: false },
  { name: "Sky Blue", hex: "#8FB4D9", family: "blue", undertone: "COOL", isNeutral: false },
  { name: "Camel", hex: "#C19A6B", family: "brown", undertone: "WARM", isNeutral: false },
  { name: "Brown", hex: "#5A3A22", family: "brown", undertone: "WARM", isNeutral: false },
  { name: "Grey", hex: "#8C8C8C", family: "grey", undertone: "NEUTRAL", isNeutral: true },
  { name: "Mustard", hex: "#C99A2E", family: "yellow", undertone: "WARM", isNeutral: false },
  { name: "Emerald", hex: "#0E6B4C", family: "green", undertone: "COOL", isNeutral: false },
  { name: "Silver", hex: "#C7CBD1", family: "grey", undertone: "COOL", isNeutral: true },
];

const CATEGORIES: Array<{ name: string; slug: string; group: CategoryGroup }> = [
  { name: "T-shirt", slug: "t-shirt", group: "TOP" },
  { name: "Polo", slug: "polo", group: "TOP" },
  { name: "Shirt", slug: "shirt", group: "TOP" },
  { name: "Overshirt", slug: "overshirt", group: "TOP" },
  { name: "Hoodie", slug: "hoodie", group: "TOP" },
  { name: "Sweatshirt", slug: "sweatshirt", group: "TOP" },
  { name: "Jacket", slug: "jacket", group: "TOP" },
  { name: "Blazer", slug: "blazer", group: "TOP" },
  { name: "Jeans", slug: "jeans", group: "BOTTOM" },
  { name: "Chinos", slug: "chinos", group: "BOTTOM" },
  { name: "Formal Trousers", slug: "formal-trousers", group: "BOTTOM" },
  { name: "Cargo Pants", slug: "cargo-pants", group: "BOTTOM" },
  { name: "Shorts", slug: "shorts", group: "BOTTOM" },
  { name: "Sneakers", slug: "sneakers", group: "FOOTWEAR" },
  { name: "Loafers", slug: "loafers", group: "FOOTWEAR" },
  { name: "Boots", slug: "boots", group: "FOOTWEAR" },
  { name: "Formal Shoes", slug: "formal-shoes", group: "FOOTWEAR" },
  { name: "Watch", slug: "watch", group: "ACCESSORY" },
  { name: "Sunglasses", slug: "sunglasses", group: "ACCESSORY" },
  { name: "Belt", slug: "belt", group: "ACCESSORY" },
  { name: "Cap", slug: "cap", group: "ACCESSORY" },
  { name: "Bag", slug: "bag", group: "ACCESSORY" },
];

const BRANDS = ["Studio Line", "North & Co", "Aster Atelier", "Form & Fit", "Maison Basic"];

async function main() {
  console.log("Seeding colors...");
  const colorRecords = await Promise.all(
    COLORS.map((c) =>
      db.color.upsert({ where: { name: c.name }, update: {}, create: c })
    )
  );
  const colorByName = Object.fromEntries(colorRecords.map((c) => [c.name, c]));

  console.log("Seeding categories...");
  const categoryRecords = await Promise.all(
    CATEGORIES.map((c) =>
      db.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
    )
  );
  const categoryBySlug = Object.fromEntries(categoryRecords.map((c) => [c.slug, c]));

  console.log("Seeding brands...");
  const brandRecords = await Promise.all(
    BRANDS.map((name) => db.brand.upsert({ where: { name }, update: {}, create: { name } }))
  );
  const brand = (i: number) => brandRecords[i % brandRecords.length]!;

  const clothingSeed: Array<{
    name: string;
    categorySlug: string;
    colorName: string;
    fit?: Fit;
    brandIdx: number;
  }> = [
    { name: "Cream Polo", categorySlug: "polo", colorName: "Cream", fit: "REGULAR", brandIdx: 0 },
    { name: "Black T-shirt", categorySlug: "t-shirt", colorName: "Black", fit: "REGULAR", brandIdx: 1 },
    { name: "Light Blue Shirt", categorySlug: "shirt", colorName: "Sky Blue", fit: "SLIM", brandIdx: 2 },
    { name: "White T-shirt", categorySlug: "t-shirt", colorName: "White", fit: "REGULAR", brandIdx: 3 },
    { name: "Navy Overshirt", categorySlug: "overshirt", colorName: "Navy", fit: "RELAXED", brandIdx: 4 },
    { name: "Charcoal Blazer", categorySlug: "blazer", colorName: "Charcoal", fit: "SLIM", brandIdx: 2 },
    { name: "Dark Navy Chinos", categorySlug: "chinos", colorName: "Navy", fit: "TAPERED", brandIdx: 0 },
    { name: "Beige Chinos", categorySlug: "chinos", colorName: "Beige", fit: "STRAIGHT", brandIdx: 1 },
    { name: "Dark Blue Jeans", categorySlug: "jeans", colorName: "Dark Blue", fit: "SLIM", brandIdx: 3 },
    { name: "Black Jeans", categorySlug: "jeans", colorName: "Black", fit: "TAPERED", brandIdx: 4 },
    { name: "Grey Formal Trousers", categorySlug: "formal-trousers", colorName: "Grey", fit: "STRAIGHT", brandIdx: 2 },
    { name: "White Sneakers", categorySlug: "sneakers", colorName: "White", fit: undefined, brandIdx: 0 },
    { name: "Brown Loafers", categorySlug: "loafers", colorName: "Brown", fit: undefined, brandIdx: 1 },
    { name: "Black Boots", categorySlug: "boots", colorName: "Black", fit: undefined, brandIdx: 4 },
    { name: "Silver Watch", categorySlug: "watch", colorName: "Silver", fit: undefined, brandIdx: 2 },
    { name: "Black Watch", categorySlug: "watch", colorName: "Black", fit: undefined, brandIdx: 3 },
  ];

  console.log("Seeding clothing items...");
  const clothingRecords = await Promise.all(
    clothingSeed.map((c) =>
      db.clothingItem.upsert({
        where: { id: `seed-${c.name.replace(/\s+/g, "-").toLowerCase()}` },
        update: {},
        create: {
          id: `seed-${c.name.replace(/\s+/g, "-").toLowerCase()}`,
          name: c.name,
          categoryId: categoryBySlug[c.categorySlug]!.id,
          colorId: colorByName[c.colorName]?.id,
          brandId: brand(c.brandIdx).id,
          fit: c.fit,
        },
      })
    )
  );
  const item = (name: string) => clothingRecords.find((c) => c.name === name)!;

  console.log("Seeding demo outfits...");
  const outfits = [
    {
      name: "Weekend Smart Casual",
      occasion: "Casual",
      weather: "Warm",
      styleTag: "Smart Casual",
      slots: [
        { slot: "TOP" as OutfitSlot, item: "Cream Polo" },
        { slot: "BOTTOM" as OutfitSlot, item: "Dark Navy Chinos" },
        { slot: "FOOTWEAR" as OutfitSlot, item: "White Sneakers" },
        { slot: "ACCESSORY" as OutfitSlot, item: "Silver Watch" },
      ],
    },
    {
      name: "Everyday Streetwear",
      occasion: "Casual",
      weather: "Mild",
      styleTag: "Streetwear",
      slots: [
        { slot: "TOP" as OutfitSlot, item: "Black T-shirt" },
        { slot: "BOTTOM" as OutfitSlot, item: "Dark Blue Jeans" },
        { slot: "FOOTWEAR" as OutfitSlot, item: "White Sneakers" },
        { slot: "ACCESSORY" as OutfitSlot, item: "Black Watch" },
      ],
    },
    {
      name: "Business Meeting Classic",
      occasion: "Business Meeting",
      weather: "Mild",
      styleTag: "Classic",
      slots: [
        { slot: "TOP" as OutfitSlot, item: "Light Blue Shirt" },
        { slot: "BOTTOM" as OutfitSlot, item: "Grey Formal Trousers" },
        { slot: "FOOTWEAR" as OutfitSlot, item: "Brown Loafers" },
      ],
    },
  ];

  for (const o of outfits) {
    const existing = await db.outfit.findFirst({ where: { name: o.name } });
    const outfit =
      existing ??
      (await db.outfit.create({
        data: {
          name: o.name,
          occasion: o.occasion,
          weather: o.weather,
          styleTag: o.styleTag,
          source: OutfitSource.SYSTEM,
        },
      }));
    for (const s of o.slots) {
      await db.outfitItem.upsert({
        where: { id: `${outfit.id}-${s.slot}` },
        update: {},
        create: {
          id: `${outfit.id}-${s.slot}`,
          outfitId: outfit.id,
          clothingItemId: item(s.item).id,
          slot: s.slot,
        },
      });
    }
  }

  console.log("Seeding admin settings...");
  await db.adminSetting.upsert({
    where: { key: "ai_provider" },
    update: {},
    create: { key: "ai_provider", value: { active: "demo" } },
  });
  await db.adminSetting.upsert({
    where: { key: "free_plan_generation_limit" },
    update: {},
    create: { key: "free_plan_generation_limit", value: { monthly: 5 } },
  });

  console.log("Seeding demo users...");
  const adminPasswordHash = await bcrypt.hash("StyleAIAdmin123!", 10);
  const userPasswordHash = await bcrypt.hash("StyleAIDemo123!", 10);

  await db.user.upsert({
    where: { email: "admin@styleai.app" },
    update: {},
    create: {
      email: "admin@styleai.app",
      name: "StyleAI Admin",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
      subscription: { create: { plan: "PRO", status: "ACTIVE" } },
    },
  });

  await db.user.upsert({
    where: { email: "demo@styleai.app" },
    update: {},
    create: {
      email: "demo@styleai.app",
      name: "Demo User",
      role: "USER",
      passwordHash: userPasswordHash,
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

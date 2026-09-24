import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group"); // TOP | BOTTOM | FOOTWEAR | ACCESSORY

    const [categories, colors, brands, items] = await Promise.all([
      db.category.findMany({ orderBy: { name: "asc" } }),
      db.color.findMany({ orderBy: { name: "asc" } }),
      db.brand.findMany({ orderBy: { name: "asc" } }),
      db.clothingItem.findMany({
        where: { isActive: true, ...(group ? { category: { group: group as never } } : {}) },
        include: { category: true, color: true, brand: true },
        orderBy: { name: "asc" },
        take: 200,
      }),
    ]);

    return apiOk({ categories, colors, brands, items });
  } catch (err) {
    return apiError(err);
  }
}

import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { productFilterSchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = productFilterSchema.parse({
      budgetMax: searchParams.get("budgetMax") ?? undefined,
      brandId: searchParams.get("brandId") ?? undefined,
      colorName: searchParams.get("colorName") ?? undefined,
      categorySlug: searchParams.get("categorySlug") ?? undefined,
    });

    const products = await db.product.findMany({
      where: {
        inStock: true,
        ...(filters.budgetMax ? { price: { lte: filters.budgetMax } } : {}),
        ...(filters.brandId ? { brandId: filters.brandId } : {}),
        ...(filters.colorName ? { colorName: { equals: filters.colorName, mode: "insensitive" } } : {}),
        ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      },
      include: { brand: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return apiOk({ products });
  } catch (err) {
    return apiError(err);
  }
}

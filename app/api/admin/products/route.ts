import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

const productSchema = z.object({
  name: z.string().min(1).max(160),
  brandId: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  colorName: z.string().max(60).optional().nullable(),
  price: z.number().int().positive().optional().nullable(),
  currency: z.string().max(6).optional(),
  sizeOptions: z.array(z.string()).max(20).optional(),
  imageUrl: z.string().url().optional().nullable(),
  affiliateUrl: z.string().url().optional().nullable(),
  source: z.string().max(60).optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  inStock: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const products = await db.product.findMany({
      include: { brand: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return apiOk({ products });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = productSchema.parse(await req.json());
    const product = await db.product.create({ data });
    return apiOk({ product }, 201);
  } catch (err) {
    return apiError(err);
  }
}

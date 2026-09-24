import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

const updateSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  price: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  affiliateUrl: z.string().url().optional().nullable(),
  inStock: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const data = updateSchema.parse(await req.json());
    const product = await db.product.update({ where: { id }, data });
    return apiOk({ product });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    await db.product.delete({ where: { id } });
    return apiOk({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}

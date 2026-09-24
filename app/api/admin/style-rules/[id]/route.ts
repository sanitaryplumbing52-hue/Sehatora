import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  conditions: z.unknown().optional(),
  actions: z.unknown().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const data = updateSchema.parse(await req.json());
    const rule = await db.styleRule.update({ where: { id }, data: data as never });
    return apiOk({ rule });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    await db.styleRule.delete({ where: { id } });
    return apiOk({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}

import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

const styleRuleSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  conditions: z.unknown(),
  actions: z.unknown(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const rules = await db.styleRule.findMany({ orderBy: { priority: "desc" } });
    return apiOk({ rules });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = styleRuleSchema.parse(await req.json());
    const rule = await db.styleRule.create({ data: data as never });
    return apiOk({ rule }, 201);
  } catch (err) {
    return apiError(err);
  }
}

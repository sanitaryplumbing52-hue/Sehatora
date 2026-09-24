import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { adminColorSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const colors = await db.color.findMany({ orderBy: { name: "asc" } });
    return apiOk({ colors });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = adminColorSchema.parse(await req.json());
    const color = await db.color.create({ data });
    return apiOk({ color }, 201);
  } catch (err) {
    return apiError(err);
  }
}

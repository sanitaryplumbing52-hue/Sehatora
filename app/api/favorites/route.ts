import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { favoriteSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const favorites = await db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return apiOk({ favorites });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { targetType, targetId } = favoriteSchema.parse(await req.json());
    const favorite = await db.favorite.upsert({
      where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
      update: {},
      create: { userId: user.id, targetType, targetId },
    });
    return apiOk({ favorite });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { targetType, targetId } = favoriteSchema.parse(await req.json());
    await db.favorite.deleteMany({ where: { userId: user.id, targetType, targetId } });
    return apiOk({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}

import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return apiOk({ users });
  } catch (err) {
    return apiError(err);
  }
}

const patchSchema = z.object({ userId: z.string().min(1), role: z.enum(["USER", "ADMIN"]) });

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const { userId, role } = patchSchema.parse(await req.json());
    const user = await db.user.update({ where: { id: userId }, data: { role } });
    await db.auditLog.create({
      data: { actorId: admin.id, action: "user.role.update", targetType: "User", targetId: userId, metadata: { role } },
    });
    return apiOk({ user });
  } catch (err) {
    return apiError(err);
  }
}

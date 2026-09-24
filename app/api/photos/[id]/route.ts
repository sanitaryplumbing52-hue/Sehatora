import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { getStorageProvider } from "@/lib/storage";

/** User-controlled photo deletion (section 14, PHOTO PRIVACY) — hard-deletes the object and marks the record deleted. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const photo = await db.photo.findFirst({ where: { id, userId: user.id } });
    if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

    const storage = getStorageProvider();
    await storage.deleteObject(photo.storageKey);
    await db.photo.update({ where: { id: photo.id }, data: { status: "DELETED", url: "" } });

    return apiOk({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}

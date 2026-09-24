import { db } from "@/lib/db";
import { getAIProvider } from "@/ai";
import type { OutfitItemSelection } from "@/ai/types";

export async function createTryOnJob(params: {
  userId: string;
  photoId: string;
  outfitId?: string;
  items: OutfitItemSelection[];
}) {
  return db.tryOnSession.create({
    data: {
      userId: params.userId,
      photoId: params.photoId,
      outfitId: params.outfitId,
      selectedItems: params.items as unknown as object,
      status: "QUEUED",
      provider: getAIProvider().name,
    },
  });
}

export async function processTryOnJob(sessionId: string): Promise<void> {
  const session = await db.tryOnSession.findUnique({ where: { id: sessionId }, include: { photo: true } });
  if (!session) return;

  await db.tryOnSession.update({ where: { id: sessionId }, data: { status: "PROCESSING" } });

  try {
    const provider = getAIProvider();
    const items = session.selectedItems as unknown as OutfitItemSelection[];
    const result = await provider.virtualTryOn({ personImageUrl: session.photo.url, items });

    await db.tryOnSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", resultImageUrl: result.resultImageUrl, completedAt: new Date() },
    });
  } catch (err) {
    await db.tryOnSession.update({
      where: { id: sessionId },
      data: {
        status: "FAILED",
        errorMessage: "Something went wrong. Try generating the look again.",
        retryCount: { increment: 1 },
        completedAt: new Date(),
      },
    });
  }
}

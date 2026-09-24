import { db } from "@/lib/db";
import { runPhotoAnalysisPipeline } from "@/lib/pipeline/orchestrator";
import { PipelineError } from "@/lib/pipeline/types";
import { getColorRecommendations, persistColorRecommendations } from "@/services/color-engine";
import { getAIProvider } from "@/ai";

export async function createAnalysisJob(userId: string, photoId: string) {
  return db.aIGeneration.create({
    data: { userId, type: "IMAGE_ANALYSIS", provider: getAIProvider().name, status: "QUEUED", input: { photoId } },
  });
}

/**
 * Runs the full CV pipeline for a queued analysis job and persists the
 * resulting StyleProfile + color recommendations. Designed to be safe to
 * call inline (small/demo deployments) or from a background worker queue
 * (production — see docs/ARCHITECTURE.md, AI GENERATION JOB SYSTEM).
 */
export async function processAnalysisJob(jobId: string): Promise<void> {
  const job = await db.aIGeneration.findUnique({ where: { id: jobId } });
  if (!job) return;

  await db.aIGeneration.update({ where: { id: jobId }, data: { status: "PROCESSING" } });
  const startedAt = Date.now();

  try {
    const photoId = (job.input as { photoId: string }).photoId;
    const photo = await db.photo.findUniqueOrThrow({ where: { id: photoId } });

    const { analysis, stages } = await runPhotoAnalysisPipeline(photo.url);

    await db.styleProfile.upsert({
      where: { userId: job.userId },
      update: {
        sourcePhotoId: photo.id,
        bodyShape: analysis.bodyShape,
        shoulderRatio: analysis.shoulderRatio,
        torsoRatio: analysis.torsoRatio,
        legRatio: analysis.legRatio,
        heightCategory: analysis.heightCategory,
        skinTone: analysis.skinTone,
        undertone: analysis.undertone,
        hairColor: analysis.hairColor,
        beardPresence: analysis.beardPresence,
        dominantColors: analysis.dominantColors,
        confidence: analysis.confidence,
      },
      create: {
        userId: job.userId,
        sourcePhotoId: photo.id,
        bodyShape: analysis.bodyShape,
        shoulderRatio: analysis.shoulderRatio,
        torsoRatio: analysis.torsoRatio,
        legRatio: analysis.legRatio,
        heightCategory: analysis.heightCategory,
        skinTone: analysis.skinTone,
        undertone: analysis.undertone,
        hairColor: analysis.hairColor,
        beardPresence: analysis.beardPresence,
        dominantColors: analysis.dominantColors,
        confidence: analysis.confidence,
      },
    });

    const colorSet = await getColorRecommendations(analysis.undertone);
    await persistColorRecommendations(job.userId, colorSet);

    await db.aIGeneration.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        output: { analysis, stages } as object,
        latencyMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const message = err instanceof PipelineError ? err.userMessage : "Something went wrong. Try generating the look again.";
    await db.aIGeneration.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: message, completedAt: new Date(), latencyMs: Date.now() - startedAt },
    });
  }
}

import sharp from "sharp";
import type { ImageAnalysisResult } from "@/ai/types";
import { PipelineError } from "./types";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const MIN_WIDTH = 480;
const MIN_HEIGHT = 640;

export interface FileMeta {
  type: string;
  size: number;
}

/** Step 1 — Image Validation: mime type + size limits, before anything else runs. */
export function validateImageFile(file: FileMeta): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new PipelineError(
      "Please upload a JPG, PNG, or WebP photo.",
      "VALIDATION"
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new PipelineError("That photo is too large. Please upload a file under 15MB.", "VALIDATION");
  }
}

/** Step 2 — Image Quality Check: resolution + basic brightness/contrast sanity. */
export async function assessImageQuality(buffer: Buffer): Promise<{ width: number; height: number }> {
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch (err) {
    throw new PipelineError("Please upload a clear full-body photo.", "QUALITY_CHECK", err);
  }

  const { width = 0, height = 0 } = metadata;
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    throw new PipelineError(
      "Please upload a clear full-body photo with higher resolution.",
      "QUALITY_CHECK"
    );
  }

  const stats = await sharp(buffer).stats();
  const avgBrightness =
    stats.channels.slice(0, 3).reduce((sum, c) => sum + c.mean, 0) / Math.min(3, stats.channels.length);
  if (avgBrightness < 20 || avgBrightness > 245) {
    throw new PipelineError(
      "Please upload a well-lit, clear full-body photo.",
      "QUALITY_CHECK"
    );
  }

  return { width, height };
}

/** Step 3 — Person Detection: exactly one person must be present. */
export function assertSinglePerson(analysis: ImageAnalysisResult): void {
  if (analysis.personCount === 0) {
    throw new PipelineError("We couldn't detect a person in this photo. Please try another.", "PERSON_DETECTION");
  }
  if (analysis.personCount > 1) {
    throw new PipelineError("Please upload a photo with only one person.", "PERSON_DETECTION");
  }
  if (analysis.qualityScore < 0.4) {
    throw new PipelineError("Please upload a clear full-body photo.", "PERSON_DETECTION");
  }
}

/**
 * Step 4 — Segmentation: isolate the subject from the background.
 * In DEMO MODE this is a pass-through flag; a production deployment swaps
 * in a real matting/segmentation model here without touching callers.
 */
export function runSegmentation(analysis: ImageAnalysisResult) {
  return { silhouetteDetected: analysis.personCount === 1, backgroundPreserved: true };
}

/** Step 5 — Pose / body landmark detection → proportion estimates. */
export function extractBodyProportions(analysis: ImageAnalysisResult) {
  return {
    bodyShape: analysis.bodyShape,
    shoulderRatio: analysis.shoulderRatio,
    torsoRatio: analysis.torsoRatio,
    legRatio: analysis.legRatio,
    heightCategory: analysis.heightCategory,
  };
}

/** Step 6 — Clothing detection on the current outfit. */
export function extractDetectedClothing(analysis: ImageAnalysisResult) {
  return analysis.detectedClothing;
}

/** Step 7 & 8 — Style + color analysis: skin tone, undertone, hair, palette. */
export function extractStyleAndColor(analysis: ImageAnalysisResult) {
  return {
    skinTone: analysis.skinTone,
    undertone: analysis.undertone,
    hairColor: analysis.hairColor,
    beardPresence: analysis.beardPresence,
    dominantColors: analysis.dominantColors,
  };
}

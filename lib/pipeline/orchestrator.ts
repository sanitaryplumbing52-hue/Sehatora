import { getAIProvider } from "@/ai";
import {
  assertSinglePerson,
  extractBodyProportions,
  extractDetectedClothing,
  extractStyleAndColor,
  runSegmentation,
} from "./steps";
import { PipelineError, type PhotoAnalysisPipelineResult, type PipelineStage, type PipelineStageLog } from "./types";

/**
 * USER PHOTO → Validation → Quality Check → Person Detection → Segmentation
 * → Pose/Landmark Detection → Clothing Detection → Style Analysis → Color
 * Analysis → (Recommendation Engine runs separately, see services/) → Final
 * profile.
 *
 * File-level validation and the quality check happen before this is called
 * (at upload time, see app/api/photos/upload). This orchestrator covers the
 * AI-driven stages and produces a stage log so the UI can show live
 * progress ("Creating your personal style profile...").
 */
export async function runPhotoAnalysisPipeline(imageUrl: string): Promise<PhotoAnalysisPipelineResult> {
  const provider = getAIProvider();
  const stages: PipelineStageLog[] = [];

  const log = (stage: PipelineStage, status: PipelineStageLog["status"], message: string) => {
    stages.push({ stage, status, message });
  };

  log("PERSON_DETECTION", "RUNNING", "Detecting you in the frame...");
  const analysis = await provider.analyzeImage({ imageUrl });

  try {
    assertSinglePerson(analysis);
  } catch (err) {
    log("PERSON_DETECTION", "FAILED", err instanceof PipelineError ? err.userMessage : "Analysis failed.");
    throw err;
  }
  log("PERSON_DETECTION", "DONE", "Person detected.");

  log("SEGMENTATION", "RUNNING", "Isolating your silhouette...");
  runSegmentation(analysis);
  log("SEGMENTATION", "DONE", "Silhouette isolated.");

  log("POSE_DETECTION", "RUNNING", "Mapping body proportions...");
  extractBodyProportions(analysis);
  log("POSE_DETECTION", "DONE", "Body proportions mapped.");

  log("CLOTHING_DETECTION", "RUNNING", "Reading your current outfit...");
  extractDetectedClothing(analysis);
  log("CLOTHING_DETECTION", "DONE", "Outfit read.");

  log("STYLE_ANALYSIS", "RUNNING", "Creating your personal style profile...");
  extractStyleAndColor(analysis);
  log("STYLE_ANALYSIS", "DONE", "Style profile drafted.");

  log("COLOR_ANALYSIS", "RUNNING", "Matching your color palette...");
  log("COLOR_ANALYSIS", "DONE", "Color palette matched.");

  return { analysis, stages };
}

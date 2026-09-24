import type { ImageAnalysisResult } from "@/ai/types";

export const PIPELINE_STAGES = [
  "VALIDATION",
  "QUALITY_CHECK",
  "PERSON_DETECTION",
  "SEGMENTATION",
  "POSE_DETECTION",
  "CLOTHING_DETECTION",
  "STYLE_ANALYSIS",
  "COLOR_ANALYSIS",
  "RECOMMENDATION",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  VALIDATION: "Validating your photo...",
  QUALITY_CHECK: "Checking photo quality...",
  PERSON_DETECTION: "Detecting you in the frame...",
  SEGMENTATION: "Isolating your silhouette...",
  POSE_DETECTION: "Mapping body proportions...",
  CLOTHING_DETECTION: "Reading your current outfit...",
  STYLE_ANALYSIS: "Creating your personal style profile...",
  COLOR_ANALYSIS: "Matching your color palette...",
  RECOMMENDATION: "Finalizing your recommendations...",
};

export interface PipelineStageLog {
  stage: PipelineStage;
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  message: string;
}

export class PipelineError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly stage: PipelineStage,
    cause?: unknown
  ) {
    super(userMessage);
    this.cause = cause;
  }
}

export interface PhotoAnalysisPipelineResult {
  analysis: ImageAnalysisResult;
  stages: PipelineStageLog[];
}

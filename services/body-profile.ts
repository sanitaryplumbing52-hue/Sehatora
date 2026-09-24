const FIT_GUIDANCE: Record<string, string> = {
  Rectangle: "Your shoulders, waist, and hips are close in width. Structured layers (blazers, overshirts) and straight-leg bottoms add definition.",
  Triangle: "Your hips are slightly wider than your shoulders. Structured shoulders (polos, blazers) and relaxed-leg bottoms create balance.",
  "Inverted Triangle": "Your shoulders are broader than your hips. Softer, unstructured tops and tapered or straight bottoms even out your frame.",
  Oval: "Your midsection carries more visual weight. Vertical lines, open layers, and straight-leg bottoms create a longer, leaner line.",
  Trapezoid: "Your shoulders and hips are proportional with a defined waist — most fits and silhouettes work well; slim through the body reads sharpest.",
};

export function buildFitGuidance(bodyShape?: string | null): string {
  if (!bodyShape) return "Complete your style profile for tailored fit guidance.";
  return FIT_GUIDANCE[bodyShape] ?? "A regular, balanced fit works well for your proportions.";
}

export function buildProportionSummary(params: {
  shoulderRatio?: number | null;
  torsoRatio?: number | null;
  legRatio?: number | null;
}): string[] {
  const notes: string[] = [];
  if (params.shoulderRatio != null) {
    notes.push(params.shoulderRatio > 1.05 ? "Broader shoulder line" : "Balanced shoulder line");
  }
  if (params.torsoRatio != null) {
    notes.push(params.torsoRatio > 1.05 ? "Longer torso" : "Balanced torso");
  }
  if (params.legRatio != null) {
    notes.push(params.legRatio > 1.05 ? "Longer leg line" : "Balanced leg line");
  }
  return notes;
}

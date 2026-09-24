import type { StyleProfileSnapshot } from "@/ai/types";

export interface StyleMatchBreakdown {
  colorMatch: number; // 0..100
  fitCompatibility: number;
  occasionMatch: number;
  stylePreferenceMatch: number;
  overall: number;
  explanation: string[];
}

/**
 * "Style Match" — a measurable compatibility score, never framed as a
 * judgment on attractiveness (section 12). Every sub-score has a plain-
 * language explanation the UI surfaces alongside the number.
 */
export function computeStyleMatch(params: {
  profile: StyleProfileSnapshot;
  outfitColorNames: string[];
  occasion?: string;
  style?: string;
}): StyleMatchBreakdown {
  const { profile, outfitColorNames, occasion, style } = params;
  const explanation: string[] = [];

  const preferredColorFamily = profile.dominantColors ?? [];
  const colorMatch = preferredColorFamily.length
    ? Math.min(100, 55 + outfitColorNames.length * 8)
    : 68;
  explanation.push(
    colorMatch >= 75
      ? "These colors align with your recommended palette."
      : "These colors are a safe neutral pairing for your palette."
  );

  const fitCompatibility = profile.bodyShape ? 78 : 65;
  explanation.push(
    profile.bodyShape
      ? `Fit is tailored for a ${profile.bodyShape.toLowerCase()} body shape.`
      : "General fit guidance applied — complete your style profile for tailored fit scoring."
  );

  const occasionMatch = occasion ? 82 : 60;
  explanation.push(
    occasion ? `Matched to your selected occasion: ${occasion}.` : "No occasion selected — using general styling rules."
  );

  const stylePreferenceMatch =
    style && profile.fashionProfiles?.some((p) => p.toLowerCase().includes(style.toLowerCase()))
      ? 90
      : style
        ? 70
        : 62;
  explanation.push(
    stylePreferenceMatch >= 85
      ? `Strong match with your ${style} style preference.`
      : "Partially matched to your stated style preferences."
  );

  const overall = Math.round((colorMatch + fitCompatibility + occasionMatch + stylePreferenceMatch) / 4);

  return { colorMatch, fitCompatibility, occasionMatch, stylePreferenceMatch, overall, explanation };
}

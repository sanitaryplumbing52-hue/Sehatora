// AI abstraction layer — shared types.
//
// Every capability the platform needs from an AI system is expressed here as
// a plain input/output contract. Concrete providers (demo, OpenAI, a
// dedicated virtual try-on vendor, ...) implement `AIProvider`. Nothing
// outside `ai/` and the provider files should import a vendor SDK directly —
// application code always talks to `AIProvider`.

export type Undertone = "WARM" | "COOL" | "NEUTRAL";
export type HeightCategory = "short" | "average" | "tall";

export interface ImageAnalysisInput {
  /** Signed/accessible URL of the validated user photo. */
  imageUrl: string;
}

export interface ImageAnalysisResult {
  personCount: number;
  qualityScore: number; // 0..1, higher is better
  bodyShape: string;
  shoulderRatio: number;
  torsoRatio: number;
  legRatio: number;
  heightCategory: HeightCategory;
  skinTone: string;
  undertone: Undertone;
  hairColor: string;
  beardPresence: boolean;
  dominantColors: string[];
  detectedClothing: string[];
  confidence: number; // 0..1
}

export interface OutfitItemSelection {
  slot: "TOP" | "BOTTOM" | "FOOTWEAR" | "ACCESSORY";
  clothingItemId: string;
  name: string;
  colorHex?: string;
  categorySlug: string;
}

export interface VirtualTryOnInput {
  personImageUrl: string;
  items: OutfitItemSelection[];
}

export interface VirtualTryOnResult {
  resultImageUrl: string;
  confidence: number;
  notes?: string;
}

export interface ImageGenerationInput {
  prompt: string;
  referenceImageUrl?: string;
  width?: number;
  height?: number;
}

export interface ImageGenerationResult {
  imageUrl: string;
}

export interface StyleProfileSnapshot {
  bodyShape?: string | null;
  undertone?: Undertone | null;
  skinTone?: string | null;
  dominantColors?: string[];
  fashionProfiles?: string[];
  preferredBrands?: string[];
  budgetMax?: number | null;
}

export interface StyleRecommendationInput {
  styleProfile: StyleProfileSnapshot;
  occasion?: string;
  weather?: string;
  style?: string;
  colorFocus?: string;
  count?: number;
}

export interface OutfitSuggestionItem {
  slot: "TOP" | "BOTTOM" | "FOOTWEAR" | "ACCESSORY";
  label: string;
  colorName?: string;
}

export interface OutfitSuggestion {
  name: string;
  items: OutfitSuggestionItem[];
  styleMatch: number; // 0..100
  reasoning: string;
}

export interface StyleRecommendationResult {
  outfits: OutfitSuggestion[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface TextGenerationInput {
  messages: ChatMessage[];
  styleProfile?: StyleProfileSnapshot;
  maxTokens?: number;
}

export interface TextGenerationResult {
  content: string;
}

/**
 * Provider-agnostic contract for every AI capability STYLEAI needs.
 * Implementations live in `ai/providers/*`. Select the active one via
 * `getAIProvider()` in `ai/index.ts` — driven by the `AI_PROVIDER` env var
 * or the `ai_provider` AdminSetting, never hard-coded at call sites.
 */
export interface AIProvider {
  readonly name: string;

  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult>;
  virtualTryOn(input: VirtualTryOnInput): Promise<VirtualTryOnResult>;
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult>;
  recommendStyle(input: StyleRecommendationInput): Promise<StyleRecommendationResult>;
  generateText(input: TextGenerationInput): Promise<TextGenerationResult>;
}

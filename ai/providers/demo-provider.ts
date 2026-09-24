import type {
  AIProvider,
  ImageAnalysisInput,
  ImageAnalysisResult,
  VirtualTryOnInput,
  VirtualTryOnResult,
  ImageGenerationInput,
  ImageGenerationResult,
  StyleRecommendationInput,
  StyleRecommendationResult,
  TextGenerationInput,
  TextGenerationResult,
  OutfitSuggestion,
  Undertone,
} from "@/ai/types";

// --- deterministic pseudo-random helpers -----------------------------------
// The demo provider never calls a real model. It derives stable, believable
// outputs from a hash of the input so the same photo always analyzes the
// same way in DEMO MODE, without needing any external API key.

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}

const BODY_SHAPES = ["Rectangle", "Triangle", "Inverted Triangle", "Oval", "Trapezoid"];
const SKIN_TONES = ["Fair", "Light", "Medium", "Olive", "Tan", "Deep"];
const HAIR_COLORS = ["Black", "Dark Brown", "Brown", "Auburn", "Grey"];
const UNDERTONES: Undertone[] = ["WARM", "COOL", "NEUTRAL"];
const HEIGHT_CATEGORIES = ["short", "average", "tall"] as const;
const CLOTHING_GUESSES = ["T-shirt", "Shirt", "Jacket", "Hoodie", "Polo"];

const PALETTES: Record<Undertone, string[]> = {
  WARM: ["#C19A6B", "#C99A2E", "#6B6E3A", "#F1E7D0", "#5A3A22"],
  COOL: ["#1B2A4A", "#233A5E", "#36393D", "#0E6B4C", "#6E1F2A"],
  NEUTRAL: ["#111111", "#FFFFFF", "#8C8C8C", "#D9C7A7", "#C7CBD1"],
};

export class DemoAIProvider implements AIProvider {
  readonly name = "demo";

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    const rng = mulberry32(hashString(input.imageUrl));
    const undertone = pick(rng, UNDERTONES);

    return {
      personCount: 1,
      qualityScore: 0.72 + rng() * 0.25,
      bodyShape: pick(rng, BODY_SHAPES),
      shoulderRatio: Number((0.85 + rng() * 0.3).toFixed(2)),
      torsoRatio: Number((0.9 + rng() * 0.25).toFixed(2)),
      legRatio: Number((0.95 + rng() * 0.3).toFixed(2)),
      heightCategory: pick(rng, [...HEIGHT_CATEGORIES]),
      skinTone: pick(rng, SKIN_TONES),
      undertone,
      hairColor: pick(rng, HAIR_COLORS),
      beardPresence: rng() > 0.5,
      dominantColors: PALETTES[undertone].slice(0, 3),
      detectedClothing: [pick(rng, CLOTHING_GUESSES)],
      confidence: Number((0.78 + rng() * 0.18).toFixed(2)),
    };
  }

  async virtualTryOn(input: VirtualTryOnInput): Promise<VirtualTryOnResult> {
    // DEMO MODE: no image compositing model is called. We return the
    // original photo as a stand-in "result" and mark confidence lower so the
    // UI can clearly label it as a preview, not a production try-on render.
    // A production provider (see ai/providers/README.md) replaces this with
    // a real garment-aware diffusion / try-on API call.
    const rng = mulberry32(hashString(input.personImageUrl + input.items.map((i) => i.clothingItemId).join(",")));
    return {
      resultImageUrl: input.personImageUrl,
      confidence: Number((0.55 + rng() * 0.2).toFixed(2)),
      notes: "DEMO MODE preview — connect a production virtual try-on provider for photorealistic renders.",
    };
  }

  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const seed = hashString(input.prompt).toString(16).slice(0, 8);
    return {
      imageUrl: `https://picsum.photos/seed/styleai-${seed}/800/1000`,
    };
  }

  async recommendStyle(input: StyleRecommendationInput): Promise<StyleRecommendationResult> {
    const { buildOutfitSuggestions } = await import("@/services/outfit-generator");
    const outfits: OutfitSuggestion[] = await buildOutfitSuggestions(input);
    return { outfits };
  }

  async generateText(input: TextGenerationInput): Promise<TextGenerationResult> {
    const { answerStyleQuestion } = await import("@/services/style-chat");
    const content = answerStyleQuestion(input);
    return { content };
  }
}

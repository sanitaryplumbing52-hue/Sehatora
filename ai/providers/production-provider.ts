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
} from "@/ai/types";

/**
 * Production AI provider.
 *
 * Wires STYLEAI's AIProvider contract to real, documented third-party APIs:
 *
 *  - Text generation + image analysis: OpenAI Chat Completions (vision-capable
 *    model). Env: `OPENAI_API_KEY`, optional `OPENAI_MODEL` (default
 *    "gpt-4o-mini").
 *  - Image generation: OpenAI Images API. Env: `OPENAI_IMAGE_MODEL`
 *    (default "gpt-image-1").
 *  - Virtual try-on: Replicate predictions API, pointed at a garment-aware
 *    try-on model (e.g. an IDM-VTON / CatVTON deployment). Env:
 *    `REPLICATE_API_TOKEN`, `REPLICATE_TRYON_MODEL_VERSION`.
 *
 * None of these calls run unless the corresponding env vars are set —
 * `getAIProvider()` in `ai/index.ts` only selects this provider when
 * `AI_PROVIDER=production` (or a matching AdminSetting) AND the required
 * credentials are present. Swap any of these integrations for a different
 * vendor by editing only this file — the rest of the app never changes.
 */
export class ProductionAIProvider implements AIProvider {
  readonly name = "production";

  private get openaiKey() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not configured");
    return key;
  }

  private get openaiModel() {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.openaiModel,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a fashion computer-vision assistant. Analyze the uploaded full-body photo and return ONLY a JSON object with keys: personCount (int), qualityScore (0-1), bodyShape (string), shoulderRatio (number), torsoRatio (number), legRatio (number), heightCategory ('short'|'average'|'tall'), skinTone (string), undertone ('WARM'|'COOL'|'NEUTRAL'), hairColor (string), beardPresence (bool), dominantColors (array of hex strings), detectedClothing (array of strings), confidence (0-1). Never comment on attractiveness, age, ethnicity assumptions, or any sensitive/protected attribute beyond what is listed.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this photo for a fashion styling app." },
              { type: "image_url", image_url: { url: input.imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI image analysis failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI image analysis returned no content");
    return JSON.parse(content) as ImageAnalysisResult;
  }

  async virtualTryOn(input: VirtualTryOnInput): Promise<VirtualTryOnResult> {
    const token = process.env.REPLICATE_API_TOKEN;
    const version = process.env.REPLICATE_TRYON_MODEL_VERSION;
    if (!token || !version) {
      throw new Error(
        "Virtual try-on is not configured. Set REPLICATE_API_TOKEN and REPLICATE_TRYON_MODEL_VERSION to a garment-aware try-on model deployment."
      );
    }

    const create = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version,
        input: {
          human_img: input.personImageUrl,
          garment_items: input.items.map((i) => ({ name: i.name, slot: i.slot, color: i.colorHex })),
        },
      }),
    });

    if (!create.ok) {
      throw new Error(`Replicate try-on request failed: ${create.status} ${await create.text()}`);
    }
    let prediction = await create.json();

    const deadline = Date.now() + 90_000;
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Token ${token}` },
      });
      prediction = await poll.json();
    }

    if (prediction.status !== "succeeded") {
      throw new Error(`Virtual try-on generation did not complete: ${prediction.status}`);
    }

    const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    return { resultImageUrl: output, confidence: 0.9 };
  }

  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        size: `${input.width ?? 1024}x${input.height ?? 1024}`,
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI image generation failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    return { imageUrl: url ?? `data:image/png;base64,${b64}` };
  }

  async recommendStyle(input: StyleRecommendationInput): Promise<StyleRecommendationResult> {
    const text = await this.generateText({
      messages: [
        {
          role: "system",
          content:
            "You are a professional fashion stylist. Given a style profile and constraints, return ONLY a JSON object: { outfits: [{ name, items: [{slot, label, colorName}], styleMatch (0-100), reasoning }] }.",
        },
        { role: "user", content: JSON.stringify(input) },
      ],
    });
    return JSON.parse(text.content) as StyleRecommendationResult;
  }

  async generateText(input: TextGenerationInput): Promise<TextGenerationResult> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.openaiModel,
        max_tokens: input.maxTokens ?? 600,
        messages: input.messages,
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI text generation failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content ?? "" };
  }
}

import type { AIProvider } from "@/ai/types";
import { DemoAIProvider } from "@/ai/providers/demo-provider";
import { ProductionAIProvider } from "@/ai/providers/production-provider";

export * from "@/ai/types";

let cached: AIProvider | null = null;

/**
 * Resolves the active AI provider.
 *
 * Selection order: `AI_PROVIDER` env var ("demo" | "production") — falls
 * back to "demo" whenever production credentials are missing, so the app
 * always runs even before real AI vendors are configured (see section 32,
 * DEMO MODE, in the product spec). Admins can later drive this from
 * `AdminSetting("ai_provider")` instead of an env var by wiring that lookup
 * in here without touching any caller.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const requested = (process.env.AI_PROVIDER || "demo").toLowerCase();

  if (requested === "production" && process.env.OPENAI_API_KEY) {
    cached = new ProductionAIProvider();
  } else {
    cached = new DemoAIProvider();
  }

  return cached;
}

export function isDemoMode(): boolean {
  return getAIProvider().name === "demo";
}

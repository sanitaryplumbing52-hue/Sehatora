import type { TextGenerationInput } from "@/ai/types";
import { buildFitGuidance } from "@/services/body-profile";

/**
 * DEMO MODE fashion assistant: rule-based intent matching over the user's
 * message, informed by their saved style profile. Production mode routes
 * the same `TextGenerationInput` through `ProductionAIProvider.generateText`
 * (a real LLM call) instead — see ai/providers/production-provider.ts.
 */
export function answerStyleQuestion(input: TextGenerationInput): string {
  const lastMessage = [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const q = lastMessage.toLowerCase();
  const profile = input.styleProfile;
  const undertone = profile?.undertone ?? "NEUTRAL";
  const bodyShape = profile?.bodyShape;

  if (q.includes("business meeting") || q.includes("office") || q.includes("work")) {
    return `For a business meeting, go with a light blue or white shirt, grey or navy formal trousers, and brown or black loafers. ${
      bodyShape ? buildFitGuidance(bodyShape) : ""
    } Add a simple watch — skip anything with a bold pattern.`;
  }

  if (q.includes("jeans")) {
    const shade = undertone === "WARM" ? "medium or dark blue" : undertone === "COOL" ? "dark blue or black" : "dark blue";
    return `Based on your color profile, ${shade} jeans in a straight or tapered fit will be the most versatile. Visit the Jeans Stylist for a full breakdown with virtual try-on.`;
  }

  if (q.includes("black") && (q.includes("suit") || q.includes("look good") || q.includes("wear"))) {
    if (undertone === "WARM") {
      return "Black can work for you, but it tends to read a little harsh against a warm undertone — try charcoal or navy as a softer alternative, and save black for accessories like your watch or belt.";
    }
    if (undertone === "COOL") {
      return "Yes — black pairs naturally with your cool undertone and works well as both a base and an accent color.";
    }
    return "Yes — black is a safe, versatile neutral for you and works well as both a base and an accent color.";
  }

  if (q.includes("dubai") && q.includes("summer")) {
    return "For Dubai summer heat: a light linen or cotton shirt in white or sky blue, tailored shorts or lightweight chinos in beige, and breathable sneakers or loafers. Keep fabrics light-colored and breathable.";
  }

  if (q.includes("under aed") || q.match(/under\s*\d+/)) {
    return "Head to the Outfit Generator and set your budget filter in Shopping Mode — I'll prioritize versatile basics (a tee, chinos, and sneakers) that stretch furthest within your budget.";
  }

  if (q.includes("premium") || q.includes("luxury") || q.includes("upgrade")) {
    return "To elevate this outfit: swap a basic tee for a structured overshirt or blazer, move from sneakers to leather loafers, and add one refined accessory like a metal watch — fewer, better pieces read as premium.";
  }

  if (q.includes("wear with") || q.includes("pair with") || q.includes("match")) {
    return "For a balanced pairing, stick to one neutral (navy, charcoal, beige, or white) for the other half of the outfit, then add a single accent color through your footwear or accessories.";
  }

  return "Tell me the occasion, weather, or item you're building around (e.g. \"business meeting\", \"jeans\", \"Dubai summer outfit\") and I'll tailor a recommendation to your style profile.";
}

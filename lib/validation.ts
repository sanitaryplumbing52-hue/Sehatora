import { z } from "zod";

export const stylePreferenceSchema = z.object({
  fashionProfiles: z.array(z.string()).max(11),
  favoriteOccasions: z.array(z.string()).max(12),
  budgetMax: z.number().int().positive().max(1_000_000).optional(),
  preferredBrands: z.array(z.string()).max(20),
  avoidColors: z.array(z.string()).max(20),
  notes: z.string().max(500).optional(),
});

export const outfitGenerateSchema = z.object({
  occasion: z.string().min(1).max(60),
  weather: z.string().min(1).max(60),
  style: z.string().min(1).max(60),
  colorFocus: z.string().max(60).optional(),
});

export const tryOnRequestSchema = z.object({
  photoId: z.string().min(1),
  items: z
    .array(
      z.object({
        slot: z.enum(["TOP", "BOTTOM", "FOOTWEAR", "ACCESSORY"]),
        clothingItemId: z.string().min(1),
      })
    )
    .min(1)
    .max(8),
  outfitId: z.string().optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  conversation: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(30)
    .optional(),
});

export const saveOutfitSchema = z.object({
  outfitId: z.string().min(1),
  note: z.string().max(300).optional(),
});

export const favoriteSchema = z.object({
  targetType: z.enum(["COLOR", "PRODUCT", "CLOTHING_ITEM", "OUTFIT"]),
  targetId: z.string().min(1),
});

export const productFilterSchema = z.object({
  budgetMax: z.coerce.number().int().positive().optional(),
  brandId: z.string().optional(),
  colorName: z.string().optional(),
  categorySlug: z.string().optional(),
});

export const adminClothingItemSchema = z.object({
  name: z.string().min(1).max(120),
  categoryId: z.string().min(1),
  brandId: z.string().optional().nullable(),
  colorId: z.string().optional().nullable(),
  fit: z.enum(["SLIM", "STRAIGHT", "RELAXED", "TAPERED", "REGULAR", "OVERSIZED"]).optional().nullable(),
  gender: z.string().max(20).optional(),
  imageUrl: z.string().url().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const adminColorSchema = z.object({
  name: z.string().min(1).max(60),
  hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color like #1B2A4A"),
  family: z.string().min(1).max(40),
  undertone: z.enum(["WARM", "COOL", "NEUTRAL"]),
  isNeutral: z.boolean().optional(),
});

export const adminSettingSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.unknown(),
});

export const signUpSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

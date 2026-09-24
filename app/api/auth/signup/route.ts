import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signUpSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api-response";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const limit = checkRateLimit(rateLimitKeyFromRequest(req, "signup"), 10, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
    }

    const body = await req.json();
    const { name, email, password } = signUpSchema.parse(body);

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        subscription: { create: { plan: "FREE", status: "ACTIVE" } },
      },
      select: { id: true, name: true, email: true },
    });

    return apiOk({ user });
  } catch (err) {
    return apiError(err);
  }
}

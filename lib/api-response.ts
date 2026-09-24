import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PipelineError } from "@/lib/pipeline/types";

/**
 * Converts any thrown error into a safe, user-facing JSON response.
 * Never leaks stack traces, DB errors, or provider error text to the client
 * (section 26, ERROR HANDLING) — those are logged server-side only.
 */
export function apiError(err: unknown): NextResponse {
  if (err instanceof PipelineError) {
    return NextResponse.json({ error: err.userMessage }, { status: 422 });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Some of the information provided is invalid." }, { status: 400 });
  }
  if (err instanceof Error && err.name === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  if (err instanceof Error && err.name === "FORBIDDEN") {
    return NextResponse.json({ error: "You don't have access to this resource." }, { status: 403 });
  }

  console.error("[api-error]", err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}

export function apiOk<T>(data: T, init?: number): NextResponse {
  return NextResponse.json(data, { status: init ?? 200 });
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2, ShieldCheck, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

const STAGE_MESSAGES = [
  "Uploading your photo...",
  "Detecting you in the frame...",
  "Isolating your silhouette...",
  "Mapping body proportions...",
  "Reading your current outfit...",
  "Creating your personal style profile...",
  "Matching your color palette...",
  "Finalizing your recommendations...",
];

type Step = "idle" | "uploading" | "analyzing" | "error";

export function TryFlow() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (stageRef.current) clearInterval(stageRef.current);
    };
  }, []);

  const onFileChange = useCallback((f: File | null) => {
    setFile(f);
    setError(null);
    if (f) setPreviewUrl(URL.createObjectURL(f));
  }, []);

  async function startAnalysis() {
    if (!file || !consent) return;
    setStep("uploading");
    setError(null);

    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("consent", "true");
      const uploadRes = await fetch("/api/photos/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed.");

      setStep("analyzing");
      setStageIndex(0);
      stageRef.current = setInterval(() => {
        setStageIndex((i) => Math.min(i + 1, STAGE_MESSAGES.length - 1));
      }, 700);

      const analysisRes = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: uploadData.photoId }),
      });
      const analysisData = await analysisRes.json();
      if (!analysisRes.ok) throw new Error(analysisData.error || "Analysis failed.");

      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(`/api/analysis/${analysisData.jobId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "COMPLETED") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (stageRef.current) clearInterval(stageRef.current);
          setStageIndex(STAGE_MESSAGES.length - 1);
          setTimeout(() => router.push("/style-profile"), 500);
        }
        if (statusData.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (stageRef.current) clearInterval(stageRef.current);
          setStep("error");
          setError(statusData.error || "Something went wrong. Try generating the look again.");
        }
      }, 1200);
    } catch (err) {
      if (stageRef.current) clearInterval(stageRef.current);
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (sessionStatus !== "loading" && !session?.user) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="pt-8">
          <p className="text-muted-foreground">Sign in to upload a photo and get your personalized style profile.</p>
          <Button className="mt-6" asChild>
            <Link href="/auth/signin?callbackUrl=/try">Sign in to continue</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "analyzing") {
    const progress = ((stageIndex + 1) / STAGE_MESSAGES.length) * 100;
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-6 pt-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <h2 className="font-serif text-xl font-semibold">Creating your personal style profile...</h2>
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">{STAGE_MESSAGES[stageIndex]}</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "error") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="space-y-4 pt-8">
          <XCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button
            onClick={() => {
              setStep("idle");
              setFile(null);
              setPreviewUrl(null);
            }}
          >
            Try another photo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="space-y-6 pt-8">
        <label
          htmlFor="photo-input"
          className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 transition-colors hover:border-accent"
        >
          {previewUrl ? (
            <Image src={previewUrl} alt="Preview" width={400} height={533} className="h-full w-full rounded-2xl object-cover" unoptimized />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload a clear, full-body photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP — or use your camera</p>
            </>
          )}
        </label>
        <input
          id="photo-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          capture="user"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />

        <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span className="text-muted-foreground">
            I consent to STYLEAI processing this photo with AI to generate my style profile. My photo stays
            private and I can delete it anytime.{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
          </span>
        </label>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Your photo is encrypted and never shown publicly.
        </div>

        <Button className="w-full" size="lg" disabled={!file || !consent || step === "uploading"} onClick={startAnalysis}>
          {step === "uploading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Analyze My Style
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

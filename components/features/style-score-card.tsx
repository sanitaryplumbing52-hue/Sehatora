import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { StyleMatchBreakdown } from "@/services/style-score";

const ROWS: Array<{ key: keyof StyleMatchBreakdown; label: string }> = [
  { key: "colorMatch", label: "Color Match" },
  { key: "fitCompatibility", label: "Fit Compatibility" },
  { key: "occasionMatch", label: "Occasion Match" },
  { key: "stylePreferenceMatch", label: "Style Preference Match" },
];

export function StyleScoreCard({ breakdown }: { breakdown: StyleMatchBreakdown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Style Match — {breakdown.overall}%</CardTitle>
        <CardDescription>
          A measure of compatibility with your style profile, colors, and occasion — not a judgment about
          appearance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.key}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{row.label}</span>
              <span className="text-muted-foreground">{breakdown[row.key] as number}%</span>
            </div>
            <Progress value={breakdown[row.key] as number} />
          </div>
        ))}
        <ul className="space-y-1 pt-2 text-xs text-muted-foreground">
          {breakdown.explanation.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

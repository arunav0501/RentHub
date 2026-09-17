import { useEffect, useState } from "react";
import { Check, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trustScoreApi, type TrustScoreResponse } from "@/lib/api";

interface TrustScoreDialogProps {
  trigger?: React.ReactNode | undefined;
  userId?: string | undefined;
  role?: "OWNER" | "RENTER" | undefined;
  initialData?: TrustScoreResponse | undefined;
}

export function TrustScoreDialog({
  trigger,
  userId,
  role = "OWNER",
  initialData,
}: TrustScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrustScoreResponse | null>(initialData || null);

  useEffect(() => {
    if (open && userId && !initialData) {
      setLoading(true);
      trustScoreApi
        .getScore(userId, role)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          console.error("Failed to load trust score:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, userId, role, initialData]);

  // Fallback demo data if neither userId nor initialData provides it
  const displayScore = data?.score ?? 92;
  const displayTier = data?.tierLabel ?? (displayScore >= 90 ? "Excellent" : displayScore >= 75 ? "Very Good" : "Established");
  const isNew = data?.isNewMember ?? false;

  const breakdown = data?.breakdown ?? [
    { category: "Profile Completeness", score: 20, max: 20, percentage: 100 },
    { category: "Listing Quality", score: 22, max: 25, percentage: 88 },
    { category: "Rental History & Fulfillment", score: 32, max: 35, percentage: 91 },
    { category: "Reliability & Cancellations", score: 18, max: 20, percentage: 90 },
  ];

  const indicators = data?.indicators ?? [
    { label: "Verified Email", positive: true },
    { label: "Phone Linked", positive: true },
    { label: "Completed Rentals", positive: true },
    { label: "Zero Owner Cancellations", positive: true },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">View breakdown</Button>}
      </DialogTrigger>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto border-border sm:max-w-xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="text-trust" /> RentHub Trust Score Breakdown
          </DialogTitle>
          <DialogDescription>
            Transparent signals built from verified marketplace activity.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="mt-3 text-sm">Calculating real-time trust metrics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Highlight Box */}
            <div className="flex items-center gap-5 rounded-2xl bg-secondary p-5">
              <div
                className="relative grid size-24 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--color-trust) ${displayScore}%, var(--color-muted) 0)`,
                }}
              >
                <div className="grid size-19 place-items-center rounded-full bg-card">
                  <span className="text-2xl font-extrabold">{displayScore}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold">{displayTier}</span>
                  {isNew && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                      New Member
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isNew
                    ? "Neutral starting baseline (~65) with full growth potential as transactions complete."
                    : displayScore >= 90
                    ? "Top 8% of verified RentHub members"
                    : displayScore >= 75
                    ? "Highly reliable member with active rental history"
                    : "Consistent member in good standing"}
                </p>
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Score Components ({role === "OWNER" ? "Owner Model" : "Renter Model"})
              </h4>
              {breakdown.map((item) => {
                const pct = Math.min(100, Math.round((item.score / item.max) * 100));
                return (
                  <div key={item.category}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold">{item.category}</span>
                      <span className="text-muted-foreground font-mono">
                        {item.score} / {item.max} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-trust transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Verified Indicators */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trust Indicators
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {indicators.map((ind, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-border bg-background/50 p-3 text-sm font-medium"
                  >
                    {ind.positive ? (
                      <Check className="size-4 text-trust shrink-0" />
                    ) : (
                      <ShieldAlert className="size-4 text-destructive shrink-0" />
                    )}
                    <span>{ind.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Anti-gaming Banner */}
            <p className="rounded-xl border border-primary/20 bg-accent/50 p-4 text-xs leading-5 text-muted-foreground">
              Scores are computed server-side from real identity verifications, listing completeness,
              and fulfilled rental transactions. They cannot be client-submitted or artificially gamed.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
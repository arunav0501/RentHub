import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Compass,
  HelpCircle,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/renthub/AppHeader";
import { PlannedProductCard } from "@/components/trip-planner/PlannedProductCard";
import { RentalPlanDrawer } from "@/components/trip-planner/RentalPlanDrawer";
import { RequirementItem } from "@/components/trip-planner/RequirementItem";
import { TripSummaryCard } from "@/components/trip-planner/TripSummaryCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  tripPlannerApi,
  type PlannedProduct,
  type TripPlanResponse,
} from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/trip-planner")({
  component: TripPlannerPage,
});

const EXAMPLE_PROMPTS = [
  "I want piano and guitar",
  "I'm going to Goa for 5 days with 4 friends",
  "I'm going on a Himalayan trek for 4 days",
  "I need gear for a photoshoot and video project",
  "I'm attending an event and need a professional camera",
  "I need cordless power tools and a ladder for home renovation",
];

const LOADING_MESSAGES = [
  "Understanding your request & requirements...",
  "Curating the essential rental equipment checklist...",
  "Searching real RentHub marketplace inventory...",
  "Checking live availability and local proximity...",
  "Ranking the best product matches...",
];

export function TripPlannerPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<TripPlanResponse | null>(null);

  // Selected products for rental plan (keyed by product id)
  const [selectedProducts, setSelectedProducts] = useState<PlannedProduct[]>([]);

  // Rotating loading messages
  useEffect(() => {
    if (!loading) {
      setLoadingMessageIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async (promptToSubmit?: string) => {
    const textToAnalyze = (promptToSubmit ?? prompt).trim();
    if (!textToAnalyze) {
      toast.error("Please describe what items or equipment you want to rent.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await tripPlannerApi.analyze(textToAnalyze);
      setPlanResult(response);

      // Auto-select the first available product for each essential requirement
      const initialSelected: PlannedProduct[] = [];
      response.requirements.forEach((req) => {
        if (req.products && req.products.length > 0) {
          const firstAvailable = req.products.find((p) => p.available) || req.products[0];
          if (firstAvailable && req.priority === "essential") {
            initialSelected.push(firstAvailable);
          }
        }
      });
      setSelectedProducts(initialSelected);

      if (response.isClarificationNeeded) {
        toast.info("A bit more detail will help us build the perfect plan!");
      } else {
        toast.success("Rental plan generated!", {
          description: `Found ${response.summary.availableCount} matching items on the marketplace.`,
        });
      }
    } catch (err: any) {
      console.error("Trip planner error:", err);
      setError(err.message || "Failed to generate rental plan. Please try again.");
      toast.error(err.message || "Failed to build rental plan");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProduct = (product: PlannedProduct) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        // Also remove any alternative product from the same requirement if selected
        return [...prev, product];
      }
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleClearPlan = () => {
    setSelectedProducts([]);
  };

  // Group requirements by priority
  const essentialRequirements =
    planResult?.requirements.filter((r) => r.priority === "essential") || [];
  const recommendedRequirements =
    planResult?.requirements.filter((r) => r.priority === "recommended") || [];
  const optionalRequirements =
    planResult?.requirements.filter((r) => r.priority === "optional") || [];

  const selectedProductIds = new Set(selectedProducts.map((p) => p.id));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />

      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-24">
          {/* Subtle decorative background circles */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 size-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>Smart Rental Planner</span>
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              Tell us what you need.
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-amber-500 bg-clip-text text-transparent">
                We&apos;ll find the right rentals.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Type anything you need—from musical instruments like a piano and guitar, to camping gear, power tools, cameras, and party equipment. RentHub finds real items available on the marketplace.
            </p>

            {/* Prompt Input Form */}
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="relative rounded-3xl border border-border bg-card/80 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                  placeholder="e.g. I want piano and guitar, or 'I'm going to Goa for 5 days with 4 friends'"
                  className="min-h-24 resize-none border-0 bg-transparent text-base sm:text-lg font-medium placeholder:text-muted-foreground/60 focus-visible:ring-0"
                  disabled={loading}
                />

                <div className="mt-2 flex flex-col gap-2 border-t border-border/50 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-left text-[11px] text-muted-foreground px-2">
                    Press <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-bold">Enter ↵</kbd> to analyze
                  </span>

                  <Button
                    size="lg"
                    onClick={() => handleAnalyze()}
                    disabled={loading || !prompt.trim()}
                    className="gap-2 rounded-2xl px-6 font-bold shadow-md shadow-primary/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="size-4" />
                        <span>Build My Rental Plan</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Example Prompts */}
              <div className="mt-5 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Try an example:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((exPrompt, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setPrompt(exPrompt);
                        handleAnalyze(exPrompt);
                      }}
                      className="rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-foreground active:scale-95"
                    >
                      &ldquo;{exPrompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loading Experience */}
        {loading && (
          <section className="mx-auto mt-12 max-w-xl px-4 text-center">
            <div className="rounded-3xl border border-primary/20 bg-card/60 p-8 shadow-xl backdrop-blur-xl">
              <div className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Loader2 className="size-8 animate-spin" />
                <Sparkles className="absolute -top-1 -right-1 size-5 text-amber-500 animate-pulse" />
              </div>

              <h3 className="mt-4 text-lg font-bold text-foreground">
                Planning your rental list...
              </h3>

              <div className="mt-2 h-6 overflow-hidden">
                <p className="text-xs font-semibold text-primary transition-all duration-500">
                  {LOADING_MESSAGES[loadingMessageIdx]}
                </p>
              </div>

              <div className="mt-6 flex justify-center gap-1.5">
                {LOADING_MESSAGES.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      loadingMessageIdx === idx
                        ? "w-8 bg-primary"
                        : "w-2 bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && !loading && (
          <section className="mx-auto mt-10 max-w-2xl px-4">
            <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="mt-3 font-bold text-destructive">
                Could not generate rental plan
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAnalyze()}
                className="mt-4 gap-1.5 rounded-xl text-xs font-bold"
              >
                <RefreshCw className="size-3.5" />
                <span>Try Again</span>
              </Button>
            </div>
          </section>
        )}

        {/* Clarification Box if user input was vague */}
        {planResult?.isClarificationNeeded && !loading && (
          <section className="mx-auto mt-10 max-w-3xl px-4">
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <HelpCircle className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">
                    A few more details would help!
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {planResult.clarificationQuestion ||
                      "Could you specify your item requirements, duration, or specifications for more accurate recommendations?"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-xl text-xs font-bold"
                    >
                      Update Prompt
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Results Plan Display */}
        {planResult && !loading && (
          <div className="mx-auto mt-12 max-w-5xl px-4 sm:px-6 space-y-10">
            {/* Trip Summary Card */}
            <TripSummaryCard
              trip={planResult.trip}
              totalRequirements={planResult.summary.totalRequirements}
              availableCount={planResult.summary.availableCount}
              unavailableCount={planResult.summary.unavailableCount}
            />

            {/* Checklist Sections */}
            <div className="space-y-10">
              {/* ESSENTIAL ITEMS */}
              {essentialRequirements.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-6 place-items-center rounded-lg bg-rose-500/10 text-xs font-black text-rose-600 dark:text-rose-400">
                      1
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase">
                      Essential Items ({essentialRequirements.length})
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">
                      Must-have items for your primary activity and setup
                    </span>
                  </div>

                  <div className="space-y-4">
                    {essentialRequirements.map((req, idx) => (
                      <RequirementItem
                        key={`essential-${idx}`}
                        requirement={req}
                        selectedProductIds={selectedProductIds}
                        onToggleSelect={handleToggleProduct}
                        destination={planResult.trip.destination}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* RECOMMENDED ITEMS */}
              {recommendedRequirements.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                      2
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase">
                      Recommended Gear ({recommendedRequirements.length})
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">
                      Elevates your comfort, experience, and documentation
                    </span>
                  </div>

                  <div className="space-y-4">
                    {recommendedRequirements.map((req, idx) => (
                      <RequirementItem
                        key={`rec-${idx}`}
                        requirement={req}
                        selectedProductIds={selectedProductIds}
                        onToggleSelect={handleToggleProduct}
                        destination={planResult.trip.destination}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* OPTIONAL ITEMS */}
              {optionalRequirements.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-6 place-items-center rounded-lg bg-secondary text-xs font-black text-secondary-foreground">
                      3
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase">
                      Optional Extras ({optionalRequirements.length})
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">
                      Nice-to-have items for leisure and added convenience
                    </span>
                  </div>

                  <div className="space-y-4">
                    {optionalRequirements.map((req, idx) => (
                      <RequirementItem
                        key={`opt-${idx}`}
                        requirement={req}
                        selectedProductIds={selectedProductIds}
                        onToggleSelect={handleToggleProduct}
                        destination={planResult.trip.destination}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Rental Plan Drawer with price breakdown & booking action */}
      {planResult && (
        <RentalPlanDrawer
          selectedProducts={selectedProducts}
          onRemoveProduct={handleRemoveProduct}
          onClearPlan={handleClearPlan}
          trip={planResult.trip}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Info, Layers } from "lucide-react";
import { PlannedProductCard } from "./PlannedProductCard";
import type { PlannedProduct, TripRequirement } from "@/lib/api";

interface RequirementItemProps {
  requirement: TripRequirement;
  selectedProductIds: Set<string>;
  onToggleSelect: (product: PlannedProduct) => void;
  destination?: string | null | undefined;
}

export function RequirementItem({
  requirement,
  selectedProductIds,
  onToggleSelect,
  destination,
}: RequirementItemProps) {
  const [activeProductIndex, setActiveProductIndex] = useState(0);

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "essential":
        return (
          <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Essential
          </span>
        );
      case "recommended":
        return (
          <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            Recommended
          </span>
        );
      case "optional":
      default:
        return (
          <span className="rounded-md border border-muted-foreground/30 bg-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Optional
          </span>
        );
    }
  };

  const hasProducts = requirement.products && requirement.products.length > 0;
  const currentProduct = hasProducts ? requirement.products[activeProductIndex] : null;

  return (
    <div className="rounded-3xl border border-border bg-card/40 p-5 shadow-sm transition-all hover:border-border/80 hover:bg-card/60 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {getPriorityBadge(requirement.priority)}
            {requirement.matchedCategory && (
              <span className="text-[11px] font-medium text-muted-foreground">
                in {requirement.matchedCategory}
              </span>
            )}
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground capitalize">
            {requirement.item}
          </h3>
        </div>

        {hasProducts ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>{requirement.products.length} {requirement.products.length === 1 ? "match available" : "matches available"}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <AlertCircle className="size-3.5 text-amber-500" />
            <span>Not currently available</span>
          </span>
        )}
      </div>

      {/* Rationale */}
      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-border/50 bg-background/50 p-3.5 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground">Why you need it: </strong>
          {requirement.reason}
        </p>
      </div>

      {/* Product Display or Empty State */}
      <div className="mt-4">
        {hasProducts && currentProduct ? (
          <div>
            {/* If multiple alternatives exist, show tabs / switcher */}
            {requirement.products.length > 1 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Layers className="size-3.5 text-primary" />
                  Available Options:
                </span>
                <div className="flex items-center gap-1">
                  {requirement.products.map((prod, idx) => (
                    <button
                      key={prod.id}
                      onClick={() => setActiveProductIndex(idx)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                        activeProductIndex === idx
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      Option {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <PlannedProductCard
              product={currentProduct}
              isSelected={selectedProductIds.has(currentProduct.id)}
              onToggleSelect={onToggleSelect}
              destination={destination}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <AlertCircle className="size-5" />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">
              Not currently available on RentHub yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              No active listings currently match &ldquo;{requirement.item}&rdquo;. Our owner community is growing rapidly and new gear is listed daily.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

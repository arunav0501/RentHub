import { Link } from "@tanstack/react-router";
import { Check, ExternalLink, MapPin, Plus, Sparkles } from "lucide-react";
import { resolveProductImage, cameraImage } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import type { PlannedProduct } from "@/lib/api";

interface PlannedProductCardProps {
  product: PlannedProduct;
  isSelected: boolean;
  onToggleSelect: (product: PlannedProduct) => void;
  destination?: string | null | undefined;
}

export function PlannedProductCard({
  product,
  isSelected,
  onToggleSelect,
  destination,
}: PlannedProductCardProps) {
  const imgSrc = resolveProductImage(product.image, product.category?.name, product.title);

  const isLocationMatch =
    destination &&
    product.location &&
    product.location.toLowerCase().includes(destination.toLowerCase());

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 sm:flex-row ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
          : "border-border bg-card/70 hover:border-primary/40 hover:bg-card hover:shadow-lg"
      }`}
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-[4/3] sm:w-48">
        <img
          src={imgSrc}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = cameraImage;
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/70 via-transparent to-transparent sm:hidden" />

        {/* Match score badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full border border-primary/30 bg-background/90 px-2 py-0.5 text-[11px] font-bold text-primary shadow-xs backdrop-blur-md">
          <Sparkles className="size-3" />
          <span>{product.relevanceScore}% Match</span>
        </div>

        {/* Price tag on mobile */}
        <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-background/90 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-md sm:hidden">
          ₹{product.dailyRent}
          <span className="text-[10px] font-normal text-muted-foreground">/day</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                {product.category && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    {product.category.name}
                  </span>
                )}
                {product.brand && (
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {product.brand} {product.model || ""}
                  </span>
                )}
              </div>
              <h4 className="mt-1 text-base font-bold text-card-foreground line-clamp-1">
                {product.title}
              </h4>
            </div>

            {/* Price desktop */}
            <div className="hidden text-right sm:block">
              <span className="text-lg font-black text-foreground">
                ₹{product.dailyRent}
              </span>
              <span className="text-xs font-medium text-muted-foreground">/day</span>
            </div>
          </div>

          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>

          {/* Location & match pill */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              <span>{product.location || "Available for shipping"}</span>
            </span>

            {isLocationMatch && (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                In {destination}
              </span>
            )}

            {product.matchReasons && product.matchReasons.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                • {product.matchReasons[0]}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
          <Link
            to="/product/$productId"
            params={{ productId: product.id }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>View Details</span>
            <ExternalLink className="size-3" />
          </Link>

          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            onClick={() => onToggleSelect(product)}
            className={`gap-1.5 rounded-xl text-xs font-bold transition-all ${
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:border-primary hover:text-primary"
            }`}
          >
            {isSelected ? (
              <>
                <Check className="size-3.5" />
                <span>Selected</span>
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                <span>Add to Plan</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

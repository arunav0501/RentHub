import { Calendar, Compass, MapPin, Sparkles, Tag, Users } from "lucide-react";
import type { TripDetails } from "@/lib/api";

interface TripSummaryCardProps {
  trip: TripDetails;
  totalRequirements: number;
  availableCount: number;
  unavailableCount: number;
}

export function TripSummaryCard({
  trip,
  totalRequirements,
  availableCount,
  unavailableCount,
}: TripSummaryCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card/60 p-6 shadow-xl backdrop-blur-xl transition-all sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="size-4" />
            <span>AI Smart Rental Planner</span>
          </div>
          <h2 className="mt-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {trip.destination ? `Rental Plan for ${trip.destination}` : trip.tripType || "Your Rental Plan"}
          </h2>
          {trip.tripType && trip.destination && (
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {trip.tripType}
            </p>
          )}
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {trip.destination && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm">
              <MapPin className="size-3.5 text-primary" />
              <span>{trip.destination}</span>
            </div>
          )}

          {trip.durationDays && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm">
              <Calendar className="size-3.5 text-primary" />
              <span>{trip.durationDays} {trip.durationDays === 1 ? "day rental" : "days rental"}</span>
            </div>
          )}

          {trip.people && trip.people > 1 && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm">
              <Users className="size-3.5 text-primary" />
              <span>{trip.people} people</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm">
            <Compass className="size-3.5 text-primary" />
            <span>{totalRequirements} items curated</span>
          </div>
        </div>
      </div>

      {/* Activities & Inventory Status */}
      <div className="mt-6 flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        {trip.activities && trip.activities.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Purpose & Activities:
            </span>
            {trip.activities.map((activity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                <Tag className="size-3" />
                {activity}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>{availableCount} Available on Marketplace</span>
          </div>
          {unavailableCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>{unavailableCount} Unavailable</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

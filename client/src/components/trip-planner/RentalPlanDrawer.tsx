import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronUp,
  CreditCard,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bookingsApi, type PlannedProduct, type TripDetails } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface RentalPlanDrawerProps {
  selectedProducts: PlannedProduct[];
  onRemoveProduct: (productId: string) => void;
  onClearPlan: () => void;
  trip: TripDetails;
}

export function RentalPlanDrawer({
  selectedProducts,
  onRemoveProduct,
  onClearPlan,
  trip,
}: RentalPlanDrawerProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingProgress, setBookingProgress] = useState("");
  const [bookingDone, setBookingDone] = useState(false);

  // Dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStartDate = tomorrow.toISOString().split("T")[0];

  const duration = trip.durationDays && trip.durationDays > 0 ? trip.durationDays : 3;
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [rentalDays, setRentalDays] = useState(duration);

  // Price calculations using ACTUAL database values
  const dailyTotal = selectedProducts.reduce((sum, p) => sum + (p.dailyRent || 0), 0);
  const estimatedTripTotal = dailyTotal * rentalDays;

  const handleOpenBooking = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to proceed with booking", {
        description: "You can use quick demo access from the header.",
      });
      window.dispatchEvent(new CustomEvent("renthub_open_auth"));
      return;
    }
    setBookingDialogOpen(true);
  };

  const handleConfirmBookings = async () => {
    if (!selectedProducts.length) return;
    setBookingLoading(true);
    setBookingProgress("Submitting booking requests...");

    try {
      const safeStart = startDate || new Date().toISOString();
      const start = new Date(safeStart);
      const end = new Date(start);
      end.setDate(end.getDate() + rentalDays);
      const endDate = end.toISOString().split("T")[0] || end.toISOString();

      let successCount = 0;
      for (let i = 0; i < selectedProducts.length; i++) {
        const prod = selectedProducts[i];
        if (!prod) continue;
        setBookingProgress(`Requesting ${prod.title} (${i + 1}/${selectedProducts.length})...`);
        await bookingsApi.create({
          productId: prod.id,
          startDate: safeStart,
          endDate,
        });
        successCount++;
      }

      setBookingDone(true);
      toast.success(`Successfully requested ${successCount} rental items!`, {
        description: "Review booking details and owner approvals on your dashboard.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit some booking requests");
    } finally {
      setBookingLoading(false);
    }
  };

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Sticky Bottom Bar / Summary */}
      <aside className="sticky bottom-4 z-30 mx-auto w-full max-w-5xl px-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-primary/30 bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <ShoppingBag className="size-6" />
              <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-foreground text-[11px] font-black text-background">
                {selectedProducts.length}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Your Rental Plan
                </span>
                <span className="text-xs text-muted-foreground">
                  • {selectedProducts.length} {selectedProducts.length === 1 ? "item" : "items"} selected
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-foreground">
                  ₹{dailyTotal.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground font-medium">/ day</span>
                {rentalDays > 1 && (
                  <span className="text-xs font-bold text-muted-foreground ml-2">
                    (Est. ₹{estimatedTripTotal.toLocaleString()} for {rentalDays} days)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearPlan}
              className="rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive"
              title="Clear all selected items"
            >
              Clear
            </Button>

            <Button
              size="default"
              onClick={handleOpenBooking}
              className="gap-2 rounded-2xl px-6 text-sm font-bold shadow-lg shadow-primary/25"
            >
              <span>Continue to Booking</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Booking Confirmation Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="glass-panel sm:max-w-xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {bookingDone ? "Rental Requests Submitted" : "Confirm Rental Plan"}
            </DialogTitle>
            <DialogDescription>
              {bookingDone
                ? "Your booking requests have been sent to the owners. You can track their status anytime."
                : `Complete your booking request for ${selectedProducts.length} items.`}
            </DialogDescription>
          </DialogHeader>

          {bookingDone ? (
            <div className="space-y-6 py-4 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  All requests successfully sent!
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Owners typically respond within a few hours. View and manage your upcoming rentals in the dashboard.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingDialogOpen(false);
                    setBookingDone(false);
                  }}
                  className="rounded-xl font-bold"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setBookingDialogOpen(false);
                    navigate({ to: "/dashboard" });
                  }}
                  className="rounded-xl font-bold"
                >
                  View My Rentals in Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* Rental Dates Selector */}
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Rental Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Rental Duration
                  </label>
                  <select
                    value={rentalDays}
                    onChange={(e) => setRentalDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-hidden focus:border-primary cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30].map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? "day" : "days"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Selected Items ({selectedProducts.length})
                </span>
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {selectedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 p-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-bold text-foreground truncate">{prod.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {prod.location} • ₹{prod.dailyRent}/day
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground">
                          ₹{(prod.dailyRent * rentalDays).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveProduct(prod.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Summary Box */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Daily Rental Total</span>
                  <span>₹{dailyTotal.toLocaleString()} / day</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Duration</span>
                  <span>{rentalDays} {rentalDays === 1 ? "day" : "days"}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex justify-between font-bold text-sm text-foreground">
                  <span>Estimated Total Rental Cost</span>
                  <span className="text-base text-primary">
                    ₹{estimatedTripTotal.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  * Calculated directly from active marketplace rates. Security deposits and handover details are managed upon owner approval.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setBookingDialogOpen(false)}
                  disabled={bookingLoading}
                  className="rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBookings}
                  disabled={bookingLoading}
                  className="gap-2 rounded-xl font-bold px-6"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{bookingProgress || "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      <span>Request All {selectedProducts.length} Items</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

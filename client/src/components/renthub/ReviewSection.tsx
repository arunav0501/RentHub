import { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import {
  reviewsApi,
  type CanReviewResponse,
  type ProductReviewsResponse,
  type Review,
} from "@/lib/api";
import { toast } from "sonner";

interface ReviewSectionProps {
  productId: string;
  productTitle: string;
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Exceptional!"];

export function ReviewSection({ productId, productTitle }: ReviewSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<ProductReviewsResponse | null>(null);
  const [canReviewState, setCanReviewState] = useState<CanReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    try {
      const res = await reviewsApi.getByProductId(productId);
      setData(res);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  const checkEligibility = async () => {
    if (!isAuthenticated) {
      setCanReviewState(null);
      return;
    }
    try {
      const res = await reviewsApi.checkCanReview(productId);
      setCanReviewState(res);
      if (res.existingReview) {
        setRating(res.existingReview.rating);
        setComment(res.existingReview.comment);
      }
    } catch (err) {
      console.error("Failed to check review eligibility:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadReviews(), checkEligibility()]).finally(() => setLoading(false));
  }, [productId, isAuthenticated]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) {
      toast.error("Please provide at least a few words describing your experience.");
      return;
    }

    setSubmitting(true);
    try {
      await reviewsApi.create({
        productId,
        rating,
        comment: comment.trim(),
        bookingId: canReviewState?.eligibleBookingId || undefined,
      });

      toast.success("Thank you! Your verified review has been published.");
      setDialogOpen(false);
      await Promise.all([loadReviews(), checkEligibility()]);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = data?.stats;
  const reviews = data?.reviews || [];
  const avgRating = stats?.averageRating ?? 0;
  const totalCount = stats?.totalReviews ?? 0;

  return (
    <section className="mt-14 border-t border-border pt-12">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Renter Feedback
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Verified Rentals Only
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Reviews & Ratings</h2>
        </div>

        {/* Action button */}
        {isAuthenticated ? (
          canReviewState?.canReview ? (
            <Button
              onClick={() => setDialogOpen(true)}
              className="gap-2 rounded-xl font-bold bg-primary text-primary-foreground shadow-sm"
            >
              <Star className="size-4 fill-current" />
              <span>Write a Review</span>
            </Button>
          ) : canReviewState?.alreadyReviewed ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
              className="gap-2 rounded-xl font-bold"
            >
              <UserCheck className="size-4 text-emerald-500" />
              <span>Edit Your Review</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3.5 py-2 text-xs font-semibold text-muted-foreground">
              <Lock className="size-3.5" />
              <span>Rent & complete this item to leave a review</span>
            </div>
          )
        ) : (
          <Button
            variant="outline"
            onClick={() => window.dispatchEvent(new CustomEvent("renthub_open_auth"))}
            className="gap-2 rounded-xl font-bold"
          >
            <span>Sign In to Review</span>
          </Button>
        )}
      </div>

      {/* Ratings Breakdown Grid */}
      <div className="mt-8 grid gap-8 rounded-3xl border border-border bg-card/60 p-6 md:grid-cols-[220px_1fr_260px] md:p-8">
        {/* Big Score Card */}
        <div className="flex flex-col items-center justify-center border-b border-border pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-8">
          <span className="text-5xl font-black tracking-tight text-foreground">
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </span>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`size-4 ${
                  s <= Math.round(avgRating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="mt-1.5 text-xs font-semibold text-muted-foreground">
            {totalCount > 0
              ? `Based on ${totalCount} verified ${totalCount === 1 ? "rental" : "rentals"}`
              : "No reviews yet"}
          </span>
        </div>

        {/* Rating Bars */}
        <div className="flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const item = stats?.breakdown?.find((b) => b.stars === star) || {
              count: 0,
              percentage: 0,
            };
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="flex w-7 items-center justify-end gap-1 font-bold text-muted-foreground">
                  {star} <Star className="size-3 fill-current text-primary" />
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-medium text-muted-foreground">
                  {item.percentage}%
                </span>
              </div>
            );
          })}
        </div>

        {/* RentHub Verified Policy Callout */}
        <div className="flex flex-col justify-between rounded-2xl border border-trust/30 bg-trust-soft/40 p-4">
          <div className="flex items-start gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-trust text-white">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-trust">RentHub Verified Renters</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Only users who booked, paid for, and completed a rental of this exact product can leave reviews. Zero bots, zero fake testimonials.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-trust">
            <Check className="size-3.5" />
            <span>100% Genuine Community Feedback</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-8 space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground/40" />
            <h4 className="mt-2 text-sm font-bold text-foreground">Be the first to review!</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Rent this item, test it on your next adventure or project, and share your experience with the RentHub community.
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <article
              key={rev.id}
              className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-border/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-accent font-bold text-accent-foreground">
                    {(rev.user?.name || "Renter")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">
                        {rev.user?.name || "Verified Renter"}
                      </h4>
                      <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        <span>Verified Rental</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`size-3.5 ${
                        s <= rev.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-3.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {rev.comment}
              </p>
            </article>
          ))
        )}
      </div>

      {/* Review Submission Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Review {productTitle}</DialogTitle>
            <DialogDescription className="text-xs">
              Share your honest rental experience with other RentHub members.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
            {/* Interactive Stars */}
            <div>
              <label className="text-xs font-bold text-foreground">Overall Rating</label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const active = (hoverRating || rating) >= s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
                      >
                        <Star
                          className={`size-7 ${
                            active
                              ? "fill-primary text-primary transition-colors"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="ml-2 text-xs font-bold text-primary">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="text-xs font-bold text-foreground">Your Feedback</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="How was the product condition? Was the owner helpful with pickup and handover? Any tips for future renters?"
                className="mt-1.5 resize-none text-xs"
                required
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Will be displayed with your Verified Renter badge.</span>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-bold"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" /> Submitting Review...
                </>
              ) : (
                "Publish Review"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

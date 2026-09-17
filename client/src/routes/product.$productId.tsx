import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Plus,
  Receipt,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/renthub/AppHeader";
import { TrustScoreDialog } from "@/components/renthub/TrustScoreDialog";
import { ReviewSection } from "@/components/renthub/ReviewSection";
import { WalletDialog } from "@/components/renthub/WalletDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listings } from "@/lib/renthub-data";
import {
  bookingsApi,
  productsApi,
  trustScoreApi,
  walletApi,
  type Booking,
  type Product,
  type TrustScoreResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { resolveProductImage, cameraImage } from "@/lib/image-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Rental details — RentHub" },
      {
        name: "description",
        content:
          "Review verified owner details, availability and transparent rental pricing on RentHub.",
      },
      { property: "og:title", content: "RentHub Verified Rental" },
      {
        property: "og:description",
        content: "Book protected rentals from verified local owners.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

type PaymentMethodType = "WALLET" | "UPI" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH_ON_DELIVERY";

export function ProductPage() {
  const { productId } = Route.useParams();
  const { user, isAuthenticated } = useAuth();

  const [dbProduct, setDbProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerTrust, setOwnerTrust] = useState<TrustScoreResponse | null>(null);

  // Wallet & Payment State
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("WALLET");
  const [upiId, setUpiId] = useState("alice@okhdfcbank");
  const [cardNumber, setCardNumber] = useState("4532 8921 4012 3456");
  const [cardExp, setCardExp] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("892");
  const [cardHolder, setCardHolder] = useState(user?.name || "Alice Renter");

  // Booking state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStartDate = tomorrow.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [days, setDays] = useState(3);
  const [bookingPending, setBookingPending] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  const fetchWallet = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await walletApi.getWallet();
      setWalletBalance(data.balance);
    } catch {
      // Wallet may not exist yet
    }
  };

  useEffect(() => {
    setLoading(true);
    productsApi
      .getById(productId)
      .then((p) => {
        setDbProduct(p);
        if (p.owner?.id) {
          trustScoreApi
            .getScore(p.owner.id, "OWNER")
            .then(setOwnerTrust)
            .catch(() => {});
        }
      })
      .catch(() => {
        // Fallback for demo ID
      })
      .finally(() => setLoading(false));

    fetchWallet();

    const handleWalletUpdated = () => fetchWallet();
    window.addEventListener("renthub_wallet_updated", handleWalletUpdated);
    return () => window.removeEventListener("renthub_wallet_updated", handleWalletUpdated);
  }, [productId, isAuthenticated]);

  // Fallback if not found in DB
  const fallbackItem = listings.find((l) => l.id === productId) ?? listings[0]!;

  const title = dbProduct?.title || fallbackItem.title;
  const category = dbProduct?.category?.name || fallbackItem.category;
  const price = dbProduct?.dailyRent || fallbackItem.price;
  const location = dbProduct?.location || fallbackItem.location;
  const description =
    dbProduct?.description ||
    "A meticulously maintained, professional-grade item ready for your next project. Includes essential accessories and a quick walkthrough at pickup.";
  const condition = dbProduct?.condition || "Excellent";
  const brand = dbProduct?.brand;
  const model = dbProduct?.model;
  const ownerName = dbProduct?.owner?.name || fallbackItem.owner;
  const ownerId = dbProduct?.owner?.id;

  // Accurate image resolution
  const mainImage = resolveProductImage(dbProduct?.image, category, title);

  const trustScore = ownerTrust?.score ?? 92;
  const trustTier = ownerTrust?.tierLabel ?? (trustScore >= 90 ? "Excellent" : "Established");

  const costs = useMemo(() => {
    const rental = price * days;
    const fee = Math.round(rental * 0.12);
    const deposit = Math.round(price * 1.5);
    return { rental, fee, deposit, total: rental + fee + deposit };
  }, [days, price]);

  const hasSufficientWallet = walletBalance !== null && walletBalance >= costs.total;

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in or register to submit a rental request.");
      window.dispatchEvent(new CustomEvent("renthub_open_auth"));
      return;
    }

    if (user?.id && dbProduct?.ownerId && user.id === dbProduct.ownerId) {
      toast.error("You cannot rent your own product. Sign in with another account to book.");
      return;
    }

    if (!dbProduct) {
      toast.error("This item was not found in the database.");
      return;
    }

    if (!startDate) {
      toast.error("Please pick a start date.");
      return;
    }

    if (paymentMethod === "WALLET" && !hasSufficientWallet) {
      toast.error(
        `Insufficient wallet balance (₹${walletBalance ?? 0}). Please add funds or pick another payment method.`
      );
      setWalletDialogOpen(true);
      return;
    }

    setBookingPending(true);
    try {
      const end = new Date(startDate);
      end.setDate(end.getDate() + days);
      const endDate = end.toISOString().split("T")[0] || end.toISOString();

      const newBooking = await bookingsApi.create({
        productId: dbProduct.id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        paymentMethod,
        ...(paymentMethod === "UPI" ? { paymentDetails: { upiId } } : {}),
        ...(paymentMethod === "CREDIT_CARD" || paymentMethod === "DEBIT_CARD"
          ? { paymentDetails: { cardNumber, cardHolder } }
          : {}),
      });

      setCreatedBooking(newBooking);
      setBookingSuccess(true);
      await fetchWallet();
      toast.success(
        paymentMethod === "CASH_ON_DELIVERY"
          ? "Booking confirmed! You can pay upon pickup."
          : "Payment successful! Your rental is confirmed."
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to process booking payment.");
    } finally {
      setBookingPending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">Loading rental specifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to explore
        </Link>

        {/* Product Imagery Showcase */}
        <div className="grid gap-4 lg:grid-cols-[1.65fr_0.85fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:aspect-auto lg:min-h-[500px] bg-secondary border border-border shadow-md">
            <img
              src={mainImage}
              alt={title}
              width={1200}
              height={900}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = cameraImage;
              }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute left-4 top-4">
              <span className="rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-xl shadow-xs">
                {category}
              </span>
            </div>
            <div className="absolute right-4 top-4 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/80 backdrop-blur-xl hover:bg-background"
                aria-label="Share"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }}
              >
                <Share2 className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/80 backdrop-blur-xl hover:bg-background"
                aria-label="Save"
                onClick={() => toast.success("Saved to favorites")}
              >
                <Heart className="size-4" />
              </Button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white backdrop-blur-md bg-black/40 rounded-2xl p-3 border border-white/10">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>RentHub Verified Equipment</span>
              </span>
              <span className="font-mono text-white/80">ID: {productId.slice(0, 8)}</span>
            </div>
          </div>

          {/* Contextual Feature & Guarantee Cards (Replaces mismatched images) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="size-4" />
                  <span>Verified Condition</span>
                </div>
                <h4 className="mt-2 text-base font-extrabold text-foreground">
                  {condition} Rating
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Inspected before each handover. Comes with all essential cables, chargers, and carrying case ready for instant use.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Check className="size-3.5 text-trust" />
                <span>Sanitized & Tested</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-trust/5 via-card to-card p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-trust font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="size-4" />
                  <span>Damage Protection</span>
                </div>
                <h4 className="mt-2 text-base font-extrabold text-foreground">
                  ₹{costs.deposit} Security Deposit
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  100% refundable upon return in original working order. Full damage waiver coverage included.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-trust">
                <Check className="size-3.5" />
                <span>Auto-refund to your payment method</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content & Booking Grid */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            {/* Header info */}
            <div className="border-b border-border pb-7">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {category}
              </span>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Star className="size-4 fill-primary text-primary" /> 4.96
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-4 text-primary" />
                  {location}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  Condition: {condition}
                </span>
                {(brand || model) && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                    {[brand, model].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            </div>

            {/* Owner & Trust Score Section */}
            <div className="border-b border-border py-7">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                <div className="relative grid size-14 place-items-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                  {ownerName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                  <span className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-background bg-trust" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground">Owned by {ownerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Verified Owner · Usually responds in ~10 minutes
                  </p>
                </div>
                <Button variant="outline" size="icon" aria-label="Message owner">
                  <MessageCircle className="size-4" />
                </Button>
              </div>

              {/* Dynamic Trust Score Badge / Button */}
              <TrustScoreDialog
                userId={ownerId}
                initialData={ownerTrust || undefined}
                role="OWNER"
                trigger={
                  <Button
                    variant="outline"
                    className="mt-5 flex h-auto w-full items-center justify-start gap-4 whitespace-normal rounded-2xl border-trust/30 bg-trust-soft/60 p-4 text-left transition-all hover:border-trust hover:bg-trust-soft"
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-trust text-lg font-extrabold text-primary-foreground shadow-sm">
                      {trustScore}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-bold text-foreground">
                        <ShieldCheck className="size-4 text-trust" />
                        {trustTier} Trust Score ({trustScore}/100)
                      </span>
                      <span className="block truncate text-xs text-muted-foreground mt-0.5">
                        Verified Identity · Fulfillments Guaranteed · Tap to view complete breakdown
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-trust" />
                  </Button>
                }
              />
            </div>

            {/* Description */}
            <div className="py-7">
              <h2 className="text-xl font-bold">About this rental</h2>
              <p className="mt-4 max-w-3xl leading-7 text-muted-foreground whitespace-pre-line">
                {description}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  "AI-verified specifications",
                  "Flexible pickup & return",
                  "Comprehensive damage protection",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 rounded-2xl bg-secondary/70 p-3.5 text-xs font-bold text-foreground"
                  >
                    <Check className="size-4 text-trust shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Reviews Section */}
            <ReviewSection productId={productId} productTitle={title} />
          </div>

          {/* Booking & Direct Payment Widget Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-black text-foreground">₹{price}</span>
                  <span className="text-xs font-semibold text-muted-foreground"> / day</span>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <Star className="size-3.5 fill-current" /> 4.96 Verified
                </span>
              </div>

              {/* Date selection */}
              <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-1">
                <div className="grid grid-cols-2 divide-x divide-border">
                  <label className="p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                      Start date
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 w-full bg-transparent text-xs font-bold outline-hidden cursor-pointer"
                    />
                  </label>
                  <label className="p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                      Duration
                    </span>
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="mt-1 w-full bg-transparent text-xs font-bold outline-hidden cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((d) => (
                        <option key={d} value={d}>
                          {d} {d === 1 ? "day" : "days"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="mt-5 space-y-2.5 rounded-2xl border border-border/60 bg-secondary/20 p-4 text-xs">
                <CostRow label={`₹${price} × ${days} days`} value={`₹${costs.rental}`} />
                <CostRow label="Platform & damage protection" value={`₹${costs.fee}`} />
                <CostRow label="Refundable security deposit" value={`₹${costs.deposit}`} muted />
                <div className="border-t border-border pt-2.5">
                  <CostRow label="Total payable amount" value={`₹${costs.total}`} strong />
                </div>
              </div>

              {bookingSuccess ? (
                /* Payment Success Card */
                <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-600 text-white shadow-md">
                    <Check className="size-6" />
                  </div>
                  <h4 className="mt-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                    {paymentMethod === "CASH_ON_DELIVERY"
                      ? "Booking Confirmed (Pay on Handover)"
                      : "Rental Paid & Confirmed!"}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Owner {ownerName} has been notified. Prepare for pickup on {startDate}.
                  </p>

                  <div className="mt-4 rounded-xl border border-border bg-card p-3 text-left text-xs space-y-1.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Booking ID:</span>
                      <span className="font-mono text-foreground font-bold">
                        {createdBooking?.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Payment Ref:</span>
                      <span className="font-mono text-primary font-bold">
                        {createdBooking?.paymentRef || "TXN-RH-APPROVED"}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Method:</span>
                      <span className="font-bold text-foreground">
                        {paymentMethod === "WALLET"
                          ? "RentHub Wallet"
                          : paymentMethod === "UPI"
                          ? "UPI"
                          : paymentMethod === "CASH_ON_DELIVERY"
                          ? "Cash on Delivery"
                          : "Card"}
                      </span>
                    </div>
                  </div>

                  <Link to="/dashboard" className="block mt-4">
                    <Button className="w-full font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Receipt className="size-4" />
                      <span>View in Dashboard</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Payment Method Selector & Checkout */
                <div className="mt-5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Choose Payment Option
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {/* Option 1: RentHub Wallet */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("WALLET")}
                      className={`relative flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        paymentMethod === "WALLET"
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <Wallet className="size-4 text-emerald-500" />
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          INSTANT
                        </span>
                      </div>
                      <span className="mt-1 text-xs font-bold text-foreground">RentHub Wallet</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Bal: ₹{walletBalance !== null ? walletBalance.toLocaleString("en-IN") : "..."}
                      </span>
                    </button>

                    {/* Option 2: UPI */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI")}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        paymentMethod === "UPI"
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <Smartphone className="size-4 text-primary" />
                        <span className="text-[9px] font-bold text-muted-foreground">GPAY/PHONEPE</span>
                      </div>
                      <span className="mt-1 text-xs font-bold text-foreground">UPI Transfer</span>
                      <span className="text-[10px] text-muted-foreground">0% Platform Fee</span>
                    </button>

                    {/* Option 3: Credit Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CREDIT_CARD")}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        paymentMethod === "CREDIT_CARD"
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:bg-secondary/60"
                      }`}
                    >
                      <CreditCard className="size-4 text-indigo-400" />
                      <span className="mt-1 text-xs font-bold text-foreground">Credit Card</span>
                      <span className="text-[10px] text-muted-foreground">Visa / Mastercard</span>
                    </button>

                    {/* Option 4: Debit Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("DEBIT_CARD")}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        paymentMethod === "DEBIT_CARD"
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:bg-secondary/60"
                      }`}
                    >
                      <CreditCard className="size-4 text-sky-400" />
                      <span className="mt-1 text-xs font-bold text-foreground">Debit Card</span>
                      <span className="text-[10px] text-muted-foreground">All Major Banks</span>
                    </button>

                    {/* Option 5: Cash on Delivery */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                      className={`col-span-2 flex items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                        paymentMethod === "CASH_ON_DELIVERY"
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Banknote className="size-4 text-amber-500" />
                        <div>
                          <span className="text-xs font-bold text-foreground block">
                            Cash on Delivery / Pickup
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Pay directly at item handover after inspection
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        PAY LATER
                      </span>
                    </button>
                  </div>

                  {/* Payment Details Sub-Form */}
                  {paymentMethod === "WALLET" && (
                    <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Wallet Balance:</span>
                        <span className="font-bold text-foreground font-mono">
                          ₹{(walletBalance ?? 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {hasSufficientWallet ? (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="size-3.5" />
                          <span>Sufficient funds. Instant rental booking.</span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-rose-500 font-semibold">
                            Needs ₹{(costs.total - (walletBalance ?? 0)).toLocaleString("en-IN")} more
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setWalletDialogOpen(true)}
                            className="h-7 text-[10px] font-bold gap-1"
                          >
                            <Plus className="size-3" /> Top Up
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === "UPI" && (
                    <div className="mt-3 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Your UPI ID
                      </label>
                      <Input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="h-9 text-xs"
                      />
                    </div>
                  )}

                  {(paymentMethod === "CREDIT_CARD" || paymentMethod === "DEBIT_CARD") && (
                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Card Number
                        </label>
                        <Input
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4532 •••• •••• ••••"
                          className="mt-1 h-9 font-mono text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">
                            Expiry
                          </label>
                          <Input
                            value={cardExp}
                            onChange={(e) => setCardExp(e.target.value)}
                            className="mt-1 h-9 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">
                            CVV
                          </label>
                          <Input
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            type="password"
                            maxLength={3}
                            className="mt-1 h-9 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <Button
                    size="lg"
                    className="mt-5 w-full font-bold h-12 text-sm shadow-md"
                    onClick={handleBooking}
                    disabled={bookingPending}
                  >
                    {bookingPending ? (
                      <>
                        <Loader2 className="animate-spin size-4 mr-2" />
                        Processing payment...
                      </>
                    ) : paymentMethod === "WALLET" ? (
                      <>
                        <Wallet className="size-4 mr-2" /> Pay ₹{costs.total} with RentHub Wallet
                      </>
                    ) : paymentMethod === "UPI" ? (
                      <>
                        <Smartphone className="size-4 mr-2" /> Pay ₹{costs.total} via UPI
                      </>
                    ) : paymentMethod === "CASH_ON_DELIVERY" ? (
                      <>
                        <Banknote className="size-4 mr-2" /> Confirm Rental (Pay ₹{costs.total} on Handover)
                      </>
                    ) : (
                      <>
                        <CreditCard className="size-4 mr-2" /> Pay ₹{costs.total} via Card
                      </>
                    )}
                  </Button>

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                    <Lock className="size-3 text-emerald-500" />
                    <span>256-bit Encrypted Secure Checkout</span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Wallet Top-up Modal */}
      <WalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        defaultTab="add"
      />
    </div>
  );
}

function CostRow({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3 ${
        muted ? "text-muted-foreground" : ""
      } ${strong ? "text-sm font-black text-foreground" : ""}`}
    >
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
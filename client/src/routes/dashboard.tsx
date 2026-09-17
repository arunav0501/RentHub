import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Grid2X2,
  List,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AddProductDialog } from "@/components/renthub/AddProductDialog";
import { AppHeader } from "@/components/renthub/AppHeader";
import { TrustScoreDialog } from "@/components/renthub/TrustScoreDialog";
import { WalletDialog } from "@/components/renthub/WalletDialog";
import { Button } from "@/components/ui/button";
import {
  bookingsApi,
  productsApi,
  trustScoreApi,
  walletApi,
  type Booking,
  type Product,
  type TrustScoreResponse,
  type WalletData,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { resolveProductImage, cameraImage } from "@/lib/image-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — RentHub" },
      {
        name: "description",
        content:
          "Manage your RentHub listings, rental requests, earnings and trust score.",
      },
      { property: "og:title", content: "RentHub owner dashboard" },
      {
        property: "og:description",
        content: "Your rental business and reputation in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState<"bookings" | "requests" | "inventory" | "wallet">("bookings");

  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<Booking[]>([]);
  const [myRentals, setMyRentals] = useState<Booking[]>([]);
  const [trustData, setTrustData] = useState<TrustScoreResponse | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [walletDialogTab, setWalletDialogTab] = useState<"overview" | "add" | "withdraw">("overview");
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [myProds, myOwnerRequests, userRentals, wData] = await Promise.all([
        productsApi.getMyProducts().catch(() => []),
        bookingsApi.getOwnerRequests().catch(() => []),
        bookingsApi.getMyRentals().catch(() => []),
        walletApi.getWallet().catch(() => null),
      ]);
      setProducts(myProds);
      setRequests(myOwnerRequests);
      setMyRentals(userRentals);
      if (wData) setWalletData(wData);

      if (user?.id) {
        const score = await trustScoreApi.getScore(user.id, "OWNER").catch(() => null);
        setTrustData(score);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleUpdate = () => loadDashboardData();
    window.addEventListener("renthub_products_updated", handleUpdate);
    return () => window.removeEventListener("renthub_products_updated", handleUpdate);
  }, [user?.id]);

  const handleBookingAction = async (
    bookingId: string,
    action: "APPROVED" | "REJECTED" | "COMPLETED"
  ) => {
    try {
      await bookingsApi.updateStatus(bookingId, action);
      toast.success(
        action === "APPROVED"
          ? "Rental request approved!"
          : action === "COMPLETED"
          ? "Rental marked as completed! Renter can now submit a verified review."
          : "Rental request rejected."
      );
      // Reload requests and rentals
      const [updatedReqs, updatedRentals] = await Promise.all([
        bookingsApi.getOwnerRequests().catch(() => []),
        bookingsApi.getMyRentals().catch(() => []),
      ]);
      setRequests(updatedReqs);
      setMyRentals(updatedRentals);
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking status");
    }
  };

  const currentScore = trustData?.score ?? 92;
  const currentTier = trustData?.tierLabel ?? (currentScore >= 90 ? "Excellent" : "Established");
  const isNew = trustData?.isNewMember ?? false;

  const breakdown = trustData?.breakdown ?? [
    { category: "Profile Completeness", score: 20, max: 20, percentage: 100 },
    { category: "Listing Quality", score: 22, max: 25, percentage: 88 },
    { category: "Rental History & Fulfillment", score: 32, max: 35, percentage: 91 },
    { category: "Reliability & Cancellations", score: 18, max: 20, percentage: 90 },
  ];

  // Calculate earnings estimate
  const totalEarnings = requests
    .filter((r) => r.status === "APPROVED" || r.status === "COMPLETED")
    .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary mb-4">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Sign In to Owner Workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in or register to manage your listings, incoming rental requests, and trust reputation.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              className="font-bold"
              onClick={() => window.dispatchEvent(new CustomEvent("renthub_open_auth"))}
            >
              Sign In / Register
            </Button>
            <Link to="/">
              <Button variant="outline">Back to Explore</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Workspace Title & Add Product */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Owner workspace
            </p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Good evening, {user?.name || "Tech Rentals Co."}.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here’s what’s happening with your inventory, trust metrics, and rental requests.
            </p>
          </div>
          <AddProductDialog
            trigger={
              <Button size="lg" className="font-bold gap-2">
                <Sparkles className="size-4 text-primary-foreground" /> Add product with AI
              </Button>
            }
            onSuccess={loadDashboardData}
          />
        </div>

        {/* Section 1: Trust Score & Metrics */}
        <section className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* Trust Score Hero Panel */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 lg:col-span-7">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative grid gap-6 sm:grid-cols-[auto_1fr] items-center">
              <div
                className="relative grid size-32 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--color-primary) ${currentScore}%, var(--color-muted) 0)`,
                }}
              >
                <div className="grid size-25 place-items-center rounded-full bg-card">
                  <span className="text-4xl font-extrabold">{currentScore}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-trust size-5" />
                  <span className="rounded-full bg-trust-soft px-3 py-1 text-xs font-bold text-trust">
                    {currentTier}
                  </span>
                  {isNew && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                      New Member Baseline
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-2xl font-extrabold">Your reputation stands out.</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {currentScore >= 90
                    ? "You're in the top tier of verified RentHub owners. Keep up your timely fulfillments."
                    : "Verified profile with healthy listing and transaction history."}
                </p>
                <TrustScoreDialog
                  userId={user?.id}
                  initialData={trustData || undefined}
                  role="OWNER"
                  trigger={
                    <Button variant="link" className="mt-3 h-auto p-0 font-bold text-primary">
                      View full score breakdown <ArrowUpRight className="size-4 ml-1" />
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {breakdown.map((item) => (
                <div key={item.category} className="rounded-xl bg-secondary p-3">
                  <span className="text-xs text-muted-foreground block truncate">
                    {item.category.split(" ")[0]}
                  </span>
                  <strong className="mt-1 block text-sm font-bold">
                    {item.score}/{item.max}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-5">
            <Metric
              icon={<ShoppingBag />}
              label="My Bookings"
              value={`${myRentals.length}`}
              delta={`${myRentals.filter((r) => r.status === "APPROVED").length} accepted • ${myRentals.filter((r) => r.status === "PENDING").length} pending`}
            />
            <Metric
              icon={<Clock3 />}
              label="Incoming requests"
              value={`${requests.filter((r) => r.status === "PENDING").length}`}
              delta="Needs your attention"
            />
            <Metric
              icon={<Package />}
              label="Listed products"
              value={`${products.length}`}
              delta="Active inventory"
            />
            <AddProductDialog
              trigger={
                <Button
                  variant="outline"
                  className="h-full min-h-32 flex-col rounded-2xl border-dashed border-primary/40 bg-accent/30 hover:bg-accent/60 transition-colors cursor-pointer"
                >
                  <Plus className="size-6 text-primary" />
                  <span className="font-bold text-sm">Add a product</span>
                </Button>
              }
              onSuccess={loadDashboardData}
            />
          </div>
        </section>

        {/* Section Navigation Tabs */}
        <section className="mt-12 border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "bookings"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card/70 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
              }`}
            >
              <ShoppingBag className="size-4" />
              <span>My Bookings</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  activeTab === "bookings"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {myRentals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "requests"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card/70 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
              }`}
            >
              <Clock3 className="size-4" />
              <span>Incoming Owner Requests</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  activeTab === "requests"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {requests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card/70 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
              }`}
            >
              <Package className="size-4" />
              <span>My Listed Products</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  activeTab === "inventory"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {products.length}
              </span>
            </button>

            {/* TAB 4: WALLET */}
            <button
              onClick={() => setActiveTab("wallet")}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "wallet"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card/70 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
              }`}
            >
              <Wallet className="size-4 text-emerald-500" />
              <span>Wallet & Payouts</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  activeTab === "wallet"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                ₹{(walletData?.balance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </button>
          </div>
        </section>

        {/* TAB 1: MY BOOKINGS (RENTER VIEW WITH ACCEPTED / REJECTED STATUS) */}
        {activeTab === "bookings" && (
          <section className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Rental Orders
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-foreground">
                  My Booking Requests
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Check whether your rental requests have been accepted, declined, or are pending owner review.
                </p>
              </div>
              <Link to="/planner">
                <Button size="sm" className="gap-1.5 font-bold rounded-xl text-xs">
                  <Sparkles className="size-3.5" /> Plan New Rental
                </Button>
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {myRentals.length > 0 ? (
                myRentals.map((booking) => {
                  let img = booking.product?.image;
                  if (img && !img.startsWith("http") && !img.startsWith("data:")) {
                    img = img.startsWith("/") ? img : `/${img}`;
                  }
                  if (!img) img = cameraImage;

                  const isApproved = booking.status === "APPROVED";
                  const isRejected = booking.status === "REJECTED";
                  const isPending = booking.status === "PENDING";
                  const isCompleted = booking.status === "COMPLETED";

                  return (
                    <article
                      key={booking.id}
                      className={`rounded-3xl border bg-card p-5 transition-all duration-300 ${
                        isApproved
                          ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-md shadow-emerald-500/5"
                          : isRejected
                          ? "border-rose-500/30 bg-rose-500/[0.03]"
                          : "border-border hover:border-primary/40 hover:shadow-md"
                      }`}
                    >
                      <div className="grid grid-cols-[80px_1fr_auto] gap-4">
                        <img
                          src={img}
                          alt=""
                          className="size-20 rounded-2xl object-cover bg-secondary"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = cameraImage;
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground text-base">
                            {booking.product?.title || "Rental Item"}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 text-primary" />
                            <span>{booking.product?.location || "Local pickup"}</span>
                            <span>•</span>
                            <span>₹{booking.product?.dailyRent}/day</span>
                          </p>
                          {booking.product?.owner && (
                            <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                              <span>Listed by:</span>
                              <strong className="text-foreground">{booking.product.owner.name}</strong>
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <strong className="text-lg font-black text-foreground block">
                            ₹{booking.totalPrice}
                          </strong>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                        </div>
                      </div>

                      {/* Status Banner */}
                      <div
                        className={`mt-4 rounded-2xl border p-3.5 text-xs flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
                          isApproved
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : isRejected
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                            : isCompleted
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          {isApproved && <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                          {isRejected && <XCircle className="size-4.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                          {isPending && <Clock3 className="size-4.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                          {isCompleted && <Check className="size-4.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                          <span className="text-sm">
                            {isApproved && "Request Accepted by Owner"}
                            {isRejected && "Request Declined by Owner"}
                            {isPending && "Pending Owner Confirmation"}
                            {isCompleted && "Rental Completed"}
                            {booking.status === "CANCELLED" && "Booking Cancelled"}
                          </span>
                        </div>

                        <span className="text-xs font-semibold opacity-90">
                          {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Status Details / Contact */}
                      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/50 text-xs">
                        {isApproved && booking.product?.owner ? (
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ✓ Approved:
                            </span>
                            {booking.product.owner.email && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <Mail className="size-3.5 text-primary" /> {booking.product.owner.email}
                              </span>
                            )}
                            {booking.product.owner.phone && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <Phone className="size-3.5 text-primary" /> {booking.product.owner.phone}
                              </span>
                            )}
                          </div>
                        ) : isRejected ? (
                          <span className="text-rose-600 dark:text-rose-400 text-xs font-medium">
                            The owner was unable to fulfill this request.
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Submitted on {new Date(booking.createdAt).toLocaleDateString()} • Awaiting owner review
                          </span>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {(isCompleted || isApproved) && (
                            <Link
                              to="/product/$productId"
                              params={{ productId: booking.productId }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
                            >
                              <Star className="size-3.5 fill-current" />
                              <span>{isCompleted ? "Write Review" : "View & Review"}</span>
                            </Link>
                          )}
                          <Link
                            to="/product/$productId"
                            params={{ productId: booking.productId }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                          >
                            <span>Details</span> <ArrowUpRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card/40">
                  <ShoppingBag className="mx-auto mb-2 size-10 text-primary opacity-60" />
                  <p className="font-bold text-foreground text-lg">No bookings placed yet.</p>
                  <p className="mt-1 text-xs max-w-sm mx-auto">
                    When you request items to rent or use the Smart Planner, your bookings and their live approval status will appear right here.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <Link to="/planner">
                      <Button size="sm" className="gap-1.5 font-bold rounded-xl text-xs">
                        <Sparkles className="size-3.5" /> Plan a Rental
                      </Button>
                    </Link>
                    <Link to="/">
                      <Button variant="outline" size="sm" className="font-bold rounded-xl text-xs">
                        Browse Marketplace
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: INCOMING OWNER REQUESTS */}
        {activeTab === "requests" && (
          <section className="mt-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Needs your attention
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-foreground">Incoming Rental Requests</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and approve rental requests placed by verified renters on your listings.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {requests.length > 0 ? (
                requests.map((booking) => (
                  <article
                    key={booking.id}
                    className="rounded-3xl border border-border bg-card p-5 transition-all hover:border-primary/40"
                  >
                    <div className="grid grid-cols-[80px_1fr_auto] gap-4">
                      <img
                        src={
                          booking.product?.image
                            ? booking.product.image.startsWith("http")
                              ? booking.product.image
                              : `/${booking.product.image}`
                            : cameraImage
                        }
                        alt=""
                        className="size-20 rounded-2xl object-cover bg-secondary"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = cameraImage;
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground text-base">
                          {booking.product?.title || "Rental Item"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Requested by <strong className="text-foreground">{booking.renter?.name || "Verified Renter"}</strong>
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-trust">
                          <ShieldCheck className="size-3.5" /> Verified Renter
                        </span>
                      </div>
                      <div className="text-right">
                        <strong className="text-lg font-black text-foreground block">₹{booking.totalPrice}</strong>
                        <span
                          className={`inline-block mt-1 text-[10px] font-bold uppercase rounded-md px-2 py-0.5 ${
                            booking.status === "APPROVED"
                              ? "bg-trust-soft text-trust"
                              : booking.status === "REJECTED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(booking.startDate).toLocaleDateString()} –{" "}
                        {new Date(booking.endDate).toLocaleDateString()}
                      </span>

                      {booking.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive text-xs rounded-xl font-bold"
                            onClick={() => handleBookingAction(booking.id, "REJECTED")}
                          >
                            <X className="size-3.5 mr-1" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-trust hover:bg-trust/90 text-white text-xs rounded-xl font-bold"
                            onClick={() => handleBookingAction(booking.id, "APPROVED")}
                          >
                            <Check className="size-3.5 mr-1" /> Approve
                          </Button>
                        </div>
                      ) : booking.status === "APPROVED" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ Approved / In Use
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-bold rounded-xl border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => handleBookingAction(booking.id, "COMPLETED")}
                          >
                            <CheckCircle2 className="size-3.5 mr-1" /> Mark Returned & Complete
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          Status: {booking.status}
                        </span>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card/40">
                  <ShieldCheck className="mx-auto mb-2 size-10 text-trust" />
                  <p className="font-bold text-foreground text-lg">You’re all caught up.</p>
                  <p className="mt-1 text-xs">No incoming rental requests waiting for review at this moment.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: OWNER INVENTORY */}
        {activeTab === "inventory" && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Inventory
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-foreground">My Listed Products</h2>
              </div>
              <div className="flex rounded-xl border border-border bg-secondary p-1">
                <Button
                  variant={view === "grid" ? "default" : "ghost"}
                  size="icon"
                  aria-label="Grid view"
                  onClick={() => setView("grid")}
                >
                  <Grid2X2 className="size-4" />
                </Button>
                <Button
                  variant={view === "table" ? "default" : "ghost"}
                  size="icon"
                  aria-label="Table view"
                  onClick={() => setView("table")}
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-6 animate-spin mr-2" />
                <span>Loading inventory...</span>
              </div>
            ) : products.length > 0 ? (
              view === "grid" ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {products.map((item) => {
                    const img = resolveProductImage(item.image, item.category?.name, item.title);

                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
                      >
                        <div className="relative aspect-[4/3] bg-secondary">
                          <img
                            src={img}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = cameraImage;
                            }}
                          />
                          <span
                            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase backdrop-blur-xl bg-trust-soft text-trust"
                          >
                            Active
                          </span>
                        </div>
                        <div className="p-4">
                          <p className="font-bold truncate text-foreground">{item.title}</p>
                          <p className="mt-1 text-sm font-medium text-muted-foreground">
                            ₹{item.dailyRent}/day · {item.location}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-3xl border border-border">
                  <table className="w-full min-w-150 text-left text-sm">
                    <thead className="bg-secondary text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Rate</th>
                        <th className="p-4">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((item) => (
                        <tr key={item.id} className="border-t border-border hover:bg-secondary/30">
                          <td className="p-4 font-semibold text-foreground">{item.title}</td>
                          <td className="p-4 text-muted-foreground">{item.category?.name || "General"}</td>
                          <td className="p-4 text-trust font-medium">Active</td>
                          <td className="p-4 font-mono font-bold">₹{item.dailyRent}/day</td>
                          <td className="p-4 text-muted-foreground">{item.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground bg-card/40">
                <Package className="mx-auto mb-3 size-8 text-primary" />
                <p className="font-bold text-foreground">No listings published yet.</p>
                <p className="mt-1 text-xs">
                  Upload an image using Google Gemini AI to publish your first rental listing in seconds.
                </p>
                <div className="mt-4">
                  <AddProductDialog
                    trigger={<Button size="sm" className="rounded-xl font-bold">List an item with AI</Button>}
                    onSuccess={loadDashboardData}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: WALLET & PAYOUTS */}
        {activeTab === "wallet" && (
          <section className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Financial Services
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-foreground">
                  RentHub Wallet & Payouts
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deposit funds for instant 1-click rentals, withdraw earnings to your bank account or UPI, and track all transactions.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setWalletDialogTab("add");
                    setWalletDialogOpen(true);
                  }}
                  className="gap-1.5 font-bold rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="size-3.5" /> Add Funds
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setWalletDialogTab("withdraw");
                    setWalletDialogOpen(true);
                  }}
                  className="gap-1.5 font-bold rounded-xl text-xs"
                >
                  <ArrowUpRight className="size-3.5" /> Withdraw to Bank
                </Button>
              </div>
            </div>

            {/* Big Wallet Hero Card */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Available Balance
                  </span>
                  <Wallet className="size-5 text-emerald-500" />
                </div>
                <p className="mt-3 text-3xl font-black text-foreground font-mono">
                  ₹{(walletData?.balance ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Available for instant rentals
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Total Added
                  </span>
                  <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
                    +
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black text-foreground font-mono">
                  ₹{(walletData?.totalCredited ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Top-ups and incoming rental payouts
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Total Spent & Withdrawn
                  </span>
                  <span className="grid size-8 place-items-center rounded-xl bg-rose-500/10 text-rose-500 font-bold">
                    -
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black text-foreground font-mono">
                  ₹{(walletData?.totalDebited ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Rentals paid and bank payouts
                </p>
              </div>

              <div className="rounded-3xl border border-trust/30 bg-trust-soft/30 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-trust font-bold text-xs">
                    <ShieldCheck className="size-4" />
                    <span>RentHub Escrow</span>
                  </div>
                  <h4 className="mt-1 text-sm font-extrabold text-foreground">
                    Zero Fees & Safe Hold
                  </h4>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    Security deposits are automatically returned to your wallet upon successful return verification.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-trust font-bold mt-2">
                  RBI Compliant Virtual Account
                </span>
              </div>
            </div>

            {/* Transactions Ledger Table */}
            <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Transaction History</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Complete audit trail of all deposits, rental payments, and withdrawals.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWalletDialogTab("overview");
                    setWalletDialogOpen(true);
                  }}
                  className="rounded-xl text-xs font-bold"
                >
                  Full Card View
                </Button>
              </div>

              <div className="mt-4 divide-y divide-border/60">
                {(walletData?.transactions || []).length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    <Wallet className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-bold text-foreground">No transactions recorded yet.</p>
                    <p className="mt-1">Add funds or book an item to see your ledger activity here.</p>
                  </div>
                ) : (
                  (walletData?.transactions || []).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid size-10 place-items-center rounded-2xl ${
                            tx.type === "CREDIT"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          <Wallet className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{tx.description}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {tx.referenceId} · {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-black font-mono block ${
                            tx.type === "CREDIT"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}₹
                          {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Global Wallet Dialog for dashboard actions */}
      <WalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        defaultTab={walletDialogTab}
      />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <p className="mt-5 text-2xl font-extrabold font-mono">{value}</p>
      <p className="mt-1 text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-2 text-[10px] text-muted-foreground">{delta}</p>
    </div>
  );
}
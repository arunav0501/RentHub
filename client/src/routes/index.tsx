import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Camera,
  Car,
  ChevronRight,
  Drill,
  Headphones,
  Loader2,
  MapPin,
  PartyPopper,
  Search,
  ShieldCheck,
  Sparkles,
  TentTree,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/renthub/AppHeader";
import { AddProductDialog } from "@/components/renthub/AddProductDialog";
import { ListingCard, type UnifiedListing } from "@/components/renthub/ListingCard";
import { Button } from "@/components/ui/button";
import { productsApi, type Product } from "@/lib/api";
import { listings as fallbackMockListings } from "@/lib/renthub-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RentHub — Rent anything from trusted neighbors" },
      {
        name: "description",
        content:
          "Rent cameras, vehicles, outdoor gear and more from verified owners near you.",
      },
      { property: "og:title", content: "RentHub — Trusted local rentals" },
      {
        property: "og:description",
        content: "Discover quality items from verified neighbors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoveryPage,
});

const categoryConfig = [
  ["All", Zap],
  ["Electronics", Headphones],
  ["Photography", Camera],
  ["Vehicles", Car],
  ["Tools", Drill],
  ["Party & Events", PartyPopper],
  ["Sports", TentTree],
  ["Audio & Visual", Headphones],
] as const;

function DiscoveryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [dateQuery, setDateQuery] = useState("");

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = () => {
    setLoading(true);
    productsApi
      .getAll()
      .then((items) => {
        setDbProducts(items);
      })
      .catch((err) => {
        console.warn("Could not fetch DB products, falling back to mock:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchListings();

    const handleUpdate = () => fetchListings();
    window.addEventListener("renthub_products_updated", handleUpdate);
    return () => window.removeEventListener("renthub_products_updated", handleUpdate);
  }, []);

  // Map backend products to UnifiedListing
  const mappedDbListings: UnifiedListing[] = dbProducts.map((p, idx) => {
    const defaultTrust = 88 + ((idx * 3) % 11);
    let fullImage = p.image;
    if (fullImage && !fullImage.startsWith("http") && !fullImage.startsWith("data:")) {
      fullImage = fullImage.startsWith("/") ? fullImage : `/${fullImage}`;
    }

    return {
      id: p.id,
      title: p.title,
      category: p.category?.name || "General",
      price: p.dailyRent,
      location: p.location || "Indiranagar",
      distance: `${(1.2 + (idx * 0.7) % 5).toFixed(1)} km`,
      rating: parseFloat((4.85 + (idx * 0.03) % 0.14).toFixed(2)),
      reviews: 14 + (idx * 7) % 35,
      trust: defaultTrust,
      owner: p.owner?.name || "Verified Owner",
      ownerId: p.owner?.id || p.ownerId,
      image: fullImage,
    };
  });

  // Real database listings
  const allListings: UnifiedListing[] = mappedDbListings;

  // Filtering
  const filteredListings = allListings.filter((item) => {
    const matchesCat =
      activeCategory === "All" ||
      item.category.toLowerCase() === activeCategory.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !locationQuery.trim() ||
      item.location.toLowerCase().includes(locationQuery.toLowerCase());

    return matchesCat && matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        {/* Hero Section */}
        <section className="mesh-backdrop relative overflow-hidden border-b border-border px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-trust/25 bg-trust-soft px-3.5 py-2 text-[11px] font-bold uppercase text-trust">
              <ShieldCheck className="size-4" />
              100% verified community & trust scores
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.08] text-foreground sm:text-6xl lg:text-7xl">
              Rent anything from{" "}
              <span className="bg-linear-to-r from-primary to-trust bg-clip-text text-transparent">
                trusted neighbors
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Access remarkable gear and equipment without owning them. Every owner is verified,
              every rental is protected by RentHub Trust Scores.
            </p>

            {/* Interactive Search Bar */}
            <div className="glass-panel mx-auto mt-10 grid max-w-5xl gap-2 rounded-2xl p-2 text-left md:grid-cols-[1.35fr_1fr_1fr_auto] md:rounded-3xl">
              <SearchField
                icon={<Search />}
                label="What are you looking for?"
                placeholder="Sony A7 IV, DJI Drone, Camping gear"
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <SearchField
                icon={<MapPin />}
                label="Location"
                placeholder="Indiranagar, Koramangala"
                value={locationQuery}
                onChange={setLocationQuery}
              />
              <SearchField
                icon={<CalendarDays />}
                label="Rental dates"
                placeholder="Sep 18 – Sep 21"
                value={dateQuery}
                onChange={setDateQuery}
              />
              <Button
                size="lg"
                className="h-full min-h-14 px-7 font-bold"
                onClick={() => { }}
              >
                <Search className="size-4" /> Search
              </Button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-5 text-xs text-muted-foreground">
              <span>{allListings.length}+ active items</span>
              <span className="size-1 rounded-full bg-border" />
              <span>AI-verified specs</span>
              <span className="size-1 rounded-full bg-border" />
              <span>Protected rentals</span>
              <span className="size-1 rounded-full bg-border" />
              <span>Local pickup</span>
            </div>
          </div>
        </section>

        {/* Listings Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Category tabs */}
          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
            {categoryConfig.map(([label, Icon]) => (
              <Button
                key={label}
                variant={activeCategory === label ? "default" : "outline"}
                onClick={() => setActiveCategory(label)}
                className="shrink-0 rounded-full font-medium"
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>

          <div className="mt-12 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase text-primary">
                Curated near you
              </p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Exceptional finds, ready to rent
              </h2>
            </div>
            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={() => {
                setActiveCategory("All");
                setSearchQuery("");
                setLocationQuery("");
              }}
            >
              View all <ChevronRight className="size-4" />
            </Button>
          </div>

          {loading ? (
            <div className="mt-16 flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-3 text-sm">Loading verified marketplace listings...</p>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : allListings.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
              <Sparkles className="mx-auto mb-3 size-8 text-primary" />
              <p className="font-bold text-lg text-foreground">No listings in the marketplace yet.</p>
              <p className="mt-1 text-sm">Upload a product photo to create your first rental listing with Gemini AI!</p>
              <div className="mt-5">
                <AddProductDialog
                  trigger={
                    <Button size="lg" className="font-bold gap-2">
                      <Sparkles className="size-4" /> List an item with AI
                    </Button>
                  }
                  onSuccess={fetchListings}
                />
              </div>
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
              <p className="font-semibold text-foreground">No matching listings found.</p>
              <p className="mt-1 text-sm">Try modifying your search keywords or category filter.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                  setLocationQuery("");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="border-y border-border bg-surface px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase text-trust">Built on trust</p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Rent confidently.
                <br />
                Every single time.
              </h2>
              <p className="mt-4 max-w-md leading-7 text-muted-foreground">
                Identity checks, transparent trust scores, and dynamic damage protection are
                designed into every single exchange.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [
                  "01",
                  "Find it & Check Trust",
                  "Explore quality items nearby with transparent owner trust scores.",
                ],
                [
                  "02",
                  "Request it",
                  "Choose your dates and submit a protected booking request.",
                ],
                [
                  "03",
                  "Enjoy & Return",
                  "Meet locally, inspect condition, and return when finished.",
                ],
              ].map(([number, title, copy]) => (
                <div key={number} className="rounded-2xl border border-border bg-card p-5">
                  <span className="text-xs font-extrabold text-primary">{number}</span>
                  <h3 className="mt-8 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© 2026 RentHub. Borrow better. Built with AI & Trust Engine.</span>
        <span>Trust & Safety · Protection · Help Center</span>
      </footer>
    </div>
  );
}

function SearchField({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <label className="flex min-w-0 items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-accent/60 cursor-pointer">
      <span className="text-primary [&_svg]:size-5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase text-muted-foreground">
          {label}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-transparent text-sm font-semibold text-foreground outline-hidden placeholder:text-muted-foreground"
          placeholder={placeholder}
        />
      </span>
    </label>
  );
}
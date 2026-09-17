import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  aiListingApi,
  categoriesApi,
  productsApi,
  type Category,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import cameraImage from "@/assets/camera.jpg";

interface AddProductDialogProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

const statuses = [
  "Identifying product visual features...",
  "Drafting descriptive title...",
  "Writing comprehensive item description...",
  "Matching marketplace category...",
];

export function AddProductDialog({ trigger, onSuccess }: AddProductDialogProps) {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [stage, setStage] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Categories from backend
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [description, setDescription] = useState("");
  const [dailyRent, setDailyRent] = useState("45");
  const [location, setLocation] = useState("Indiranagar, Bengaluru");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    categoriesApi
      .getAll()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0 && !categoryId && cats[0]?.id) {
          setCategoryId(cats[0].id);
        }
      })
      .catch(() => { });
  }, [categoryId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setGenerated(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("Please choose or drop an image first.");
      inputRef.current?.click();
      return;
    }

    setGenerated(false);
    setStage(1);

    // Visual progression intervals
    const interval = setInterval(() => {
      setStage((prev) => (prev < 4 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await aiListingApi.analyzeImage(selectedFile);
      clearInterval(interval);
      setStage(4);

      // Extract listing info from direct response or nested listing property
      const titleVal = res.title || res.listing?.title || "";
      const descVal = res.description || res.listing?.description || "";
      const brandVal = res.brand || res.listing?.brand || "";
      const modelVal = res.model || res.listing?.model || "";
      const condVal = res.condition || res.listing?.condition || "Good";
      const catIdVal = res.categoryId || res.matchedCategory?.id;
      const catNameVal = res.categoryName || res.listing?.category || "";

      if (titleVal || descVal) {
        setTitle(titleVal);
        setDescription(descVal);
        setBrand(brandVal);
        setModel(modelVal);
        setCondition(condVal);

        if (catIdVal) {
          setCategoryId(catIdVal);
        } else if (catNameVal && categories.length > 0) {
          const found = categories.find(
            (c) => c.name.toLowerCase() === catNameVal.toLowerCase()
          );
          if (found) setCategoryId(found.id);
        }

        setGenerated(true);
        toast.success("AI draft generated successfully! Review & set your price.");
      } else {
        toast.info("Image analyzed. Please fill in the remaining details.");
      }
    } catch (err: any) {
      clearInterval(interval);
      toast.error(err.message || "Failed to analyze image with Gemini AI.");
    } finally {
      setStage(0);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info("Signing you in as Tech Rentals Co. (Owner) for demo...");
      await demoLogin("owner");
    }

    if (!title.trim() || title.trim().length < 3) {
      toast.error("Title must be at least 3 characters.");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("Description must be at least 10 characters.");
      return;
    }

    if (!categoryId) {
      toast.error("Please select a category.");
      return;
    }

    if (!dailyRent || parseFloat(dailyRent) <= 0) {
      toast.error("Please provide a valid positive daily rent.");
      return;
    }

    if (!location.trim() || location.trim().length < 3) {
      toast.error("Please provide a pickup location.");
      return;
    }

    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("categoryId", categoryId);
      formData.append("dailyRent", dailyRent);
      formData.append("location", location);
      formData.append("quantity", quantity || "1");
      formData.append("condition", condition || "Good");
      if (brand) formData.append("brand", brand);
      if (model) formData.append("model", model);
      if (selectedFile) formData.append("image", selectedFile);

      await productsApi.create(formData);

      toast.success("Product listed successfully on RentHub!");
      setOpen(false);

      // Reset form
      setSelectedFile(null);
      setPreview(undefined);
      setGenerated(false);
      setTitle("");
      setDescription("");

      if (onSuccess) {
        onSuccess();
      } else {
        // Trigger global listing refresh
        window.dispatchEvent(new Event("renthub_products_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to publish listing.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[92vh] overflow-y-auto border-border p-0 sm:max-w-3xl sm:rounded-3xl">
        <div className="border-b border-border bg-accent/60 p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="text-primary" /> AI Image → Listing
            </DialogTitle>
            <DialogDescription>
              Powered by AI · turn any photo into a polished, verified listing
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[0.85fr_1.15fr]">
          {/* Photo & AI Generation Column */}
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="relative aspect-square h-auto w-full overflow-hidden whitespace-normal rounded-2xl border-dashed border-primary/40 bg-accent/30 p-0 text-center hover:bg-accent/60 transition-all"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Product preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full place-items-center p-6">
                  <span>
                    <ImagePlus className="mx-auto mb-3 size-9 text-primary" />
                    <span className="block font-bold text-foreground">
                      Drop a product photo
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      or click to browse from device
                    </span>
                  </span>
                </span>
              )}
              {stage > 0 && <span className="scanner absolute inset-x-0 top-0 h-1/4" />}
            </Button>

            <Button
              className="mt-3 w-full"
              onClick={handleGenerate}
              disabled={stage > 0}
            >
              {stage > 0 ? (
                <>
                  <Loader2 className="animate-spin size-4" /> Analyzing image...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Generate with AI
                </>
              )}
            </Button>

            {stage > 0 && (
              <div className="mt-4 space-y-2 rounded-xl bg-secondary/50 p-3.5">
                {statuses.map((status, index) => (
                  <p
                    key={status}
                    className={`flex items-center gap-2 text-xs transition-colors ${index < stage
                      ? "text-trust font-medium"
                      : "text-muted-foreground"
                      }`}
                  >
                    {index < stage ? (
                      <Check className="size-3.5 text-trust" />
                    ) : (
                      <span className="size-3.5 rounded-full border border-border inline-block" />
                    )}
                    {status}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Listing Form Column */}
          <form className="space-y-4" onSubmit={handlePublish}>
            {generated && (
              <div className="flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2.5 text-xs font-semibold text-accent-foreground">
                <Sparkles className="size-4 shrink-0 text-primary" />
                <span>AI suggestions populated — verify details, set rate and location.</span>
              </div>
            )}

            <Field label="Title">
              <Input
                className="h-11 rounded-xl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sony A7 IV Creator Kit"
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Condition">
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-ring"
                >
                  <option value="New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand">
                <Input
                  className="h-11 rounded-xl"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Sony, DJI, Trek"
                />
              </Field>
              <Field label="Model">
                <Input
                  className="h-11 rounded-xl"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. A7 IV, Mavic 3"
                />
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                className="min-h-24 rounded-xl text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe condition, included accessories, and pickup terms..."
                required
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Daily Rent ($)">
                <Input
                  type="number"
                  className="h-11 rounded-xl font-mono"
                  value={dailyRent}
                  onChange={(e) => setDailyRent(e.target.value)}
                  placeholder="45"
                  min="1"
                  required
                />
              </Field>
              <Field label="Location">
                <Input
                  className="h-11 rounded-xl"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Neighborhood"
                  required
                />
              </Field>
              <Field label="Quantity">
                <Input
                  type="number"
                  className="h-11 rounded-xl font-mono"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  required
                />
              </Field>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-sm font-bold"
              size="lg"
              disabled={isPublishing || stage > 0}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="animate-spin size-4" /> Publishing listing...
                </>
              ) : (
                <>
                  <Upload className="size-4" /> Publish to Marketplace
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
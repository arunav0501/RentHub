import { Link } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Moon,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BrandMark } from "./BrandMark";
import { AddProductDialog } from "./AddProductDialog";
import { WalletDialog } from "./WalletDialog";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { walletApi } from "@/lib/api";
import { toast } from "sonner";

export function AppHeader() {
  const { user, isAuthenticated, login, register, demoLogin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const handleOpenAuth = () => {
      setAuthMode("login");
      setAuthDialogOpen(true);
    };
    window.addEventListener("renthub_open_auth", handleOpenAuth);
    return () => window.removeEventListener("renthub_open_auth", handleOpenAuth);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    walletApi.getWallet().then((w) => setWalletBalance(w.balance)).catch(() => {});
    const update = () => {
      walletApi.getWallet().then((w) => setWalletBalance(w.balance)).catch(() => {});
    };
    window.addEventListener("renthub_wallet_updated", update);
    window.addEventListener("renthub_auth_changed", update);
    return () => {
      window.removeEventListener("renthub_wallet_updated", update);
      window.removeEventListener("renthub_auth_changed", update);
    };
  }, [isAuthenticated]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        await login(email, password);
        toast.success(`Welcome back, ${email}!`);
      } else {
        await register({ name, email, password, role: "OWNER" });
        toast.success(`Account created! Welcome to RentHub, ${name}!`);
      }
      setAuthDialogOpen(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoSwitch = async (role: "owner" | "renter") => {
    try {
      await demoLogin(role);
      toast.success(
        role === "owner"
          ? "Switched to Owner: Tech Rentals Co."
          : "Switched to Renter: Alice Renter"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to switch demo account");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="RentHub home">
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          <Link
            to="/"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Explore
          </Link>
          <Link
            to="/planner"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground font-bold" }}
          >
            <Sparkles className="size-4 text-primary" />
            <span>Smart Planner</span>
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">AI</span>
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Dashboard
          </Link>
          <a
            href="/#how-it-works"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDark ? "Use light theme" : "Use dark theme"}
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {/* RentHub Wallet Balance Pill */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setWalletDialogOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all shadow-xs cursor-pointer"
              title="RentHub Digital Wallet"
            >
              <Wallet className="size-3.5" />
              <span>₹{(walletBalance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </button>
          )}

          {/* List an item button */}
          <AddProductDialog
            trigger={
              <Button className="hidden sm:inline-flex text-xs font-bold gap-1.5">
                <Sparkles className="size-3.5" /> List with AI
              </Button>
            }
          />

          {/* User Account / Avatar Button */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 shadow-xs hover:border-primary/40 hover:bg-accent/40 transition-all cursor-pointer"
                  aria-label="View account options"
                >
                  <div className="relative grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs">
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : <User className="size-3.5" />}
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-background bg-trust" />
                  </div>
                  <span className="text-xs font-bold text-foreground max-w-28 truncate hidden sm:inline-block">
                    {user?.name}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 glass-panel rounded-2xl p-1.5">
                <DropdownMenuLabel className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {user?.name
                        ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{user?.name}</p>
                      <p className="text-[11px] text-muted-foreground font-normal truncate">{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setProfileDialogOpen(true)}
                  className="cursor-pointer text-xs font-medium"
                >
                  <User className="size-3.5 mr-2 text-primary" />
                  <span>View Signed In Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setWalletDialogOpen(true)}
                  className="cursor-pointer text-xs font-medium"
                >
                  <Wallet className="size-3.5 mr-2 text-emerald-500" />
                  <span>RentHub Wallet</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer text-xs font-medium">
                    <LayoutDashboard className="size-3.5 mr-2 text-primary" />
                    <span>Owner Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-1">
                  Switch Account Preset
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleDemoSwitch("owner")}
                  className="cursor-pointer text-xs"
                >
                  <ShieldCheck className="size-3.5 text-trust mr-2" />
                  <span>Tech Rentals Co. (Owner)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDemoSwitch("renter")}
                  className="cursor-pointer text-xs"
                >
                  <UserCheck className="size-3.5 text-primary mr-2" />
                  <span>Alice Renter (Renter)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-xs text-destructive focus:text-destructive"
                >
                  <LogOut className="size-3.5 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setAuthMode("login");
                  setAuthDialogOpen(true);
                }}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <LogIn className="size-3.5" />
                <span>Sign In</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-medium px-2"
                    title="Quick demo access"
                  >
                    <Users className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-panel rounded-2xl p-1.5">
                  <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
                    Quick Demo Access
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleDemoSwitch("owner")}
                    className="cursor-pointer text-xs font-medium"
                  >
                    <ShieldCheck className="size-4 text-trust mr-2" />
                    <span>Owner: Tech Rentals Co.</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDemoSwitch("renter")}
                    className="cursor-pointer text-xs font-medium"
                  >
                    <UserCheck className="size-4 text-primary mr-2" />
                    <span>Renter: Alice Renter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Menu />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="grid gap-1 border-t border-border bg-background p-3 md:hidden">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-accent"
            onClick={() => setMenuOpen(false)}
          >
            Explore
          </Link>
          <Link
            to="/planner"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-accent"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Smart Planner
            </span>
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">AI</span>
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-accent"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
        </nav>
      )}

      {/* Authentication Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="glass-panel sm:max-w-md sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {authMode === "login" ? "Sign in to RentHub" : "Create your account"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "login"
                ? "Access your dashboard, listings, and reputation metrics."
                : "Join the verified community for trusted local rentals."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAuthSubmit} className="space-y-4 pt-2">
            {authMode === "register" && (
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Rao"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={authLoading}>
              {authLoading
                ? "Processing..."
                : authMode === "login"
                ? "Sign In"
                : "Create Account"}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              {authMode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className="font-bold text-primary hover:underline"
                  >
                    Register now
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="font-bold text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="glass-panel sm:max-w-md sm:rounded-3xl p-0 overflow-hidden">
          <div className="bg-linear-to-b from-primary/15 via-primary/5 to-transparent p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="relative grid size-16 place-items-center rounded-full bg-primary text-xl font-extrabold text-primary-foreground shadow-md">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U"}
                <span className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-background bg-trust" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-foreground truncate">{user?.name}</h3>
                  <span className="rounded-full bg-trust-soft px-2 py-0.5 text-[10px] font-bold uppercase text-trust">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                <span className="mt-1.5 inline-block rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
                  {user?.role === "OWNER" ? "Owner Account" : "Renter Account"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Mail className="size-3.5 text-primary" /> Email
                </span>
                <span className="font-semibold text-foreground truncate max-w-50">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Phone className="size-3.5 text-primary" /> Phone
                </span>
                <span className="font-semibold text-foreground">{user?.phone || "+91 98765 43210"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="size-3.5 text-trust" /> Reputation
                </span>
                <span className="font-bold text-trust">Verified Member (92/100)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <UserCheck className="size-3.5 text-primary" /> Account ID
                </span>
                <span className="font-mono text-muted-foreground text-[11px] truncate max-w-40">{user?.id}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link to="/dashboard" className="flex-1" onClick={() => setProfileDialogOpen(false)}>
                <Button className="w-full font-bold text-xs gap-1.5 h-10">
                  <LayoutDashboard className="size-3.5" /> Owner Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                className="font-bold text-xs text-destructive hover:text-destructive h-10"
                onClick={() => {
                  setProfileDialogOpen(false);
                  logout();
                }}
              >
                <LogOut className="size-3.5 mr-1" /> Sign Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RentHub Digital Wallet Dialog */}
      <WalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
      />
    </header>
  );
}
import { useState, useEffect } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CreditCard,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
  Building2,
  Smartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { walletApi, type WalletData, type WalletTransaction } from "@/lib/api";
import { toast } from "sonner";

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "overview" | "add" | "withdraw";
}

export function WalletDialog({
  open,
  onOpenChange,
  defaultTab = "overview",
}: WalletDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"overview" | "add" | "withdraw">(defaultTab);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Funds form state
  const [addAmount, setAddAmount] = useState("1000");
  const [addMethod, setAddMethod] = useState<"UPI" | "CARD">("UPI");
  const [upiId, setUpiId] = useState("alice@okhdfcbank");
  const [cardNumber, setCardNumber] = useState("4532 8921 4012 3456");

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [withdrawMethod, setWithdrawMethod] = useState<"UPI" | "BANK_TRANSFER">("UPI");
  const [withdrawUpi, setWithdrawUpi] = useState("alice@okhdfcbank");
  const [bankAccount, setBankAccount] = useState({
    accountNumber: "987654321012",
    ifsc: "HDFC0001234",
    accountHolder: user?.name || "Alice Renter",
  });

  const [txFilter, setTxFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");

  const loadWallet = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await walletApi.getWallet();
      setWallet(data);
    } catch (err: any) {
      console.error("Failed to load wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      loadWallet();
    }
  }, [open, defaultTab, isAuthenticated]);

  useEffect(() => {
    const handleWalletUpdated = () => loadWallet();
    window.addEventListener("renthub_wallet_updated", handleWalletUpdated);
    return () => window.removeEventListener("renthub_wallet_updated", handleWalletUpdated);
  }, []);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(addAmount);
    if (!amount || amount < 50) {
      toast.error("Minimum deposit amount is ₹50");
      return;
    }

    setActionLoading(true);
    try {
      const res = await walletApi.addFunds({
        amount,
        paymentMethod: addMethod,
        ...(addMethod === "UPI" && upiId ? { upiId } : {}),
        ...(addMethod === "CARD" ? { cardLast4: cardNumber.replace(/\s+/g, "").slice(-4) } : {}),
      });

      toast.success(`Added ₹${amount.toLocaleString("en-IN")} to your wallet!`);
      await loadWallet();
      setTab("overview");
    } catch (err: any) {
      toast.error(err.message || "Failed to add funds");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    const balance = wallet?.balance ?? 0;

    if (!amount || amount < 50) {
      toast.error("Minimum withdrawal amount is ₹50");
      return;
    }

    if (amount > balance) {
      toast.error(`Insufficient balance. Maximum withdrawable is ₹${balance.toLocaleString("en-IN")}`);
      return;
    }

    setActionLoading(true);
    try {
      await walletApi.withdraw({
        amount,
        withdrawalMethod: withdrawMethod,
        ...(withdrawMethod === "UPI" && withdrawUpi ? { upiId: withdrawUpi } : {}),
        ...(withdrawMethod === "BANK_TRANSFER" ? { bankDetails: bankAccount } : {}),
      });

      toast.success(`Withdrawal of ₹${amount.toLocaleString("en-IN")} requested successfully!`);
      await loadWallet();
      setTab("overview");
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTransactions = (wallet?.transactions || []).filter((tx) => {
    if (txFilter === "ALL") return true;
    return tx.type === txFilter;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-3xl border-border bg-card">
        {/* Header with Virtual Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border-b border-white/10">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute right-12 bottom-0 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />

          <DialogHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                  <Wallet className="size-5 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black tracking-tight text-white">
                    RentHub Digital Wallet
                  </DialogTitle>
                  <DialogDescription className="text-xs text-white/70">
                    Zero-fee instant rentals & fast bank payouts
                  </DialogDescription>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={loadWallet}
                disabled={loading}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </DialogHeader>

          {/* Virtual Platinum Card */}
          <div className="mt-5 relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-tr from-white/10 via-white/5 to-white/15 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  Available Balance
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight text-white">
                    ₹{(wallet?.balance ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                  <ShieldCheck className="size-3.5" />
                  <span>Verified & Protected</span>
                </div>
                <span className="mt-2 text-[10px] font-mono tracking-widest text-white/50">
                  •••• 4920
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-white/60">Cardholder</span>
                <p className="font-bold text-white tracking-wide">{user?.name || "Alice Renter"}</p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-extrabold tracking-widest text-white/90">
                <Sparkles className="size-3.5 text-primary" />
                <span>RentHub Pay</span>
              </div>
            </div>
          </div>

          {/* Navigation Pill Buttons */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                tab === "overview"
                  ? "bg-white text-slate-900 shadow-md font-extrabold"
                  : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
            >
              <History className="size-3.5" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("add")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                tab === "add"
                  ? "bg-emerald-500 text-white shadow-md font-extrabold"
                  : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
            >
              <Plus className="size-3.5" />
              <span>Add Funds</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("withdraw")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                tab === "withdraw"
                  ? "bg-primary text-white shadow-md font-extrabold"
                  : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
            >
              <ArrowUpRight className="size-3.5" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {tab === "add" && (
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground">
                  Select or Enter Amount to Add (₹)
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {["500", "1000", "2500", "5000"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddAmount(preset)}
                      className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                        addAmount === preset
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-card hover:bg-secondary"
                      }`}
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="50"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="pl-7 font-mono font-bold"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Payment Method</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddMethod("UPI")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                      addMethod === "UPI"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <Smartphone className="size-4" />
                    <span>Instant UPI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMethod("CARD")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                      addMethod === "CARD"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <CreditCard className="size-4" />
                    <span>Debit / Credit Card</span>
                  </button>
                </div>
              </div>

              {addMethod === "UPI" ? (
                <div>
                  <label className="text-xs font-bold text-foreground">UPI ID / VPA</label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="mt-1"
                    required
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Supports Google Pay, PhonePe, Paytm, BHIM and all major banking apps.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Card Number</label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 •••• •••• ••••"
                      className="mt-1 font-mono"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-foreground">Expiry</label>
                      <Input defaultValue="12/28" className="mt-1 font-mono" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-foreground">CVV</label>
                      <Input defaultValue="892" type="password" maxLength={3} className="mt-1 font-mono" />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Processing Deposit...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Add ₹{Number(addAmount || 0).toLocaleString("en-IN")} Instantly
                  </>
                )}
              </Button>
            </form>
          )}

          {tab === "withdraw" && (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Withdrawal Amount (₹)</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(wallet?.balance ?? 0))}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Withdraw All (Max ₹{wallet?.balance ?? 0})
                  </button>
                </div>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="50"
                    max={wallet?.balance ?? 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="pl-7 font-mono font-bold"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Payout Destination</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("UPI")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                      withdrawMethod === "UPI"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <Smartphone className="size-4" />
                    <span>Instant to UPI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("BANK_TRANSFER")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                      withdrawMethod === "BANK_TRANSFER"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <Building2 className="size-4" />
                    <span>Bank Transfer (NEFT/IMPS)</span>
                  </button>
                </div>
              </div>

              {withdrawMethod === "UPI" ? (
                <div>
                  <label className="text-xs font-bold text-foreground">Your UPI ID for Payout</label>
                  <Input
                    value={withdrawUpi}
                    onChange={(e) => setWithdrawUpi(e.target.value)}
                    placeholder="alice@okhdfcbank"
                    className="mt-1"
                    required
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Funds will be instantly transferred to your linked bank account via UPI.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-foreground">Account Holder Name</label>
                    <Input
                      value={bankAccount.accountHolder}
                      onChange={(e) =>
                        setBankAccount({ ...bankAccount, accountHolder: e.target.value })
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-foreground">Account Number</label>
                      <Input
                        value={bankAccount.accountNumber}
                        onChange={(e) =>
                          setBankAccount({ ...bankAccount, accountNumber: e.target.value })
                        }
                        className="mt-1 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-foreground">IFSC Code</label>
                      <Input
                        value={bankAccount.ifsc}
                        onChange={(e) =>
                          setBankAccount({ ...bankAccount, ifsc: e.target.value.toUpperCase() })
                        }
                        className="mt-1 font-mono uppercase"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-bold gap-2"
                disabled={actionLoading || (wallet?.balance ?? 0) <= 0}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Processing Payout...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="size-4" /> Withdraw ₹
                    {Number(withdrawAmount || 0).toLocaleString("en-IN")} to Bank
                  </>
                )}
              </Button>
            </form>
          )}

          {tab === "overview" && (
            <div>
              {/* Financial Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <ArrowDownLeft className="size-4" />
                    <span>Total Added / Earned</span>
                  </div>
                  <p className="mt-1 text-xl font-black text-foreground">
                    ₹{(wallet?.totalCredited ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <ArrowUpRight className="size-4" />
                    <span>Total Spent / Withdrawn</span>
                  </div>
                  <p className="mt-1 text-xl font-black text-foreground">
                    ₹{(wallet?.totalDebited ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Transaction Filters */}
              <div className="mt-5 flex items-center justify-between border-b border-border pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Activity ({filteredTransactions.length})
                </h4>

                <div className="flex gap-1">
                  {(["ALL", "CREDIT", "DEBIT"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTxFilter(filter)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition-colors ${
                        txFilter === filter
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {filter === "ALL" ? "All" : filter === "CREDIT" ? "Added" : "Debited"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions List */}
              <div className="mt-3 divide-y divide-border/60 max-h-60 overflow-y-auto">
                {filteredTransactions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No transactions found in this category.
                  </div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid size-9 place-items-center rounded-xl ${
                            tx.type === "CREDIT"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {tx.type === "CREDIT" ? (
                            <ArrowDownLeft className="size-4" />
                          ) : (
                            <ArrowUpRight className="size-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground line-clamp-1">
                            {tx.description}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {tx.referenceId} · {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-black font-mono ${
                            tx.type === "CREDIT"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}₹
                          {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

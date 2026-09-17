// Centralized API Client for RentHub

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null | undefined;
  role?: "USER" | "OWNER" | "ADMIN" | undefined;
  avatarUrl?: string | undefined;
  bio?: string | undefined;
  walletBalance?: number | undefined;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  dailyRent: number;
  location: string;
  quantity: number;
  condition: string;
  brand?: string | null | undefined;
  model?: string | null | undefined;
  image?: string | null | undefined;
  createdAt: string;
  categoryId: string;
  category?: Category | undefined;
  ownerId: string;
  owner?: {
    id?: string | undefined;
    name: string;
    email: string;
    phone?: string | null | undefined;
  } | undefined;
}

export interface TrustScoreBreakdownItem {
  category: string;
  score: number;
  max: number;
  percentage: number;
}

export interface TrustScoreIndicator {
  label: string;
  positive: boolean;
}

export interface TrustScoreResponse {
  userId: string;
  role: "OWNER" | "RENTER";
  score: number;
  tier: "EXCELLENT" | "VERY_GOOD" | "GOOD" | "FAIR" | "LOW" | "ESTABLISHED";
  tierLabel: string;
  tierColor: string;
  isNewMember: boolean;
  breakdown: TrustScoreBreakdownItem[];
  indicators: TrustScoreIndicator[];
  stats: {
    verifiedEmail: boolean;
    phoneProvided: boolean;
    activeListings?: number | undefined;
    completedRentals?: number | undefined;
    cancellations?: number | undefined;
    accountAgeDays?: number | undefined;
  };
}

export interface AIListingResponse {
  title?: string | undefined;
  description?: string | undefined;
  categoryId?: string | null | undefined;
  categoryName?: string | null | undefined;
  brand?: string | undefined;
  model?: string | undefined;
  condition?: string | undefined;
  listing?: {
    title: string;
    description: string;
    category?: string | undefined;
    brand?: string | undefined;
    model?: string | undefined;
    condition?: string | undefined;
  } | undefined;
  matchedCategory?: Category | undefined;
  availableCategories?: Category[] | undefined;
}

export interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  paymentMethod?: "CREDIT_CARD" | "DEBIT_CARD" | "UPI" | "WALLET" | "CASH_ON_DELIVERY" | undefined;
  paymentStatus?: "PENDING" | "PAID" | "CASH_ON_DELIVERY" | "FAILED" | "REFUNDED" | undefined;
  paymentRef?: string | null | undefined;
  createdAt: string;
  productId: string;
  product?: Product | undefined;
  renterId: string;
  renter?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null | undefined;
  } | undefined;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  productId: string;
  userId: string;
  bookingId?: string | null | undefined;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  } | undefined;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  breakdown: {
    stars: number;
    count: number;
    percentage: number;
  }[];
}

export interface ProductReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string | null | undefined;
  eligibleBookingId?: string | null | undefined;
  alreadyReviewed: boolean;
  existingReview?: Review | null | undefined;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  category: "TOPUP" | "WITHDRAWAL" | "RENTAL_PAYMENT" | "RENTAL_EARNING" | "REFUND";
  description: string;
  paymentMethod?: string | null | undefined;
  referenceId: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  createdAt: string;
}

export interface WalletData {
  balance: number;
  totalCredited: number;
  totalDebited: number;
  transactions: WalletTransaction[];
}

const TOKEN_KEY = "renthub_auth_token";
const USER_KEY = "renthub_user_data";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw || raw === "undefined" || raw === "null") return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.id) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User) {
  if (typeof window === "undefined" || !token || !user) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("renthub_auth_changed"));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("renthub_auth_changed"));
}

// API Base URL helper (supports VITE_API_URL in production)
export const API_BASE_URL = (String(import.meta.env["VITE_API_URL"] || "")).replace(/\/$/, "");

export function getFullApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

// Request helper
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If not sending FormData, ensure JSON Content-Type
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(getFullApiUrl(path), {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  let data: any = null;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || (typeof data === "string" ? data : `Request failed with ${response.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const result = await request<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const user: User = result.user || {
      id: result.id,
      name: result.name,
      email: result.email,
      phone: result.phone,
      role: result.role,
    };
    const token = result.token;
    setAuth(token, user);
    return { token, user };
  },

  async register(data: { name: string; email: string; password: string; phone?: string; role?: string }): Promise<{ token: string; user: User }> {
    const result = await request<any>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const user: User = result.user || {
      id: result.id,
      name: result.name,
      email: result.email,
      phone: result.phone,
      role: result.role,
    };
    const token = result.token;
    setAuth(token, user);
    return { token, user };
  },

  async getProfile(): Promise<User> {
    const res = await request<any>("/api/auth/profile");
    return res.user || res;
  },

  async demoLogin(preset: "owner" | "renter"): Promise<{ token: string; user: User }> {
    const email = preset === "owner" ? "tech@renthub.com" : "alice@renthub.com";
    return authApi.login(email, "password123");
  },
};

// Categories API
export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    return request<Category[]>("/api/categories");
  },
};

// Products API
export const productsApi = {
  async getAll(params?: { search?: string; category?: string; location?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    if (params?.location) query.append("location", params.location);
    const queryString = query.toString();
    return request<Product[]>(`/api/products${queryString ? `?${queryString}` : ""}`);
  },

  async getById(id: string): Promise<Product> {
    return request<Product>(`/api/products/${id}`);
  },

  async getMyProducts(): Promise<Product[]> {
    return request<Product[]>("/api/products/owner/me");
  },

  async create(formData: FormData): Promise<Product> {
    return request<Product>("/api/products", {
      method: "POST",
      body: formData,
    });
  },
};

// Trust Score API
export const trustScoreApi = {
  async getScore(userId: string, role: "OWNER" | "RENTER" = "OWNER"): Promise<TrustScoreResponse> {
    return request<TrustScoreResponse>(`/api/users/${userId}/trust-score?role=${role}`);
  },
};

// AI Listing API
export const aiListingApi = {
  async analyzeImage(imageFile: File): Promise<AIListingResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);
    return request<AIListingResponse>("/api/ai-listing/analyze-image", {
      method: "POST",
      body: formData,
    });
  },
};

// Bookings API
export const bookingsApi = {
  async create(data: {
    productId: string;
    startDate: string;
    endDate: string;
    paymentMethod?: "CREDIT_CARD" | "DEBIT_CARD" | "UPI" | "WALLET" | "CASH_ON_DELIVERY" | undefined;
    paymentDetails?: any;
  }): Promise<Booking> {
    const res = await request<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (data.paymentMethod === "WALLET") {
      window.dispatchEvent(new Event("renthub_wallet_updated"));
    }
    return res;
  },

  async getMyRentals(): Promise<Booking[]> {
    return request<Booking[]>("/api/bookings/my-rentals");
  },

  async getOwnerRequests(): Promise<Booking[]> {
    return request<Booking[]>("/api/bookings/owner-requests");
  },

  async updateStatus(bookingId: string, status: "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED"): Promise<Booking> {
    return request<Booking>(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

// Reviews API
export const reviewsApi = {
  async getByProductId(productId: string): Promise<ProductReviewsResponse> {
    return request<ProductReviewsResponse>(`/api/reviews/product/${productId}`);
  },

  async checkCanReview(productId: string): Promise<CanReviewResponse> {
    return request<CanReviewResponse>(`/api/reviews/can-review/${productId}`);
  },

  async create(data: {
    productId: string;
    rating: number;
    comment: string;
    bookingId?: string | null | undefined;
  }): Promise<Review> {
    return request<Review>("/api/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Wallet API
export const walletApi = {
  async getWallet(): Promise<WalletData> {
    return request<WalletData>("/api/wallet");
  },

  async addFunds(data: {
    amount: number;
    paymentMethod?: "UPI" | "CARD" | "NETBANKING" | undefined;
    upiId?: string | undefined;
    cardLast4?: string | undefined;
  }): Promise<{ message: string; balance: number; transaction: WalletTransaction }> {
    const res = await request<{ message: string; balance: number; transaction: WalletTransaction }>("/api/wallet/add-funds", {
      method: "POST",
      body: JSON.stringify(data),
    });
    window.dispatchEvent(new Event("renthub_wallet_updated"));
    return res;
  },

  async withdraw(data: {
    amount: number;
    withdrawalMethod?: "UPI" | "BANK_TRANSFER" | undefined;
    upiId?: string | undefined;
    bankDetails?: {
      accountNumber: string;
      ifsc: string;
      accountHolder: string;
    } | undefined;
  }): Promise<{ message: string; balance: number; transaction: WalletTransaction }> {
    const res = await request<{ message: string; balance: number; transaction: WalletTransaction }>("/api/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify(data),
    });
    window.dispatchEvent(new Event("renthub_wallet_updated"));
    return res;
  },
};

// Smart Rental Planner API
export interface PlannedProduct {
  id: string;
  title: string;
  description: string;
  dailyRent: number;
  location: string;
  brand?: string | null;
  model?: string | null;
  image?: string | null;
  category?: {
    id: string;
    name: string;
  };
  relevanceScore: number;
  matchReasons: string[];
  available: boolean;
  availabilityStatus: string;
}

export interface TripRequirement {
  item: string;
  priority: "essential" | "recommended" | "optional";
  reason: string;
  matchedCategory?: string | null;
  keywords?: string[];
  products: PlannedProduct[];
}

export interface TripDetails {
  destination?: string | null;
  durationDays?: number | null;
  people?: number | null;
  tripType?: string;
  activities?: string[];
  budget?: string | null;
  dates?: string | null;
  preferences?: string | null;
}

export interface TripPlanResponse {
  trip: TripDetails;
  isClarificationNeeded?: boolean;
  clarificationQuestion?: string | null;
  requirements: TripRequirement[];
  summary: {
    totalRequirements: number;
    availableCount: number;
    unavailableCount: number;
  };
}

export const tripPlannerApi = {
  async analyze(prompt: string): Promise<TripPlanResponse> {
    return request<TripPlanResponse>("/api/trip-planner/analyze", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
  },
};


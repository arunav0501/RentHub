# RentHub - Online Rental Marketplace

RentHub is a modern, full-stack web application designed for a semester-long Software Engineering project. It provides a platform where users can easily rent high-quality equipment, electronics, instruments, camping gear, and more from trusted people in their community, while also listing their own items to earn money.

## 🚀 Key Features

* **RentHub Trust Score:** A transparent, dynamic 0-100 reputation calculation engine and breakdown system for owners and renters based on verified transactions, profile completeness, listing quality, and reliability.
* **AI Image → Listing:** Automated listing assistant powered by Google Gemini Vision. Owners upload a product photo, and Gemini drafts accurate titles, descriptions, categories, brands, models, and condition estimates without inventing facts.
* **Smart Rental Planner:** Natural language equipment and gear rental assistant powered by Gemini NLU. Users input prompts like *"I need a camera and lens for a weekend shoot"* or *"I'm going to Goa for 5 days with 4 friends"*, and RentHub analyzes intent, generates a curated checklist, searches real marketplace inventory in PostgreSQL, ranks relevance and proximity, computes live rental prices, and powers seamless booking.
* **Digital Wallet & Multi-Rail Payments:** Integrated stored-value wallet with atomic double-entry ledger accounting (`WalletTransaction`), instant balance top-up via UPI/Card, withdrawal with overdraft prevention, and multi-rail checkout (Wallet Balance, UPI, Credit/Debit Card, and Cash on Delivery).
* **Verified Renter Reviews & Ratings:** Cryptographically verified review moderation system ensuring only renters with completed or approved bookings can rate (1–5 stars) and review equipment, maintaining marketplace integrity.
* **Unified Dual-Role User Experience:** Every registered user can seamlessly act as both a renter and an owner from a single account without rigid role constraints.
* **Owner Dashboard:** A centralized control panel to list new items for rent and manage incoming rental requests (Approve, Reject, Complete).
* **Dynamic Booking Engine:** Users select rental dates on a product page, instantly seeing the total calculated price before submitting a rental request with automated date conflict prevention.
* **Global Dark Mode:** A premium, fully responsive UI built with Tailwind CSS v4 that includes a system-aware Dark Theme toggle.
* **Secure Authentication:** Robust JWT-based authentication with bcrypt-encrypted passwords (10 salt rounds) and Zod input validation to keep user data safe.
* **Verified Asset Storage:** Local image upload processing with Multer and MIME validation for authentic equipment listings.

---

## 🛡️ Feature 1: RentHub Trust Score

The **RentHub Trust Score** is a dynamic reputation system (0 to 100) calculated server-side from real database activity. It cannot be tampered with or submitted by the client.

### Score Tiers
* **90–100:** Excellent
* **75–89:**  Very Good
* **60–74:**  Good
* **40–59:**  Fair
* **0–39:**   Low

> **Neutral Baseline for New Members:** Brand-new members with zero completed bookings or listings are assigned a neutral baseline score (~65 / 100) and labeled as **"New Member"** rather than starting at 0 or an artificially high score.

### Scoring Factors & Weights

#### Owner Trust Score (Total: 100 pts)
1. **Profile Completeness (20% - 20 pts):** Verified name (+5), verified email (+5), phone number linked (+5), and account age/tenure (+5).
2. **Listing Quality (25% - 25 pts):** Number of active listings (up to 10 pts), verified image coverage (5 pts), detailed descriptions >= 40 chars (5 pts), specifications completeness (brand, model, condition) (5 pts).
3. **Rental History & Fulfillment (35% - 35 pts):** Volume of completed rentals (up to 20 pts) and fulfillment/approval rate of received rental requests (15 pts).
4. **Reliability & Cancellation Record (20% - 20 pts):** Zero cancellations earns the full 20 pts, with tiered penalties as cancellation rate rises.

#### Renter Trust Score (Total: 100 pts)
1. **Profile Completeness (25% - 25 pts):** Name (+10), Email (+8), Phone linked (+7).
2. **Account Tenure (15% - 15 pts):** Age of account scaled up to 15 pts.
3. **Rental Experience (35% - 35 pts):** Volume of successfully completed rentals (up to 25 pts) and rental success rate (10 pts).
4. **Reliability & Cancellation Record (25% - 25 pts):** Proportion of non-cancelled bookings (up to 25 pts).

### Trust Score API
* **Endpoint:** `GET /api/users/:id/trust-score?role=OWNER|RENTER`
* **Response:** Structured JSON containing total score, tier label, tier color, `isNewMember` flag, breakdown by category with max scores, positive trust indicators, and raw stats.

---

## ✨ Feature 2: AI Image → Listing (Google Gemini Vision)

The **AI Image → Listing** feature allows owners to upload a product photograph and automatically generate an accurate listing draft using Google's Gemini Vision model.

### Workflow
```text
Owner
  ↓
Uploads Product Image in Add Product Modal
  ↓
Google Gemini Analyzes Image
  ↓
RentHub Matches Category & Drafts Title, Description, Brand, Model, Condition
  ↓
Owner Reviews & Edits Pre-filled Fields
  ↓
Owner Enters Rental-Specific Info (Daily Rent, Location, Quantity)
  ↓
Publish Listing via Standard Product Creation API
```

### Safety & Anti-Hallucination Guardrails
* **No Invented Facts:** Gemini is strictly instructed never to invent exact model numbers, specifications, prices, locations, or quantity.
* **Category Match:** Gemini is supplied with the exact set of categories currently stored in the RentHub database and must select from that list.
* **Uncertainty Handling:** If brand or model is not clearly visible or known, an empty string `""` is returned rather than a hallucination.
* **Condition Estimates:** Suggested from `New`, `Like New`, `Good`, or `Fair`.
* **Preserves Existing Architecture:** The AI feature acts as a preprocessing helper. The final listing creation continues to use the existing `POST /api/products` endpoint with full validation and file handling.
* **Graceful Fallbacks:** If the Gemini API key is unconfigured or a network error occurs, the owner is presented with a non-blocking message and can continue creating the listing manually.

---

## 🧭 Feature 3: Smart Rental Planner

The **Smart Rental Planner** allows users to describe any equipment need, project, trip, trek, event, or activity in everyday natural language (e.g., *"I want piano and guitar"*, *"I need gear for a photoshoot"*, or *"I'm going to Goa for 5 days with 4 friends"*). RentHub parses intent, curates a gear checklist, searches actual marketplace inventory in PostgreSQL, ranks relevance and local proximity, computes live rental prices, and powers booking.

### Core Architectural Principle: AI Intelligence vs. Marketplace Truth
```text
                  USER PROMPT
                       ↓
               GEMINI FLASH NLU
      (Extracts equipment intent & checklist)
                       ↓
         STRUCTURED REQUIREMENTS
                       ↓
              EXPRESS BACKEND
                       ↓
               PRISMA & POSTGRESQL
            (Searches REAL products)
                       ↓
          AVAILABILITY & PRICING CHECK
           (Active bookings vs quantity)
                       ↓
            RELEVANCE SCORING (0-100)
    (Title + Category + Proximity + Keywords)
                       ↓
          FRONTEND SMART PLANNER
   (Dynamic totals, alternative tabs, booking)
```

> **Strict Anti-Hallucination Guarantee:** Gemini is exclusively responsible for language understanding and checklist reasoning. Gemini **never** invents products, prices, quantities, availability, or ratings. All matching items come strictly from real active products stored in PostgreSQL. If an item is not in stock, RentHub explicitly displays *"Not currently available on RentHub yet"*.

### How Database Search & Ranking Works
1. **Category & Keyword Matching:** Uses token matching with singular/plural normalization across product titles, categories, descriptions, brands, and models.
2. **Relevance Scoring Engine (0-100 pts):**
   - **Title Keyword Match (+40 pts):** Exact or keyword match in product title.
   - **Brand & Model Match (+20 pts):** Recognized brand or model match.
   - **Category Match (+20 pts):** Product belongs to the suggested marketplace category.
   - **Description Match (+10 pts):** Contextual keyword presence in description.
   - **Location Proximity (+10 pts):** Product location matches the user's destination.
3. **Availability Verification:** Checks `prisma.booking` for active `PENDING` or `APPROVED` bookings overlapping requested dates or current inventory quantity. Products with zero remaining units are flagged as unavailable.
4. **Live Cost Estimation:** Calculated purely from database `dailyRent`:
   $$\text{Daily Rate} = \sum \text{product.dailyRent}$$
   $$\text{Estimated Total} = \sum (\text{product.dailyRent} \times \text{durationDays})$$

### Smart Clarification Handling
If user input is brief or ambiguous (e.g. *"I'm going trekking"*), the planner sets `isClarificationNeeded: true` and presents a friendly prompt asking for destination, duration, or group size before building a plan.

### API Endpoint
* **Endpoint:** `POST /api/trip-planner/analyze`
* **Auth:** Optional (`optionalAuth` middleware allows visitors to plan and test; authenticated users can book directly).

---

## 💳 Feature 4: Digital Wallet & Multi-Rail Payment Gateway

RentHub features an integrated **Digital Wallet** to streamline peer-to-peer equipment transactions without repeated external redirects.

### Wallet Capabilities
* **Stored-Value Balance:** Instant balance tracking with double-entry accounting.
* **Instant Top-Up:** Fund wallet balance via UPI or Credit/Debit card with automated reference IDs (`TXN-RH-TOPUP-*`).
* **Instant Checkout:** 1-click rental booking using wallet balance.
* **Withdrawals with Overdraft Protection:** Atomic database transaction verification preventing negative balances.
* **Automated Rental Earnings & Refunds:** Owner earnings are credited upon rental completion; cancellations trigger automatic refunds.

### Multi-Rail Payment Methods
1. **RentHub Wallet Balance:** Instant 1-click confirmation.
2. **UPI (Unified Payments Interface):** Native VPA settlement with transaction reference hashing.
3. **Credit / Debit Cards:** Card tokenization with automated transaction receipts.
4. **Cash on Delivery (COD):** Offline payment settled during equipment handover.

### Wallet API Endpoints
* `GET /api/wallet` — Retrieve current balance and full transaction history.
* `POST /api/wallet/add-funds` — Atomically top up wallet balance.
* `POST /api/wallet/withdraw` — Withdraw funds to bank account or UPI with overdraft checks.

---

## ⭐ Feature 5: Verified Renter Reviews & Ratings

To prevent review bombing, competitor sabotage, and fake ratings, RentHub enforces **Cryptographic Review Verification**:

* **Verified Renter Gate:** Only renters with a confirmed `COMPLETED` or `APPROVED` booking in the database can submit a rating and review for that product.
* **Anti-Self-Review:** Product owners are prohibited from reviewing their own equipment listings.
* **One Review Per Rental:** Unique constraint on `bookingId` ensures exactly one review per rental cycle.
* **Dynamic Breakdown Statistics:** Aggregates average star rating and computes real-time percentage distribution across 1 to 5 stars.

### Review API Endpoints
* `GET /api/reviews/product/:productId` — Retrieve aggregate reviews and star breakdown.
* `GET /api/reviews/can-review/:productId` — Verify if the current user qualifies to review the item.
* `POST /api/reviews` — Submit a verified 1–5 star rating and comment.

---

## 🛠️ Technology Stack

The application is built using a modern, production-grade JavaScript/TypeScript stack:

### Frontend
* **Framework:** React 19 (Initialized via Vite for lightning-fast HMR)
* **Language:** TypeScript
* **Routing:** TanStack Router / React Router
* **Styling:** Tailwind CSS v4 (Class-based strategy for seamless Dark Mode)
* **State Management:** React Context API (AuthContext, ThemeContext)
* **UI Components:** Lucide React (Icons), Sonner / React Hot Toast (Notifications)
* **Reputation System:** Reusable TrustScoreBadge, TrustScoreCard, and TrustScoreModal components

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js (RESTful API Design)
* **Database:** PostgreSQL (Supabase Managed Cloud Instance)
* **ORM:** Prisma (Type-safe database querying and schema migrations)
* **AI & Vision:** `@google/genai` (Official Google Gen AI SDK for Gemini Vision & Flash NLU)
* **Security & Auth:** bcryptjs (Password Hashing, 10 rounds), jsonwebtoken (JWT Auth), Helmet (HTTP Headers), CORS
* **Validation:** Zod (Server-side request payload validation)
* **File Processing:** Multer (Handling multipart/form-data for image uploads)

---

## 🏗️ Architecture & Database Schema

The database is fully relational, modeled in Prisma with six core entities:
1. **User**: Stores authentication details, role, and wallet balance.
2. **Category**: Groups products (e.g., Photography, Audio, Camping, Tools, Electronics).
3. **Product**: Represents a listed item, linked to its `User` (Owner) and `Category`.
4. **Booking**: Manages the rental lifecycle (`PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`), tracking dates, payment method, payment status, and total price.
5. **Review**: Stores verified 1–5 star ratings and comments, linked to `User`, `Product`, and `Booking`.
6. **WalletTransaction**: Double-entry ledger recording all credits, debits, top-ups, withdrawals, rental payments, and earnings with unique reference IDs.

---

## 💻 Running the Project Locally

### 1. Start the Backend Server
```bash
cd server
npm run dev
```
*The Express server will start on `http://localhost:5000`.*

### 2. Start the Frontend Server
```bash
cd client
npm run dev
```
*The React application will start on `http://localhost:5173`.*

### 3. Run Automated Tests
```bash
cd server
node test-trust-gemini.js
node test-e2e-api.js
node test-new-features.js
node test-trip-planner.js
```
*All automated test suites pass with 100% success rate.*

---

## 📄 Comprehensive Project Report

A publication-grade, 19-page Software Engineering Project Report is available in the repository:
* **PDF Report:** [`RentHub_Project_Report.pdf`](./RentHub_Project_Report.pdf)
* **HTML Source:** [`renthub_project_report.html`](./renthub_project_report.html)

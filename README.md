# RentHub - Online Rental Marketplace

RentHub is a modern, full-stack web application designed for a semester-long Software Engineering project. It provides a platform where users can easily rent high-quality equipment, electronics, and more from trusted people in their community, while also listing their own items to earn money.

## 🚀 Key Features

* **Smart Rental Planner / AI Trip Planner:** Natural language travel & event gear assistant powered by Gemini NLU. Users input prompts like *"I'm going to Goa for 5 days with 4 friends"*, and RentHub analyzes intent, generates a curated checklist, searches real marketplace inventory in MariaDB, ranks relevance and proximity, computes live rental prices, and powers seamless booking.
* **RentHub Trust Score:** A transparent, dynamic 0-100 reputation calculation engine and breakdown system for owners and renters based on verified transactions, profile completeness, listing quality, and reliability.
* **AI Image → Listing:** Automated listing assistant powered by Google Gemini Vision. Owners upload a product photo, and Gemini drafts accurate titles, descriptions, categories, brands, models, and condition estimates without inventing facts.
* **Unified User Experience:** Every registered user can seamlessly act as both a renter and an owner without rigid role constraints.
* **Owner Dashboard:** A centralized control panel to list new items for rent and manage incoming rental requests (Approve, Reject, Complete).
* **Dynamic Booking Engine:** Users can select rental dates on a product page, instantly seeing the total calculated price before submitting a rental request.
* **Global Dark Mode:** A premium, fully responsive UI built with Tailwind CSS that includes a system-aware Dark Theme toggle.
* **Secure Authentication:** Robust JWT-based authentication with encrypted passwords to keep user data safe.
* **Image Uploads:** Local image upload processing for product listings.

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

## ✨ Feature 2: AI Image → Listing (Google Gemini)

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

### Environment Configuration

Configure the following variables in `server/.env`:

```env
# Google Gemini Vision & Text Configuration
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_VISION_MODEL="gemini-3.6-flash"
GEMINI_TEXT_MODEL="gemini-2.5-flash"
```

---

## 🧭 Feature 3: Smart Rental Planner / AI Trip Planner

The **Smart Rental Planner** allows users to describe any trip, trek, event, or activity in everyday natural language (e.g., *"I'm going to Goa for 5 days with 4 friends"* or *"I'm going on a trek to Kedarkantha for 4 days"*). RentHub parses the intent, curates a gear checklist, searches actual marketplace inventory in MariaDB, ranks relevance and local proximity, computes live rental prices, and powers booking.

### Core Architectural Principle: AI Intelligence vs. Marketplace Truth
```text
                  USER PROMPT
                       ↓
               GEMINI FLASH NLU
      (Extracts trip parameters & checklist)
                       ↓
         STRUCTURED TRIP REQUIREMENTS
                       ↓
              EXPRESS BACKEND
                       ↓
               PRISMA & MARIADB
            (Searches REAL products)
                       ↓
          AVAILABILITY & PRICING CHECK
           (Active bookings vs quantity)
                       ↓
            RELEVANCE SCORING (0-100)
    (Title + Category + Proximity + Keywords)
                       ↓
          FRONTEND INTERACTIVE PLANNER
   (Dynamic totals, alternative tabs, booking)
```

> **Strict Anti-Hallucination Guarantee:** Gemini is exclusively responsible for language understanding and checklist reasoning. Gemini **never** invents products, prices, quantities, availability, or ratings. All matching items come strictly from real active products stored in MariaDB. If an item is not in stock, RentHub explicitly displays *"Not currently available on RentHub yet"*.

### How Database Search & Ranking Works
1. **Category & Keyword Matching:** Uses token matching with singular/plural normalization (`camera` / `cameras`, `tent` / `tents`) across product titles, categories, descriptions, brands, and models.
2. **Relevance Scoring Engine (0-100 pts):**
   - **Title Keyword Match (+30 pts):** Exact or keyword match in product title.
   - **Category Match (+25 pts):** Product belongs to the suggested marketplace category.
   - **Brand & Model Match (+15 pts):** Recognized brand or model match.
   - **Location Proximity (+15 pts):** Product location matches the user's destination (e.g., *"In Goa"*).
   - **Description Match (+10 pts):** Contextual keyword presence in description.
3. **Availability Verification:** Checks `prisma.booking` for active `PENDING` or `APPROVED` bookings overlapping requested dates or current inventory quantity. Products with zero remaining units are flagged as unavailable.
4. **Live Cost Estimation:** Calculated purely from database `dailyRent`:
   $$\text{Daily Rate} = \sum \text{product.dailyRent}$$
   $$\text{Estimated Total} = \sum (\text{product.dailyRent} \times \text{durationDays})$$

### Smart Clarification Handling
If user input is brief or ambiguous (e.g. *"I'm going trekking"*), the planner sets `isClarificationNeeded: true` and presents a friendly prompt asking for destination, duration, or group size before building a plan.

### API Endpoint
* **Endpoint:** `POST /api/trip-planner/analyze`
* **Auth:** Optional (`optionalAuth` middleware allows visitors to plan and test; authenticated users can book directly).
* **Request:**
  ```json
  {
    "prompt": "I'm going to Goa for 5 days with 4 friends"
  }
  ```
* **Response:**
  ```json
  {
    "trip": {
      "destination": "Goa",
      "durationDays": 5,
      "people": 5,
      "tripType": "Beach & Party Vacation",
      "activities": ["Beach Hangouts", "Water Sports", "Nightlife", "Sightseeing"]
    },
    "isClarificationNeeded": false,
    "clarificationQuestion": null,
    "summary": {
      "totalRequirements": 5,
      "availableCount": 4,
      "unavailableCount": 1
    },
    "requirements": [
      {
        "item": "Action Camera",
        "priority": "recommended",
        "reason": "Capture water sports, beach activities, and group memories in high quality.",
        "products": [
          {
            "id": "c1f7...",
            "title": "GoPro Hero 11 Black 5.3K Action Camera",
            "dailyRent": 450,
            "location": "Goa",
            "relevanceScore": 100,
            "available": true
          }
        ]
      },
      {
        "item": "Scooter / Moped",
        "priority": "essential",
        "reason": "Conveniently explore Goa's scenic roads and beaches.",
        "products": []
      }
    ]
  }
  ```

---

## 🛠️ Technology Stack

The application is built using a modern, production-grade JavaScript stack, heavily emphasizing modularity, clean architecture, and type safety through schema validation.

### Frontend
* **Framework:** React 19 (Initialized via Vite for lightning-fast HMR)
* **Styling:** Tailwind CSS v4 (Class-based strategy for seamless Dark Mode)
* **Routing:** React Router DOM (v6)
* **State Management:** React Context API (AuthContext, ThemeContext)
* **Form Handling & Validation:** React Hook Form integrated with Zod validation schemas
* **HTTP Client:** Axios (Configured with interceptors for auth tokens)
* **UI Components:** Lucide React (Icons), React Hot Toast (Notifications)
* **Reputation System:** Reusable TrustScoreBadge, TrustScoreCard, and TrustScoreModal components

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js (RESTful API Design)
* **Database:** MariaDB (MySQL Provider)
* **ORM:** Prisma (Type-safe database querying and schema migrations)
* **AI & Vision:** `@google/genai` (Official Google Gen AI SDK for Gemini Vision)
* **Security & Auth:** bcryptjs (Password Hashing), jsonwebtoken (JWT Auth), Helmet (HTTP Headers), CORS
* **Validation:** Zod (Server-side request payload validation)
* **File Processing:** Multer (Handling multipart/form-data for image uploads)

---

## 🏗️ Architecture & Implementation Details

### Database Schema (Prisma)
The database is fully relational, consisting of four primary entities:
1. **User**: Stores authentication details and profile information.
2. **Category**: Groups products (e.g., Electronics, Vehicles, Tools).
3. **Product**: Represents a listed item, linked to its `User` (Owner) and `Category`.
4. **Booking**: Manages the rental lifecycle, tracking the `startDate`, `endDate`, `totalPrice`, and `status` (PENDING, APPROVED, REJECTED, COMPLETED). It acts as a join table linking a `User` (Renter) and a `Product`.

### Backend Implementation
- **Controllers & Routes:** Organized logically (e.g., `product.controller.js`, `auth.controller.js`, `user.controller.js`, `aiListing.controller.js`). 
- **Services:**
  - `trustScore.service.js`: Calculates dynamic reputation scores and granular breakdown stats.
  - `gemini.service.js`: Interacts with `@google/genai` with structured JSON output and safety rules.
- **Middlewares:** 
  - `auth.middleware.js`: Verifies JWT tokens and attaches the user payload to requests.
  - `upload.middleware.js`: Configures Multer to save uploaded product images locally to the `uploads/` directory.
  - `error.middleware.js`: Centralized error handler with custom status code preservation.

### Frontend Implementation
- **ThemeContext:** Dynamically reads system preferences and `localStorage` to toggle the `.dark` class on the root HTML element, enabling Tailwind's dark mode variants across the entire app.
- **AuthContext:** Wraps the application to provide global access to the authenticated user's state, automatically attaching the JWT token to Axios requests.
- **Protected Routes:** Ensure that unauthenticated users cannot access sensitive pages like the Dashboard or attempt to book items.
- **Trust Score UI:** Integrated into Product Details page, Booking flow, Owner Dashboard, and Rental Requests.
- **AI Listing UI:** Integrated directly into the Add Product modal with interactive preview, step-by-step loading animations, and disclaimer banners.

---

## 💻 Running the Project Locally

You will need two terminal windows to run both the frontend and backend development servers.

### 1. Start the Backend Server
```bash
cd server
npm run dev
```
*The Express server will start on `http://localhost:5000`. Ensure your MariaDB instance is running.*

### 2. Start the Frontend Server
```bash
cd client
npm run dev
```
*The React application will start on `http://localhost:5173`. Open this URL in your browser to interact with RentHub!*

### 3. Run Automated Tests
```bash
cd server
node test-trust-gemini.js
node test-e2e-api.js
```

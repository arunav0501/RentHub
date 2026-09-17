# Luxe Rentals

You are a world-class Principal Product Designer and Senior Frontend Engineer. 

I want you to redesign the frontend of my online peer-to-peer rental marketplace called **RentHub** to look 100x more premium, sleek, dynamic, and visually stunning (aesthetic benchmarks: Airbnb Luxe, Linear.app, and Stripe).

### Tech Stack & Constraints

- Framework: React (Vite)

- Styling: Tailwind CSS (v4 compatible) with seamless Dark Mode support

- Icons: Lucide React

- Components: Accessible, responsive, mobile-first, zero generic styling.

---

### Core Design System & Aesthetics

1. **Color Palette & Theme**:

   - **Dark Mode (Default & Priority)**: Deep canvas `#0B0F17` (slate-950), card surfaces `#111827` (slate-900), subtle borders `border-slate-800/80` or `border-white/5`.

   - **Light Mode**: Ultra-clean alabaster `#F8FAFC`, white cards with soft multi-layer box shadows `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`.

   - **Primary Accent**: Electric Indigo / Violet gradient (`from-indigo-500 to-blue-600`), hover `from-indigo-600 to-blue-700`.

   - **Trust & Verification**: Emerald/Mint green (`#10B981` / `#34D399`) for verified badges and high trust scores.

   - **Surfaces**: Frosted glassmorphism (`backdrop-blur-xl bg-slate-900/70 border border-white/10`).

2. **Typography & Layout**:

   - Modern font hierarchy (Plus Jakarta Sans or Inter).

   - Micro-tags: `text-[11px] font-bold uppercase tracking-wider`.

   - Generous whitespace, refined rounded corners (`rounded-2xl` and `rounded-3xl`).

   - Micro-interactions: Card hover lifts (`hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`), active scale presses (`active:scale-[0.98]`).

---

### Key Screens to Redesign

#### 1. Landing & Discovery Page (The "Wow" Impression)

- **Hero Section**:

  - High-impact headline: *"Rent Anything From Trusted Neighbors"*.

  - Floating ambient glow or subtle grid mesh backdrop.

  - Floating showcase badge: *"🛡️ 100% Verified Community & Trust Scores"*.

  - **Hero Search Island**: Floating pill container with 3 segmented inputs:

    1. *What are you looking for?* (e.g. Sony A7 IV, Tesla, Camping gear)

    2. *Location* (with auto-detect/pin icon)

    3. *Rental Dates* (quick date picker range)

    4. Gradient **"Search"** button with hover glow.

- **Category Carousel / Pills**:

  - Icon + Label pills (Electronics, Photography, Vehicles, Tools, Party & Events, Sports, Audio & Visual) with active pill indicator.

- **Product Card Grid**:

  - Aspect-ratio 4:3 high-resolution image with subtle gradient overlay.

  - Top-left category chip + Top-right floating glass badge showing Owner Trust Score (`🛡️ 92`).

  - Price pill: `from $45/day` in bold electric typography.

  - Hover effect: Image subtle zoom (`scale-105`), card border lights up with primary gradient glow.

---

#### 2. Product Details Page (High-Conversion Rental Experience)

- **Visual Showcase**: Split-screen or gallery grid (hero image on the left with thumbnail reel, details on the right).

- **Owner Reputation Spotlight**:

  - Owner avatar with green online/verified badge.

  - Prominent **RentHub Trust Score Widget**:

    - Circular or segmented gauge displaying `92 / 100 — Excellent`.

    - Positive indicator chips: `✓ Verified Profile`, `✓ 18 Completed Rentals`, `✓ 0 Cancellations`.

    - Clickable to open the **Trust Score Breakdown Modal**.

- **Sticky Booking Panel (Right Column)**:

  - Glass card with date range picker.

  - Dynamic live cost breakdown:

    - *Daily rate × N days*

    - *Service & Protection fee*

    - *Refundable security deposit*

    - *Total Estimated Price*

  - Big glowing CTA: **"Request to Rent"** (with disabled state if viewing own product).

---

#### 3. Owner Dashboard (Bento-Grid Architecture)

- Replace basic flat tables with a modern **Bento Grid**:

  - **Card 1: Owner Trust Score Hero Card**:

    - Animated progress meter / gauge for the 0-100 score.

    - Tier badge (`Excellent`, `Very Good`, `Good`, `Fair`, `Low`).

    - Quick breakdown stats (Profile, Listing Quality, Fulfillment, Reliability).

    - "View Full Breakdown →" action button.

  - **Card 2: Quick Metrics**:

    - Total Listed Products, Active Rentals, Total Earnings estimate.

  - **Card 3: Add Product Quick Action**:

    - Vibrant button with sparkle icon: `✨ Add Product with AI`.

- **My Products View**:

  - Toggle between Grid Cards view and Dense Table view.

  - Status chips (`Available`, `Rented Out`).

- **Rental Requests View**:

  - Card-based request tickets showing Item thumbnail, Renter profile with their **Renter Trust Score Badge**, requested dates, total payout, and quick-action buttons (**Approve** in Emerald, **Reject** in Rose).

---

#### 4. Add Product Modal & "AI Image → Listing" Assistant (Magical UX)

- **Top AI Assistant Zone**:

  - Gradient banner with particle/sparkle icon: `✨ AI Image → Listing (Powered by Google Gemini)`.

  - Drag-and-drop file upload zone with immediate image preview thumbnail and "Change Photo" link.

  - Glowing action button: `✨ Generate with AI`.

- **AI Processing State**:

  - Shimmer scanning bar animation over the uploaded image (laser/scanner effect).

  - Step-by-step progressive status:

    `🔍 Identifying product...` → `✍️ Generating title...` → `📝 Writing description...` → `🏷️ Matching category...`

- **Auto-Populated Form**:

  - Title, Category, Description, Brand, Model, Condition automatically filled with subtle blue border glow.

  - Disclaimer chip: `✨ AI suggestions — please review and set your price & location.`

  - Manual inputs: Price/Day, Location, Quantity with clear focus rings.

---

#### 5. RentHub Trust Score Modal (Transparent Breakdown)

- Modern dialog with frosted backdrop blur:

  - Header: `🛡️ RentHub Trust Score Breakdown`.

  - Big score number `92 / 100` with animated circular ring or thick gradient bar.

  - 4 Progress Bars with values:

    - *Profile Completeness: 20 / 20*

    - *Listing Quality: 22 / 25*

    - *Rental History & Fulfillment: 32 / 35*

    - *Reliability & Cancellations: 18 / 20*

  - Grid of verified checkmarks (`✓ Verified Email`, `✓ Phone Linked`, `✓ 0 Owner Cancellations`).

  - Explanation box: *"Scores are computed securely on the server from verified transaction history. Cannot be artificially gamed."*

---

### Deliverable

Generate the upgraded React components with Tailwind CSS classes, complete with responsive layouts, dark/light theme classes, interactive states, and clean modular code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/72a87ad6-d9c0-468d-bfa1-b2a416bc5069).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

# RentHub frontend redesign

## Goal
Transform the template into a polished, responsive peer-to-peer rental marketplace with a dark-first visual system and complete interactive showcase flows.

## Build scope
- Replace the placeholder home page with RentHub discovery: premium navigation, high-impact search, category filters, and responsive listing cards.
- Add a product detail experience with image gallery, owner reputation, trust score, and a live booking cost panel.
- Add an owner dashboard with bento metrics, trust score progress, grid/table product views, and rental request actions.
- Add the product creation dialog with photo upload preview, simulated AI generation progress, and an editable auto-populated listing form.
- Add the trust score breakdown dialog and connect it from listing, product, and dashboard surfaces.
- Add responsive navigation between Discovery, Product, and Dashboard views, plus polished loading, empty, disabled, and interaction states.

## Visual system
- Implement the requested deep slate dark theme, alabaster light theme, indigo-to-blue actions, emerald trust signals, frosted surfaces, and restrained ambient effects.
- Use Plus Jakarta Sans, semantic design tokens, consistent 16–24px radii, accessible contrast, keyboard focus states, and reduced-motion support.
- Use local/generated listing imagery so the marketplace feels complete rather than templated.

## Technical details
- Keep the existing TanStack Start routing foundation and Tailwind CSS v4 setup.
- Build reusable React components for navigation, search, listing cards, trust indicators, dialogs, booking calculations, dashboard cards, and request tickets.
- Use Lucide icons and existing design-system controls where available; add focused shared controls only where needed.
- Keep data as realistic frontend demo data; AI generation will be an interactive simulated showcase because no backend integration was requested.
- Add unique metadata for every content route and validate desktop/mobile rendering and key interactions.

## Routes
- `/` — discovery marketplace
- `/product/$productId` — product details
- `/dashboard` — owner dashboard

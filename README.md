# ShareLoop

ShareLoop is a **local marketplace web app** for the Kokkola region concept: customers browse shops by category, reserve products with a pickup time, and vendors manage inventory and approve or reject orders.

## Features

- **Authentication** — Email sign-up / sign-in via Supabase Auth; each user has a **profile** with role **`vendor`** or **`customer`**.
- **Vendor dashboard** — Create and update a business, add products (price, quantity, optional image via Supabase Storage), handle reservations.
- **Customer experience** — Customer dashboard (upcoming and past pickups), **Explore** marketplace with categories, shop pages, distance sorting when addresses are set, optional map, product sort by price.
- **Data security** — PostgreSQL **Row Level Security (RLS)** so users only read and write data they are allowed to.

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18, TypeScript, Vite 5 |
| UI | Tailwind CSS, Radix/shadcn-style components |
| Routing | React Router |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, REST API) |
| Maps | Leaflet / react-leaflet |
| Tests / quality | ESLint, Vitest, Playwright (as configured) |

## Prerequisites

- **Node.js** (LTS recommended; the repo uses `npm`)
- A **Supabase project** with the schema applied (see [Database setup](#database-setup))

## Quick start

```bash
git clone https://github.com/supaizjy0321/ShareLoop-New.git
cd ShareLoop-New
npm install
npm run dev
```

The dev server runs at **http://localhost:8080** (see `vite.config.ts`).

Other scripts:

```bash
npm run build      # Production bundle → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint
npm test           # Vitest
```

## Supabase configuration

The app expects a Supabase client in [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts). That file may contain your project **URL** and **anon (publishable) key** (as generated for this template).

**For your own fork or production:** prefer **environment variables** (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and wire them in the client **instead of committing keys** — rotate any key that was ever committed publicly.

### Database setup

Apply migrations in order from [`supabase/migrations/`](supabase/migrations/) to your Supabase project (CLI `supabase db push`, CI, or paste SQL in the SQL Editor). They define core tables (`profiles`, `businesses`, `products`, `reservations`), RLS policies, triggers, and follow-up changes (addresses/geo, product quantity, images, reservation quantity, storage policies). Pickup-hour columns were added and then **removed** by later migrations—run **all** migrations so the final schema matches the app.

Regenerate or update [`src/integrations/supabase/types.ts`](src/integrations/supabase/types.ts) if you change the schema so TypeScript stays aligned.

### Storage (product images)

If you use vendor product photos, ensure a **`product-images`** bucket exists with policies consistent with [`20260504192000_add_product_quantity_and_image_storage.sql`](supabase/migrations/20260504192000_add_product_quantity_and_image_storage.sql) and the RLS fix migration [`20260504214000_fix_product_images_storage_rls_name_shadowing.sql`](supabase/migrations/20260504214000_fix_product_images_storage_rls_name_shadowing.sql).

### Geocoding

Address search / coordinates use the app’s geocoding helper (see [`src/lib/geocode.ts`](src/lib/geocode.ts)); ensure any required API usage matches your deployment rules and keys.

## Routing

| Path | Who |
|------|-----|
| `/` | Login when logged out; redirects to role home when logged in |
| `/explore` | **Customers** only — marketplace |
| `/vendor-dashboard` | **Vendors** only |
| `/customer-dashboard` | **Customers** only |

## Deployment (e.g. Vercel)

1. Connect the repo and set the **build** command to `npm run build` and **output** to `dist`.
2. Add a SPA fallback so client-side routes work on refresh — e.g. [`vercel.json`](vercel.json) rewriting paths to `index.html`.
3. Ensure the **same** Supabase project and schema your client points to.

## Project layout (high level)

```
src/
  App.tsx                 # Routes and role guards
  contexts/               # Auth + shared data (Supabase)
  pages/                  # Auth, Explore, Vendor/Customer dashboards
  components/             # UI + AddressAutocomplete, LocationMap, ProductCard, …
  integrations/supabase/  # Client + generated Database types
  lib/                    # utils, geo, geocode
supabase/
  migrations/             # SQL migrations (source of truth for schema)
```

## Documentation

- Capstone / report notes may live under [`docs/`](docs/) (if present).

## License

Private / as specified by your course or organization.

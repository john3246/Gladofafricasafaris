# Glad Of Africa Safari & Tours: Technical Blueprint

## Stack
Node.js 20+ / Express 4 · EJS server-rendered HTML · Tailwind CSS 3 (mobile-first) · PostgreSQL (content + inquiries) · Redis (rendered-page cache).
If Postgres/Redis are unreachable (or `USE_DB=false`) the app serves content from `src/data` and skips caching, so it always boots.

## Rules
1. **Modularity**: one feature = one folder; one responsibility = one file.
2. **No file over 400 lines.** Enforced by `npm run check:size`.
3. Layering inside a module: `routes -> controller -> service -> repository`. Routes only wire, controllers only talk HTTP + SEO, services hold logic, repositories hold data access.
4. SEO is built in, not bolted on (see `SEO-STRATEGY.md`).

## Folder structure
```
├── database/schema/            SQL migrations (001_init.sql ...)
├── docs/                       This blueprint, SEO strategy
├── public/                     Static assets served with long cache headers
│   ├── css/app.css             Tailwind build output (git-ignored)
│   ├── js/                     nav.js, img-fallback.js (tiny, CSP-safe)
│   ├── images/                 logo, og-default.jpg, hero.webp, tours/, destinations/, blog/
│   └── icons/
├── scripts/                    migrate.js, seed.js, check-file-size.js
└── src/
    ├── server.js               Boot: DB -> Redis -> listen
    ├── app.js                  Express factory + router registry
    ├── config/                 env.js, site.js (brand + NAP), index.js
    ├── db/                     pool.js, contentRepository.js (jsonb + seed fallback)
    ├── cache/                  redis.js, pageCache.js
    ├── middleware/             security, canonicalUrl, cacheHeaders, locals, rateLimit, errorHandler
    ├── utils/                  logger, asyncHandler, format
    ├── seo/                    meta.js + schema/{organization,breadcrumb,faq,trip,article}.js
    ├── data/                   Seed content: tours/ (by tier), destinations, posts/, faqs, nav
    ├── styles/input.css        Tailwind entry + component classes
    ├── views/                  layouts/main.ejs, partials/ (header, footer, cards, faq, cta...), pages/error.ejs
    └── modules/
        ├── home/               routes, controller, service, views/sections/*
        ├── tours/              routes, controller, service, repository, categories, views
        ├── destinations/       routes, controller, service, repository, views
        ├── blog/               routes, controller, service, repository, views
        ├── faq/                routes, controller, service, repository, views
        ├── pages/              about, terms, privacy, contact
        ├── inquiry/            validator (zod), repository, controller, routes, views (quote form)
        └── seo/                sitemap.xml + robots.txt
```

## URL map
| URL | Purpose / target search |
|---|---|
| `/` | Brand + "northern Tanzania safaris" |
| `/tanzania-safaris` | "Tanzania safari packages" |
| `/tanzania-safaris/{luxury,midrange,budget,migration,trekking,day-trips}` | Tier and intent landing pages |
| `/tours/:slug` | Individual package (TouristTrip schema) |
| `/destinations`, `/destinations/:slug` | "Serengeti safari", "Ngorongoro Crater safari"... |
| `/blog`, `/blog/:slug` | Informational: cost, best time, migration calendar |
| `/faqs` | FAQPage schema |
| `/get-a-quote`, `/contact-us` | Conversion (POST `/inquiry`) |
| `/sitemap.xml`, `/robots.txt` | Crawl control |

## Data model
`tours, destinations, posts, faqs` = `id, slug (unique), sort, published, data jsonb` (+ `tier, category` on tours). `inquiries` stores quote requests.
Seed with `npm run migrate && npm run seed`.

## Brand tokens (from gladofafricasafari.com)
Forest `#123524` / `#1E2A1F`, leaf `#3e7b27`, moss `#85a947`, gold `#D9A441`, light gold `#F0C878`. Fonts: Cormorant Garamond (headings), DM Sans (body). Defined once in `tailwind.config.js`.

## Layout reference (gmsafaris.com)
Package-first structure: hero + intro, categorised package grids with price/duration/summary, destinations, travel guides, FAQ, link-rich footer. Mirrored here as home sections and listing pages.

## Run
```
docker compose up -d        # Postgres + Redis
npm install
npm run migrate && npm run seed
npm run build               # Tailwind
npm run dev
```

## Content import (live site -> this project)
`npm run import:live` pulls the real tours (41, with prices, itineraries, galleries), 20 destinations, 3 blog posts and 30 FAQs from gladofafricasafari.com into `src/data/**/*.json` and saves resized WebP images to `public/images/`. Parsers live in `scripts/import/` (one file per content type). Re-run it whenever the WordPress content changes, then `npm run seed` if using Postgres.

## CMS (/admin)
Built into the same app: `src/modules/admin/` (auth, dashboard, generic CRUD for tours/destinations/blog/FAQs/reviews/pages, media library, inquiries + customers, users & roles, SEO audit, menus, site settings, audit log + version history).
- **Storage:** `src/store/` is one document store with two drivers: JSON files in `var/cms/` locally, Postgres (`cms_records`, `cms_media`) when `DATABASE_URL` is connected. Collections seed from `src/data` the first time they are used.
- **Adding a content type:** add a collection in `src/store/collections.js` and a short definition in `src/modules/admin/resources/defs/` (fields drive the list, form, validation and history screens).
- **Security:** scrypt password hashes, signed HttpOnly session cookie, per-session CSRF token, login rate limit, roles (`admin`, `editor`).
- **Public site:** reads the same store, so edits appear immediately (Redis page cache is flushed on every change).
- **Test:** with the server running, `npm run test:cms` exercises login, every screen and create/edit/publish/delete flows end to end.

### CMS feature list (v2)
Analytics (first-party, cookie-free) · Bookings with revenue tracking · Inquiry inbox with e-mail replies, quote value and assignee · Newsletter subscribers · Redirects manager (old WordPress URLs pre-loaded) with 404 detector · Bulk actions, sortable columns and CSV export on every list · Command palette (Ctrl+K), Ctrl+S save, unsaved-changes guard · Maintenance mode, announcement bar, Google Analytics ID, default share image, "discourage indexing" · Backup & Restore (JSON) · Profile / password change · Site-health checklist on the dashboard.

### Local database
`npm run db:local` starts a project-local PostgreSQL 18 (UTF-8, port 5433, data in `var/pgdata`) with no Docker or system install; leave that terminal running, then `npm run migrate` once. Redis: any server on `localhost:6379` (e.g. Memurai on Windows). Set `USE_DB=true` and `DATABASE_URL=postgresql://glad:glad@localhost:5433/glad_safari` in `.env`.

### Nothing is locked (v3)
Everything public is CMS-driven: **Tour Categories** (rules by tag, level or title word; they build the category pages, the Tours menu and the sitemap), **Regions** (group destinations in the menu, on /destinations and in home sections), **Custom Fields** (extra labelled details on tours, destinations and posts, optionally shown on the site), and **Pages built from sections**. The home page and every new page are ordered lists of sections (hero, text, photo+text, tours, destinations, regions, photo tiles, features, gallery, reviews, blog, FAQ, CTA, custom HTML). To add a new section type: one entry in `src/modules/blocks/blocks.types.js` + one template in `src/views/blocks/`. Tour levels and tags are free text with suggestions. Tests: `scripts/cms-smoke-test.js` and `scripts/cms-builder-test.js` (run against a throwaway server).

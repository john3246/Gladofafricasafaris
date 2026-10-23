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

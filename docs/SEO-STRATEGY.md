# SEO Strategy

## Positioning
Own **northern circuit Tanzania** (Serengeti, Ngorongoro, Tarangire, Manyara, Kilimanjaro/Meru) across **all three price tiers**, where competitors usually pick one.

## What travellers search -> where we answer
| Search intent | Page |
|---|---|
| tanzania safari cost / price | `/blog/tanzania-safari-cost` |
| best time to visit tanzania safari | `/blog/best-time-to-visit-tanzania-safari` |
| great migration calendar / where are the herds | `/blog/great-migration-calendar-tanzania` |
| ndutu calving season safari | `/blog/ndutu-calving-season-safari`, `/tours/7-day-ndutu-calving-season-safari` |
| luxury / budget / midrange safari tanzania | `/tanzania-safaris/{luxury,budget,midrange}` |
| mara river crossing safari | `/tanzania-safaris/migration`, 8-day tour |
| serengeti / ngorongoro / tarangire safari | `/destinations/:slug` |
| kilimanjaro machame route, mount meru trek | `/tanzania-safaris/trekking` |
| safari tanzania from arusha, day trip | `/tanzania-safaris/day-trips` |
| safari operator arusha (local) | Home + About + TravelAgency schema with address/phone |

## Implemented technical SEO
- Unique `<title>` and meta description per page; canonical URL; robots meta (noindex on thanks/errors).
- Open Graph + Twitter cards.
- JSON-LD: TravelAgency/LocalBusiness, BreadcrumbList, FAQPage, TouristTrip (+Offer only for confirmed prices), BlogPosting.
- `sitemap.xml` generated from content; `robots.txt` blocks everything outside production.
- 301 for trailing-slash/uppercase URLs; clean keyword-first slugs; real 404 status.
- Server-rendered semantic HTML (one H1, ordered headings, landmarks, breadcrumbs, skip link).
- Performance: gzip, immutable asset caching, Redis page cache, lazy images with dimensions, `fetchpriority` on hero, font preconnect + `display=swap`, small JS.
- Security headers (Helmet/CSP), rate-limited form with honeypot.

## Before launch (needs the business)
1. **Replace placeholders**: real photos in `public/images/` (WebP, <200 KB), logo, OG image.
2. **Confirm prices** flagged `priceConfirmed:false` in `src/data/tours`.
3. Add genuine reviews (Google/TripAdvisor) to schema only when real; never fabricate.
4. Replace Terms/Privacy placeholders with reviewed legal text.
5. Set `SITE_URL` + `NODE_ENV=production`, submit sitemap in Google Search Console, claim Google Business Profile for the Arusha address.
6. Keep the old WordPress URLs alive with 301 redirects to the new ones (add a redirect map in `src/middleware/`) to preserve existing rankings.
7. Publish 2-4 new guides per month (visa/insurance, Kilimanjaro routes compared, family safari, honeymoon).

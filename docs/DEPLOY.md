# Going live on Render

1. Push the repo to GitHub, then Render > New > Blueprint > pick the repo. It creates the web service, Postgres and Redis (Key Value).
2. Fill the three prompts: **SITE_URL** (https, no trailing slash), **ADMIN_EMAIL**, **ADMIN_PASSWORD** (12+ characters). Optional: **SMTP_URL** for quote-request and reply e-mails.
3. In production the server refuses to start with a missing/short `SESSION_SECRET`, an `http://` SITE_URL, no DATABASE_URL or a weak admin password; the Render log says which.
4. Switch the three `plan: free` entries to `starter` before launch (free web sleeps, free Postgres expires after 30 days).
5. Custom domain: Render > Settings > Custom Domains, add the DNS records, then set SITE_URL to the final address and redeploy.
6. After the first deploy: sign in at /admin, change the password in My profile, create real editor accounts, review Site Settings, Terms and Privacy text, and prices marked as estimates.
7. Submit /sitemap.xml in Google Search Console and add the Google Analytics ID in Site Settings. Remove "Ask search engines not to index" if you switched it on while building.
8. Back up: CMS > Backup & Restore (download weekly), plus Render's Postgres backups on paid plans.

Security checks: `node scripts/security-check.js` (starts its own throwaway servers).

# Moving gladofafricasafari.com from Namecheap cPanel hosting to the VPS

> **Final plan (decided 1 Nov 2026):** the website, CMS, database and HTTPS move completely to the VPS (2.24.128.220). The Namecheap cPanel hosting stays **only for e-mail**. The domain stays registered at Namecheap.

## The DNS records today (looked up 1 Nov 2026) and what happens to each
| Record | Value now | Action |
|---|---|---|
| NS | dns1/dns2.namecheaphosting.com | **keep** (DNS stays in the cPanel Zone Editor) |
| A  `@` (gladofafricasafari.com) | 184.94.213.124 | **CHANGE to 2.24.128.220** (the only change) |
| CNAME `www` | gladofafricasafari.com | keep: it follows `@` automatically |
| MX | 0 mail.gladofafricasafari.com | **keep** |
| A `mail`, `cpanel`, `whm`, `webdisk`, `ftp`, `autodiscover`, `autoconfig`, `cpcalendars`, `cpcontacts` | 184.94.213.124 | **keep** (mail, webmail and mail-client setup) |
| TXT SPF | v=spf1 +a +mx +ip4:69.57.162.239 +ip4:184.94.213.122 include:spf.web-hosting.com ~all | **keep** (still valid; `+a` now also allows the VPS to send mail) |
| TXT DKIM `default._domainkey` | (long key) | **keep, never edit** |
| TXT `_dmarc` | v=DMARC1; p=none; | keep |
| TXT google-site-verification | 0DrP1AYY... | keep (Search Console) |
| AAAA | none | nothing to delete |

One change, one record. Everything e-mail related is untouched.

### Extra step in cPanel so e-mail keeps working
cPanel > **Email Routing** > choose the domain > set **Local Mail Exchanger** explicitly (not "Automatically detect"). After the web address moves, auto-detection could otherwise decide the mail server is remote and stop delivering to the mailboxes.

### cPanel clean-up after the switch (give it 2 weeks of safe running first)
- Take a Full Backup, then remove or disable the WordPress site and its database in cPanel (an unused, unpatched WordPress is a security risk). Keep the backup.
- AutoSSL may report that it cannot validate the bare domain any more. That is expected; the `mail`, `cpanel` and `webmail` names still validate. If you want it quiet, exclude the domain in cPanel > SSL/TLS Status.
- Keep the hosting plan renewed for as long as you use its mailboxes. If it ever lapses, e-mail and DNS go with it.

### Optional "Plan B": move DNS to Namecheap itself
Only worth it if you want to manage DNS at Namecheap instead of cPanel. Namecheap > Domain List > Manage > Nameservers > "Namecheap BasicDNS", then Advanced DNS: recreate **every** record in the table above (A `@` = 2.24.128.220; everything else exactly as listed, including the full DKIM text copied from cPanel). A missed DKIM or MX record breaks e-mail, so the default plan above (leave DNS at cPanel) is safer.

**What was found (read-only lookups, 1 Nov 2026)**
- Nameservers: `dns1/dns2.namecheaphosting.com`, so DNS is edited in the **cPanel Zone Editor** of the old hosting, not in Namecheap's "Advanced DNS" for the domain.
- Email: MX is `mail.gladofafricasafari.com`, which points to the same cPanel server (184.94.213.124). **Email lives on cPanel.**
- Website A records (`@`, `www`) point to 184.94.213.124. The new VPS is **2.24.128.220**.

**Golden rule: change only the `@` and `www` records. Never touch MX, `mail`, `cpanel`, `webmail`, SPF/DKIM/DMARC TXT records, and do not cancel the cPanel hosting while email still lives there.**

## 1. Before the switch (a day ahead)
1. cPanel > **Backup** > download a *Full Backup* (or at least the home directory and MySQL databases) and keep it. It is your rollback and your archive of the old WordPress content and form entries.
2. If the old site collected form submissions or has any pages/photos not in the new CMS, export them now.
3. cPanel > **Zone Editor** > Manage: set the TTL of the `@` and `www` A records to **300** and wait for the old TTL (about 4 hours) to pass. A short TTL makes the switch and any rollback take minutes instead of hours.
4. Review the site locally (http://localhost:3000) and fix content: Terms and Privacy wording, prices, phone and address in CMS > Site Settings.
5. The CMS already contains the old WordPress addresses as 301 redirects (CMS > Redirects & 404s), so Google rankings carry over.

## 2. Test the VPS copy before anyone else sees it (optional, 10 minutes)
On your Windows PC open Notepad **as administrator**, open `C:\Windows\System32\drivers\etc\hosts` and add:
```
2.24.128.220 gladofafricasafari.com www.gladofafricasafari.com
```
Browse to http://gladofafricasafari.com : you now see the VPS version while everyone else still sees the old site. (Sign-in only works after HTTPS, step 4.) **Delete that line afterwards.**

## 3. Switch the website (cPanel > Zone Editor > Manage)
1. Edit the **A** record for `gladofafricasafari.com` (the `@` record) to **2.24.128.220**. `www` is already a CNAME to it, so it follows.
2. There are no AAAA records, so nothing else to delete.
3. Leave everything else as is. Check from your PC: `nslookup gladofafricasafari.com 8.8.8.8` should show 2.24.128.220 within minutes.

## 4. Turn on HTTPS on the VPS (right after DNS shows the new address)
```bash
ssh hostinger-vps /root/glad-enable-tls.sh
```
It refuses to run until DNS points at the VPS, gets a free Let's Encrypt certificate (renews automatically), switches nginx to HTTPS with www redirecting to the bare domain, and rolls back by itself if anything fails.

## 5. First login and hardening
1. Read the one-time password: `ssh hostinger-vps cat /root/gladofafricasafari-first-login.txt`
2. Sign in at https://gladofafricasafari.com/admin, change the password in **My profile**, add real editor accounts, then delete the file on the server.
3. CMS > Site Settings: turn off "Ask search engines not to index" if it is on, add the Google Analytics ID.
4. Google Search Console: add the domain, submit `https://gladofafricasafari.com/sitemap.xml`.

## 6. Email stays on cPanel
- Mailboxes keep working because MX and `mail` still point to cPanel. Do not delete the hosting.
- To let the website send quote alerts and replies, edit `/var/www/gladofafricasafari/.env` on the VPS and add (replace PASSWORD, keep `%40`):
  `SMTP_URL=smtps://info%40gladofafricasafari.com:PASSWORD@mail.gladofafricasafari.com:465`
  then `systemctl restart gladofafricasafari`. Enter the password yourself on the server; do not paste it into chats.

## 7. After the switch
- Watch for a week: CMS > Analytics, Redirects & 404s (broken links list), and `journalctl -u gladofafricasafari -f` on the VPS.
- Keep the cPanel hosting at least 2-4 weeks as a safety net, then decide. Move the email elsewhere first if you ever want to cancel it.
- Domain renewal stays at Namecheap; the VPS does not change that.

## Rollback (takes minutes with the 300-second TTL)
Set the `@` and `www` A records back to 184.94.213.124 in the cPanel Zone Editor. The old site was never touched.

## What not to do
Do not change the nameservers to anything else, do not edit MX/TXT records, do not reboot the VPS in business hours (it hosts two other sites), and do not run the old WordPress and the new site on the same hostname at once.

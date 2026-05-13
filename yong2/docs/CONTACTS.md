# CONTACTS.md — Operational Contact Addresses

> Single source of truth for every email address rendered in user-facing copy on yong-choi.com. **Before editing any privacy/legal page, update this file first.**

## Production domain

- **Canonical domain:** `yong-choi.com` (hyphenated)
- **Hosting:** AWS Amplify (app id `d2tuygdje4mmy3`, branch `feature/yong2-amplify`)
- **DNS:** GoDaddy (`ns65.domaincontrol.com`)
- **Mail (MX):** **NOT YET PROVISIONED.** See "Open items" below.

## ⚠ Do not use `yongchoi[.]com` (no hyphen)

`yongchoi[.]com` is a **separate, third-party-owned domain**. DNS evidence:

- MX: Microsoft 365 (`yongchoi-com.mail.protection.outlook.com`)
- TXT: SPF for Outlook, OpenAI domain verification, Apple domain verification
- A: GitHub Pages

This is almost certainly a different person or organization named "Yong Choi" — **not Joey or the brokerage.** Any mail sent to `*@yongchoi[.]com` lands in someone else's Outlook inbox.

If a prior version of the site directed CCPA/GDPR requests to `privacy@yongchoi[.]com (typo)`, those requests were delivered to a stranger and almost certainly never processed. **CCPA §1798.135 violation risk for any unfulfilled request in the past 12 months.** Consider auditing form submissions / contact-form logs to see if any deletion requests were received but never actioned, and reach out to those requesters directly.

## Contact roles

| Purpose | Address | Mailbox status | Notes |
|---|---|---|---|
| **Data-rights / privacy requests** (CCPA, GDPR access/deletion/opt-out) | `joey@echelonpoint.dev` | ✅ verified working (Google Workspace) | Used in `/privacy/policy`, `/privacy/preferences` mailto links, and the `PreferencesPanel` component. Monitor this inbox for any "delete my data" or "what info do you have" request — 30-day response window under CCPA, 30 days under GDPR. |
| **Outgoing transactional mail FROM** (contact form notifications via Resend) | `no-reply@yong-choi.com` (default) | ❌ not yet sendable | `lib/contact.ts` falls back to this. Resend will refuse to send from this address until the `yong-choi.com` domain is verified in the Resend dashboard (SPF + DKIM + return-path). Override via the `CONTACT_FROM_EMAIL` env var to use any already-verified domain (e.g. `no-reply@echelonpoint.dev`) until then. |
| **Contact form TO** | env-driven (`CONTACT_TO_EMAIL`) | varies | Set in Amplify branch env. Example in `.env.example` shows `yong@example.com` — replace with the real inbox before going live. |

## Open items (block before public launch)

These items must be completed before the site is announced or appears in search results, **otherwise the privacy page mailto link is functional only for the joey@echelonpoint.dev fallback** — which works today, but is not the long-term canonical address.

- [ ] Provision MX records on `yong-choi.com` (Google Workspace). Once done, create `privacy@yong-choi.com` as the canonical data-rights mailbox and update this file + privacy pages to use it.
- [ ] Verify the `yong-choi.com` domain in Resend (or whichever transactional mail provider is wired up) so `CONTACT_FROM_EMAIL=no-reply@yong-choi.com` actually sends.
- [ ] Once `privacy@yong-choi.com` is live: change all four mailto references back from `joey@echelonpoint.dev` to `privacy@yong-choi.com` and re-run `rg -n 'echelonpoint\.dev'` to confirm no stragglers.
- [ ] Search and consider acquiring or formally disclaiming `yongchoi[.]com` to prevent ongoing confusion (the typo domain is registered to someone else and will keep catching mistyped requests).

## Change log

| Date | Change | By |
|---|---|---|
| 2026-05-13 | Initial creation. Privacy pages migrated from `privacy@yongchoi[.]com (typo)` (third-party-owned) to `joey@echelonpoint.dev` (verified Google Workspace). All body-copy domain references changed from `yongchoi[.]com` to `yong-choi.com`. | Joey |

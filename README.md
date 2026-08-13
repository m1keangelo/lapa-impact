# LAPA Mission Colombia — Impact Tracker

A real-time donor impact tracking web app for LAPA Mission Colombia's earthquake-relief work. Donors enter a personal code and see — live — where their money went: donations in, transfers to the field, photos of relief work, families helped. One admin logs everything from a protected panel.

**Stack:** Vite 7 · React 19 · TypeScript · Tailwind CSS v3.4 · shadcn/ui · Firebase Firestore (live `onSnapshot`) · Firebase Auth (admin only) · Firebase Cloud Functions (Stripe webhook + code lookup) · Stripe Payment Links · Cloudinary (photos) · Vercel (hosting)

## Features

- **Live Stripe donations** — Stripe Payment Links checkout → webhook (Firebase Cloud Function) writes the gift → the donor instantly gets a 12-character donor code on `/donate/success`. The live feed updates the same second.
- **Pooled-fund model** — every gift joins ONE fund; the team deploys it daily against what the field actually needs. Nothing earmarked, everything on the public ledger.
- **Donor code login** (`/login`) — 12-character Base58 codes, no accounts or passwords. The code *is* the donor's Firestore document ID.
- **My Impact dashboard** (`/impact`) — personal totals, donation history, what your giving funded, matched photos. Live.
- **Public live feed** (`/feed`) — real-time stream of donations, transfers, updates, and photos with filters, search, and pagination.
- **Photo gallery** (`/gallery`) — masonry wall with gift attribution and a full-screen lightbox.
- **Admin panel** (`/admin`) — Firebase Auth email/password gate; log gifts (with donor-code lookup + new-donor code generation), log transfers, post impact updates, upload photos (client-side compression → Cloudinary unsigned preset).
- **Hero totals** — money in, money out, families helped, animated count-ups driven by a `stats/global` aggregate doc.
- **Dark-mode-first**, mobile-first, warm "field ledger" design. Light theme toggle included.

## Quick start

```bash
npm install
cp .env.example .env   # fill in Firebase + Cloudinary values
npm run dev
```

The app **builds and renders without credentials** — it falls back to bundled demo data (demo donor code: `X7kQ2mPv9Rt4`). Set the env vars to go live.

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step: Firebase console setup, security rules, Cloudinary unsigned preset, GitHub + Vercel CLI (`vercel --prod`), and environment variables.

TL;DR:

```bash
npm i -g vercel
vercel login
vercel --prod
# then set the 8 VITE_* env vars in the Vercel dashboard and redeploy
```

## Data model (Firestore, flat)

| Collection | Doc ID | Key fields |
|---|---|---|
| `donors` | the donor code (nanoid Base58) | name, email?, totalGiven (cents), createdAt |
| `donations` | auto | donorCode, amount (cents), timestamp, note? |
| `transfers` | auto | amount (cents), timestamp, recipient, purpose, proofUrl? |
| `updates` | auto | title, body, metrics (map), timestamp, mediaIds? |
| `media` | auto | cloudinaryUrl, thumbnailUrl, caption, timestamp, donationId?, updateId? |
| `stats` | `global` | totalIn, totalOut, familiesHelped (admin batches + Stripe webhook increments) |
| `stripeSessions` | Stripe checkout session id | code, status (written by the webhook only; fully closed in rules — read via the `lookupDonation` function) |

Security rules live in `firestore.rules`: donors are get-only by code (no listing), `stripeSessions` is fully client-closed, everything else is public-read / admin-write.

## Cost

Designed to run at **$0 in year 1** at 1,000+ donor scale: Firestore free quota (50K reads/day), bounded queries everywhere (`.limit()`), Cloudinary free tier with `f_auto,q_auto` transforms, Vercel/Netlify free static hosting. Firebase Blaze plan required (card on file) but usage stays within the always-free quota.

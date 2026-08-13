# Deployment — LAPA Mission Colombia Impact Tracker

Vite + React SPA backed by Firebase (Firestore + Auth) and Cloudinary,
deployed to Vercel. Total expected cost: **$0** (see step 6).

---

## 1. Firebase console setup

1. Go to <https://console.firebase.google.com> → **Add project** → name it
   (e.g. `lapa-mission`). Google Analytics is optional — you can disable it.
2. **Enable Firestore:** Build → Firestore Database → **Create database** →
   start in **production mode** → pick the region closest to your users.
3. **Enable Email/Password auth:** Build → Authentication → **Get started** →
   Sign-in method → enable **Email/Password** (the first provider; leave
   "Email link" off).
4. **Create the admin user:** Authentication → Users → **Add user** → enter
   the operator's email + a strong password. This is the only account the
   `/admin` panel accepts.
5. **Paste the security rules:** Firestore Database → **Rules** → replace the
   contents with this repo's [`firestore.rules`](./firestore.rules) →
   **Publish**. (These rules make the ledger publicly readable, donor codes
   lookup-only, and every write admin-only.)
6. **Get the web app config:** Project settings (gear, top-left) →
   **Your apps** → **Web (`</>`)** → register an app (nickname anything, skip
   Firebase Hosting) → copy the six values from `firebaseConfig` — they map
   1:1 to the `VITE_FIREBASE_*` vars in [`.env.example`](./.env.example).

## 2. Cloudinary unsigned preset

1. Sign up / log in at <https://cloudinary.com> (free tier is enough).
2. Copy your **Cloud name** from the Dashboard → `VITE_CLOUDINARY_CLOUD_NAME`.
3. Settings (gear) → **Upload** → scroll to **Upload presets** →
   **Add upload preset**:
   - **Signing Mode: Unsigned** (required — the browser uploads directly).
   - Name it e.g. `lapa-field-unsigned` → that name is
     `VITE_CLOUDINARY_UPLOAD_PRESET`.
   - Optionally restrict: Folder `lapa-field`, allowed formats `jpg,png,webp`,
     max file size 5 MB. Save.
4. No API key/secret is needed client-side; unsigned uploads are safe here
   because images are public content anyway.

## 3. Local development

```bash
npm install
cp .env.example .env      # then fill in all 10 values
npm run dev
```

Open <http://localhost:5173/admin> and sign in with the admin user from
step 1.4. If the env vars are missing/placeholders the app runs in demo mode
and `/admin` shows a "Firebase not configured" notice instead of a broken form.

## 4. GitHub + Vercel deploy

```bash
git init && git add -A && git commit -m "initial"   # if not already a repo
# create the GitHub repo, then:
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main

npm i -g vercel
vercel login
vercel            # preview deploy — answer the prompts (defaults are fine)
vercel --prod     # production deploy
```

Then set the environment variables: Vercel dashboard → your project →
**Settings → Environment Variables** → add all 10 `VITE_*` vars
(Production + Preview). **Redeploy** after adding them
(`vercel --prod` again, or Deployments → ⋯ → Redeploy) — Vite bakes env vars
into the bundle at build time.

> **Note:** `.env` is gitignored and Vercel builds do **not** read it — the
> dashboard variables are the only source on the platform. Verify `.env`
> stays untracked before your first push (`git status` should not list it).

## 5. Donations (Stripe)

Donations are processed by **Stripe Payment Links**. All gifts pool into ONE
fund — the team deploys it dynamically against daily field needs (nothing is
earmarked per donor). After checkout, Stripe redirects the donor back to
`/donate/success`, which picks up their freshly generated donor code.

> **Entity requirement:** Stripe does **not** onboard Colombia-registered
> merchants — you need a US (or other supported-country) legal entity and
> bank account. If the mission only has a Colombian entity, use
> [Wompi](https://wompi.com) as plan B (Bancolombia's processor) and adapt
> `functions/src/stripeWebhook.ts` to Wompi's event format.
>
> **Nonprofit rate:** registered US 501(c)(3) organizations can apply for
> Stripe's discounted nonprofit processing rate of **2.2% + $0.30** per
> transaction (Stripe support → "nonprofit discount").

1. **Create the Payment Link:** Stripe Dashboard → **Payment Links** →
   **+ New** → pick your donation product/price (enable "Let customers
   adjust quantity" or custom amounts if desired). Under
   **After payment → Confirmation page**, choose **Redirect to your
   website** and set:
   ```
   https://YOURAPP/donate/success?session_id={CHECKOUT_SESSION_ID}
   ```
   (Stripe substitutes `{CHECKOUT_SESSION_ID}` literally — keep it as-is.)
   Copy the link URL (`https://buy.stripe.com/…`) → `VITE_STRIPE_PAYMENT_LINK`.
2. **Deploy the functions** (repo includes `functions/` + `firebase.json` +
   `.firebaserc` — set your project id in `.firebaserc` first):
   ```bash
   cd functions && npm install && cd ..
   firebase functions:secrets:set STRIPE_SECRET_KEY      # sk_live_… or sk_test_…
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # set after step 3; redeploy after
   firebase deploy --only functions
   ```
   Note the two function URLs in the deploy output, e.g.
   `https://us-central1-<project>.cloudfunctions.net/stripeWebhook` and
   `…/lookupDonation`. The base (`https://us-central1-<project>.cloudfunctions.net`)
   goes into `VITE_FUNCTIONS_BASE_URL`.
3. **Create the webhook:** Stripe Dashboard → **Developers → Webhooks** →
   **Add endpoint** → URL = the `stripeWebhook` function URL → listen to
   **`checkout.session.completed`** only. Copy the endpoint's
   **Signing secret** (`whsec_…`) and set it:
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   firebase deploy --only functions   # pick up the new secret value
   ```
4. **Verify end-to-end in test mode:**
   ```bash
   stripe listen --forward-to https://us-central1-<project>.cloudfunctions.net/stripeWebhook
   stripe trigger checkout.session.completed
   ```
   Then open a test Payment Link, pay with `4242 4242 4242 4242`, and confirm
   the success page shows a donor code and the feed updates live. Check
   `firebase functions:log` if the success page stays in "Confirming…".

How it works: `stripeWebhook` verifies the signature, writes the donation +
donor (12-char Base58 code) + `stats/global.totalIn` increment +
`stripeSessions/{sessionId}` marker in one batch (idempotent on session id);
`lookupDonation` is a public read-only endpoint that returns just
`{status, code}` — never email or PII. The `stripeSessions` collection is
fully closed in `firestore.rules` (Admin SDK bypasses rules).

## 6. SPA rewrite

`vercel.json` is already included in this repo and rewrites every route to
`index.html`, so deep links like `/admin`, `/feed` and `/impact` work on
hard refresh. Nothing to configure.

## 7. Firebase Blaze plan note

Firestore security rules that reference `request.auth` and Auth itself work
on the free **Spark** plan — but the project's Firestore usage may prompt an
upgrade to **Blaze** (pay-as-you-go). A credit card is required to activate
Blaze, yet **$0/month is expected** at this app's scale: Auth, Firestore
reads/writes and storage all stay well inside the free quota
(50k reads / 20k writes per day). **Firebase Storage is not used at all** —
photos live on Cloudinary's free tier. Set a budget alert
(Google Cloud Console → Billing → Budgets) for peace of mind.

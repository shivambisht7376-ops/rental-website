# Travel Booking Website

Customer website plus a simple owner dashboard for cabs, local rentals and tour packages.
Built with Next.js 14, Postgres (Neon) and Prisma.

## What the owner can do (no code needed)
Log in at `/admin`. Sections: **New Booking Requests, Upcoming Trips, All Bookings, Customer Records,
Routes & Prices, Vehicles (and drivers), Tour Packages, Payment Records, Booking History, Website & Settings.**

- Website requests arrive as *New Request*. Open one, enter the agreed fare, and press **Confirm**.
  The unique Booking ID (`CB-0001`, `CB-0002`...) is created **only at that moment**.
- The agreed fare is stored on the booking itself, so later price changes never alter old bookings.
- Record advance and other payments; the balance is calculated automatically.
- **WhatsApp:** every booking has a button that opens the customer's chat with a pre-filled message
  chosen by status. The owner can edit the text and must press Send in WhatsApp.
  The app never claims a message was sent; the owner can tap "I sent this message" to log it.
  Templates are editable under Website & Settings.
- Search by name, phone or Booking ID. Export bookings and customers to CSV (opens in Excel).
- Photos are uploaded from the phone/computer, resized in the browser and stored in the database.

## Spam protection
Honeypot field, minimum-fill-time check, limits per IP (5/hour) and per phone (5/day), duplicate detection
(same phone, pickup and time window in 24h), Indian mobile number validation, and automatic **flagging**
of suspicious requests (fake-looking names/numbers, links, same pickup and destination, date over a year away).
Optional CAPTCHA: Cloudflare Turnstile (free). SMS OTP is not included (needs a paid SMS provider).

## Environment variables
| Name | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct (non-pooled) string, used by Prisma |
| `AUTH_SECRET` | Long random string for login sessions |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used only by the seed command |
| `NEXT_PUBLIC_SITE_URL` | Public site address, used in password-reset links |
| `RESEND_API_KEY`, `OWNER_EMAIL`, `MAIL_FROM` | Optional: new-request alerts and password-reset emails (resend.com). Without them, emails are printed to the server log. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | Optional CAPTCHA |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in (customers and owner). Redirect URI: `<site>/api/auth/google/callback` |
| `ADMIN_EMAILS` | Comma-separated Google emails allowed to log in as owner |
| `ADMIN_SIGNUP_CODE` | Secret invite code for `/admin/signup`. If unset, owner sign-up is disabled |

## Accounts
- **Customers:** `/signup`, `/login` (email + password or Google). `/account` shows their bookings.
  Logged-in customers get name/phone pre-filled. Guests can still book without an account.
- **Owner:** `/admin/login` (password or Google). New owner accounts need the invite code, and Google owner login only works for emails in `ADMIN_EMAILS` or existing owners.
  Customer and owner sessions are separate, so a customer can never open `/admin`.

## Setup
```
cd app
npm install
npx prisma db push
npx prisma db seed        # creates the owner login and sample data
npm run dev               # http://localhost:3000
```
To reset the owner password from the command line: `ADMIN_RESET=1 ADMIN_PASSWORD=NewPass123 node prisma/seed.js`.

Deploy on Vercel with **Root Directory = `app`** and the variables above.

## Notifications
New requests show a red counter in the dashboard header, a banner, and the browser tab title
(checked every 30 seconds while the dashboard is open). Email alerts are sent if Resend is configured.

## Backups and recovery
- Neon keeps point-in-time history (free plan: about 6 hours; paid plans: up to 30 days). Restore from
  the Neon console: *Branches → Restore* to a time before the problem.
- Recommended: every week, open All Bookings and Customer Records and press **Download Excel/CSV**.
  Keep the files in Google Drive. This is an independent copy of the data.
- For stronger guarantees, use a paid Neon plan or schedule `pg_dump` with a GitHub Action.

## Demonstration checklist
1. Submit a request on the website, then see it under New Booking Requests.
2. Open it, enter a fare and confirm. A Booking ID appears.
3. Edit a route/vehicle price and add a tour package; both appear on the website at once.
4. Customer Records, search for the customer and see previous bookings.
5. Add an advance payment and check the balance.
6. Click WhatsApp on a booking, edit the message and send it manually.
7. Submit repeatedly; the site limits and flags requests.
8. Confirm an old booking still shows its original fare after changing prices.

## Not included / extra cost
SMS OTP verification, automatic WhatsApp sending (Meta API), online payment gateway, native mobile app,
multi-user staff roles, GST invoices.

# Payment sandbox testing (Phase 10)

Use this after login and a reservation with an outstanding balance.

## Prerequisites

- API: `npm run dev:api`
- Web: `npm run dev:web` (port 3001)
- Demo data: `npm run db:seed`
- Sign in: `admin@demo.bookingrooms.local` / `Demo1234!`

## Manual payments (cash)

1. Dashboard → Reservations → open a booking.
2. Record a pending payment → **Mark completed**.
3. Partial or full **Refund** (creates `payment_refunds` rows).

## Stripe

Set in `apps/api/.env`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/v1/payments/webhooks/stripe
```

Use the signing secret from `stripe listen` as `STRIPE_WEBHOOK_SECRET`.

On the reservation page, use **Stripe checkout**. Complete payment in Stripe test mode; the webhook should mark the payment `COMPLETED`.

## PayHere

Set in `apps/api/.env`:

- `PAYHERE_SANDBOX=true`
- `PAYHERE_MERCHANT_ID`
- `PAYHERE_MERCHANT_SECRET`

Guest profile must include email, phone, address, and country before **PayHere checkout**.

Notify URL (local): `http://localhost:3000/api/v1/payments/webhooks/payhere`

Use PayHere sandbox cards per their documentation.

## Reconciliation

Dashboard → **Payments** calls `GET /api/v1/payments/reconciliation`.
# New-request email notifications

The application can send booking and contact-request details to **abdelrahman.khater.elc@gmail.com**. Email sending requires an account with Resend and valid sender configuration. No key is embedded in the source, and saving a request does not by itself establish email delivery.

## Railway setup

1. Create/sign into a Resend account: https://resend.com . To use Resend's restricted test sender for your own inbox, use the same email address as the intended recipient and follow the current account eligibility restrictions. For production recipients, verify a sending domain in Resend.
2. Create an API key with sending permission.
3. In the Railway **web service → Variables**, add:

| Name                | Value                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`    | Your Resend sending API key; enter it privately in Railway.                                                                                                 |
| `NOTIFICATION_FROM` | An allowed Resend sender, such as `Open Energy <onboarding@resend.dev>` for an eligible self-recipient test, or an address on your verified sending domain. |
| `NOTIFICATION_TO`   | Optional. Defaults to `abdelrahman.khater.elc@gmail.com`.                                                                                                   |

Keep the existing `DATABASE_URL` and `SITE_URL`. Never put the key in a `NEXT_PUBLIC_*` variable, GitHub, a public screenshot or chat.

4. Deploy the latest commit. The production startup script creates the outbox table and launches both the Next.js server and the notification worker.
5. Submit a test consultation, sign into `/admin`, and expand **Email alerts → Recent email notifications**. Confirm the email service accepts the message, then check the recipient's inbox and Spam folder. A job marked **accepted** confirms the Resend API accepted it; this is not a delivery receipt. No webhook-based delivery/bounce confirmation is implemented.

If the test sender is rejected, inspect your Resend account's sender/recipient permissions. A personal Gmail address is the receiving address; it cannot be used as an arbitrary Resend sending identity. Do not use or disclose your ordinary Gmail password.

## What is sent

Booking emails include reference, submission time, name, phone, email, system type, city, property type, address (if supplied), preferred date/time, monthly bill (if supplied), message and a link to the staff workspace. Contact emails include the reference, submission time and submitted contact/message fields. Reply-To is the validated client's email, allowing staff to reply directly.

User-provided HTML is escaped. Provider response bodies, keys and submitted personal details are not logged. Details are transmitted to Resend for the requested email notification; account configuration and retention at that provider are the owner's responsibility.

## Reliability and status

The request and a single outbox job commit in the same PostgreSQL transaction. An identical submission retry does not create an extra email job. A missing sender setup leaves new jobs pending and displays **Not configured** in the staff workspace; requests remain saved.

The worker claims jobs using PostgreSQL row locks with `SKIP LOCKED` and a two-minute lease. It retries transient service failures with exponential backoff, up to six attempts, and reuses a stable provider idempotency key for that job. Authentication/sender rejection is marked failed, visible to staff. Resend's idempotency retention is provider-limited; this is not a guarantee of exactly-once inbox delivery indefinitely. An accepted message is not eligible for manual resend.

After fixing credentials or sender permissions, admins/staff can retry a failed notification in the workspace. Viewers cannot trigger retries. If the final attempt was ambiguous because of a network failure, check the Resend dashboard before retrying. A crashed worker is restarted by the production supervisor. Valid expired leases can be recovered by another worker.

The first deployment of this feature queues **new submissions only**. Older existing requests are not automatically emailed. New pending jobs created after deploying the feature are processed after sender configuration is supplied. Deleting the associated request removes its outbox row. No dedicated recipient-facing delivery promises are added to public form confirmations.

## Local testing

Set the sender variables securely in `frontend/.env.local` only if actual sending is intended. Start the website separately, then run:

```sh
node --env-file=frontend/.env.local scripts/notification-worker.mjs
```

The Railway production entry point starts this worker automatically. Plain `npm run dev` / `npm start` alone does not start the background worker.

Tests use a local HTTP provider fixture and isolated PostgreSQL schemas. They verify queueing, concurrency, retries, expired leases, permanent failure, HTML escaping, credential protection, and API acceptance without sending real messages. A real email to the owner's inbox still requires the configuration above and a live validation step.

## Staff-only status API

`GET /api/admin/notifications` returns sender-configuration presence (never keys), pending/sending/accepted/failed counts and the 20 most recent job states to an authenticated staff user. `POST` with `{ "id": "OUTBOX_JOB_UUID" }` requeues a failed job only when the sender is configured and the user is admin/staff; viewers are denied. Both the existing origin protection and the authenticated server session are required for retries. Accepted messages cannot be retried through this endpoint.

# Implementation brief: prepaid video packs with Stripe

Date: 2026-09-17. Status: implementation specification; no payment integration or cloud resources have been provisioned by creating this file.

Read the owner-facing Estonian companion, [SEADISTAMINE-JA-ARENDUSPLAAN.md](SEADISTAMINE-JA-ARENDUSPLAAN.md), before implementation. This brief preserves the recovered 2026-09-16 product plan and makes its failure handling concrete. Technical details below are proposed project decisions, not claims that the current application already implements them.

## 1. Outcome and boundaries

Replace the Buy Me a Coffee component with a one-time Stripe Checkout purchase of three video generations. Photo restoration stays free, with five successful photo restorations per rolling 24 hours per anonymous browser session. No user accounts, subscriptions, public gallery, or automatic email recovery.

| Setting | Initial value |
|---|---|
| Pack | 3 generation credits |
| Price | EUR 2.99 total; owner must confirm tax configuration before launch |
| Validity | 30 days from first verified fulfillment of each purchase |
| Model | `veo-3.1-lite-generate-preview` |
| Output | One 8-second 720p video per job; explicitly configure duration |
| Aspect ratios | Explicit user selection of `16:9` or `9:16` |
| Concurrency | One active video job per anonymous session |
| Successful result | Consumes one reserved credit |
| Confirmed failure or filtering | Releases the reservation; never creates a new 30-day entitlement |
| Downloads | Repeatable for one hour after success is recorded; no additional debit |
| Browser checkout draft | Valid for at most 24 hours; purge expired entries when app executes |

Retain React, TypeScript, Vite, Express, and the Gemini Developer API. Cloud Run is the intended host from the prior plan, but inspect the actual deployment before modifying it. Use Firestore for authoritative state, Cloud Tasks for polling, and a periodic Cloud Scheduler reconciliation job for crash recovery.

The model is a preview dependency. Verify access, quotas, SDK types and supported parameters in the owner's actual project before enabling paid sales. Do not silently change the model or fall back to a more expensive one. The current official reference documents 4/6/8-second output, 720p support for Lite, native audio and provider-side video retention of two days. These do not imply a silent output guarantee or that every portrait will pass filtering. [Veo reference](https://ai.google.dev/gemini-api/docs/veo).

## 2. Current repository and preservation requirements

Verified on 2026-09-17:

| File | Current role / implementation action |
|---|---|
| `server.ts` | Express server; global JSON parser; in-memory quota map; Gemini photo calls; disabled video start; old status/download endpoints |
| `src/App.tsx` | Photo workflow; client-generated localStorage identity; quota fetches; React-only result state |
| `src/components/VideoAnimator.tsx` | Disabled notice; replace with purchase/job/result states |
| `src/components/PhotoCompareSlider.tsx` | Renders video and coffee components; retain existing photo interactions |
| `src/components/DeveloperCoffeeCard.tsx` | Remove after replacement is wired |
| `src/videoPresets.ts` | Existing motion definitions; share validated IDs with server |
| `src/components/Header.tsx` | Add credit availability; update help and retention copy |
| `src/components/ResponsibilityBanner.tsx` | Replace obsolete free daily-video quota claims where used |
| `src/components/LegalFooter.tsx` | Update paid-service and storage statements |
| `src/types.ts` | Separate free photo quota from purchased video entitlements |
| `src/utils/devMetrics.ts` | Remove misleading five-second video cost assumptions |
| `src/index.css`, `index.html` | Remove coffee-only styles and Cookie font; retain shared fonts/preconnects if still used |
| `.env.example` | Currently contains `GEMINI_API_KEY` and `APP_URL`; extend with placeholders only |
| `package.json` | `dev`: `tsx server.ts`; `lint`: `tsc --noEmit`; production build bundles server to `dist/server.cjs` |

Existing local modifications were present in `server.ts`, `src/App.tsx`, and `src/components/PhotoUploader.tsx`. Start with `git status` and read their diffs; preserve them. Recheck local instructions and current state rather than assuming this snapshot is unchanged.

The current `/api/generate-video` returns 503 immediately. Its unreachable implementation accepts browser prompts, exposes an operation name, omits explicit duration and can fall back to Standard. Old downloading debits a daily quota. Do not simply remove the early return and call this implementation paid-ready.

No Stripe/Firestore/Cloud Tasks dependencies or test runner are currently declared. Add compatible dependencies and meaningful tests as part of implementation. Do not run the current Unix-style `clean` script on Windows or delete existing work to get a clean baseline.

## 3. Architecture and module boundaries

Use one build artifact with two runtime roles:

- `SERVICE_ROLE=web`: public Express API and React assets; Stripe webhook; user-authorized job launch and download.
- `SERVICE_ROLE=worker`: private Cloud Run service exposing only task/reconciliation/health handlers. No SPA fallback, public user API or Stripe route.

The web process makes the initial Veo call while handling the upload request; the input image is not persisted server-side. The worker only polls an already-started operation. This distinction is deliberate: a launch interrupted before a durable operation name is saved cannot safely be retried in the background.

Suggested layout, adapted as needed to the repository:

```text
server/
  config.ts                 validated settings and runtime role
  app.ts                    middleware and route ordering
  auth/session.ts           opaque cookie identity and ownership
  billing/checkout.ts       pending purchases and Stripe Checkout
  billing/fulfillment.ts    one shared verified purchase settlement path
  billing/reversals.ts      refund/dispute reconciliation
  credits/ledger.ts         credit reservation, settlement and audit
  video/jobs.ts             job state transitions and launch lease
  video/provider.ts         Gemini adapter and fake adapter for tests
  video/download.ts         authorized provider streaming
  tasks/outbox.ts           durable task intents and dispatch
  tasks/reconcile.ts        recovery of due/stuck work
  storage/firestore.ts      repository operations and transactions
src/hooks/useSession.ts
src/hooks/useVideoJob.ts
src/utils/checkoutDraft.ts
tests/
```

Keep the root `server.ts` as an entry point. Make app creation importable without starting a listener. Ensure the production build still includes all new server modules and that worker mode never initializes Vite.

## 4. Session identity and authorization

Generate at least 32 cryptographically random bytes for an opaque cookie. Store only its SHA-256 hash as a unique lookup key, mapped to a separate random internal `sessionId`. Never return the bearer token in JSON or put it in Stripe metadata.

Production cookie: `__Host-vf_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, no Domain. Use a separately named non-Secure cookie only for explicit localhost development. Use a renewable 45-day session expiry; refresh on authenticated visits and checkout so a fresh 30-day pack is not hidden by an earlier session expiry. Purchase expiry remains independent and fixed.

`GET /api/session` creates or renews a session and returns its safe view. The first mutating request must demonstrate the established cookie round trip; do not take money when cookies are blocked. Legacy `x-client-id` is never payment authorization. Switching identity systems may reset old free quota once; do not import a client-supplied paid balance.

For user mutation endpoints, require same-origin requests, validate `Origin` against the configured origin and use a session-bound CSRF token. Do not derive trusted redirects from arbitrary Host headers. Configure proxy trust to the deployment, not blindly to every forwarded IP. Stripe webhook and IAM-protected worker calls use their own authentication instead of browser CSRF.

Read ownership from server state for purchases, jobs and downloads. Return a generic 404 for foreign resources. Cache personalized responses with `Cache-Control: no-store`. Add size limits, per-session/IP request controls and a global provider concurrency cap; a new anonymous session cannot be treated as a reliable unique person.

## 5. Firestore data model

Use server SDK access through Cloud Run service identity. Do not expose Firestore client credentials or allow browser writes to payment collections. Avoid raw image data, cookie values and full provider payloads in documents or logs.

| Collection | Key and minimum fields |
|---|---|
| `sessions` | Random session ID; createdAt, expiresAt, activeVideoJobId, recentPhotoReservations/successes |
| `sessionTokens` | Token hash; sessionId, expiresAt, revokedAt |
| `purchases` | Random purchase ID; ownerSessionId, checkoutSessionId, paymentIntentId, mode, priceId, packVersion, expectedAmountMinor, currency, status, fulfilledAt, expiresAt, refund/dispute state |
| `stripeCheckoutBindings` | Checkout Session ID; purchaseId, paymentIntentId; unique binding |
| `credits` | Deterministic `purchaseId:index` for indexes 0–2; ownerSessionId, purchaseId, expiresAt, state, reservedJobId, consumedJobId |
| `creditEvents` | Deterministic transition key; creditId, jobId, purchaseId, type, timestamp, reason |
| `videoJobs` | Random ID; ownerSessionId, creditId, purchaseId, requestKeyHash, inputHash, presetId, aspectRatio, model, duration, resolution, state, launchToken, operationName, timestamps, deadlineAt, downloadExpiresAt, errorCode |
| `requestKeys` | Hash of sessionId + endpoint + idempotency key; request hash and resulting purchase/job ID |
| `stripeEvents` | Stripe event ID; type, receivedAt, processing state, retryAt; limited payload/foreign IDs needed for recovery |
| `taskOutbox` | Job/revision key; kind, dueAt, dispatchedAt, taskName, dispatch lease |

Credit states: `available`, `reserved`, `consumed`, `expired`, `revoked`. Purchase-level hold flags block new reservations without losing the underlying credit state. Derive displayed availability from eligible credits whose purchase is usable and whose expiry is in the future; never trust a client counter.

Create explicit Firestore indexes for owner + eligible credits ordered by expiresAt, owner + jobs ordered by createdAt, and due/stale jobs and task intents. Commit index definitions. Use timestamps for all comparisons; TTL deletion is cleanup, not the enforcement of purchase, token or download expiry.

Keep purchase and accounting audit retention separate from ephemeral draft/task retention. Do not TTL-delete purchase history at 30 days. Document the chosen retention policy for owner review before launch.

Firestore transaction callbacks may rerun. Keep them free of Stripe, Gemini and task-creation side effects. [Transaction reference](https://docs.cloud.google.com/firestore/native/docs/manage-data/transactions).

## 6. Checkout and verified fulfillment

### Creating checkout

1. Validate the cookie, CSRF token, sale flag and an idempotency key. The browser has already saved its photo draft.
2. Persist a pending purchase with the current immutable offer snapshot. Bind a repeated request key to the same purchase; reject reuse with different inputs.
3. Create hosted Stripe Checkout using `mode=payment`, the configured EUR Price and quantity 1. Explicitly limit the initial integration to card payments and supported card wallets. No adjustable quantity, promotion codes or subscriptions.
4. Use a stable Stripe idempotency key derived from purchase ID. Include internal purchase ID as metadata/client reference, never credentials or photo data.
5. Set fixed success/cancel routes beneath validated `APP_URL`. Include Stripe's Checkout Session placeholder on success. Save returned session ID and URL. Reconcile an uncertain creation response with the same idempotency key; do not create a new purchase automatically.
6. Maintain a retry deadline shorter than Stripe's idempotency retention. Older ambiguous purchases require reconciliation instead of a fresh charge attempt.

Use one `fulfillVerifiedCheckout(checkoutSessionId)` path for webhook processing and return-page confirmation. Retrieve authoritative Stripe data and validate paid status, expected mode, currency, total, Price ID, quantity, purchase binding and environment. The owner-approved total is 299 euro cents; if a future tax design changes that invariant, update the offer and checks together.

In one Firestore transaction, establish the unique checkout binding, set first fulfillment time and create exactly three deterministic credit documents. Duplicate events, concurrent confirmation requests and replayed webhook deliveries must converge on the same purchase. A `success` URL or Checkout ID alone never grants ownership or credit. [Stripe fulfillment reference](https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted).

### Webhook transport and inbox

Register `express.raw({type: 'application/json'})` for `/api/stripe/webhook` before the global JSON parser. Validate Stripe signature with the endpoint-specific secret. Persist a deduplicated event inbox record before acknowledging. Process promptly; if further work fails after persistence, the reconciler must retry it. Return an error when durable acceptance itself fails. [Stripe webhook reference](https://docs.stripe.com/webhooks).

Handle the event list from the Estonian guide. `completed` must still be verified as paid; delayed-success events use the same fulfillment. Expired/failed notifications must not regress a paid purchase. Do not assume event ordering. Refund/dispute handlers must retrieve current authoritative state and work even when reversal notification precedes local fulfillment.

Never run video generation in a webhook. Keep webhook receipt and confirmation available when sales are disabled.

### Reversals and customer support

For a successful full refund, revoke unused credits from that purchase. For a pending refund or open dispute, hold unused entitlements until the outcome is known. Failed refunds and won disputes may restore only still-valid, unrevoked unused credits. A lost dispute revokes unused rights. A partial successful refund enters manual review with a hold; do not guess a fractional credit conversion. Prevent reconciliation from restoring a fully refunded purchase because a later dispute was won. [Refund lifecycle reference](https://docs.stripe.com/refunds).

Handle active jobs explicitly: before provider launch, revoke/release according to the purchase state and clear the active slot; after launch, continue polling to settle provider work without a second call. Hold delivery while a reversal is pending; on full refund/lost dispute do not serve the result. Record any already-incurred provider expense; never generate replacement credits implicitly.

Provide an authenticated operator-only CLI/runbook for verified purchase recovery. It transfers the eligible purchase, its credit and job ownership to a new session in a logged transaction, invalidates old access, and never grants extra credits. Refuse transfer while either involved session has an active job; resolve that first. No public recovery endpoint or customer-supplied Stripe ID as proof of ownership.

## 7. Video job state machine and financial invariants

States:

```text
reserved -> launching -> running -> succeeded
                     -> launch_unknown -> running (only if original operation is recovered)
reserved/launching/running/launch_unknown -> failed or review_released
succeeded -> download_expired (display state; consumed credit remains consumed)
```

Persist `deadlineAt = createdAt + 1 hour` for unresolved jobs. Any terminal settlement must atomically update job, credit, ledger and session active slot. Clear the slot only if it still points to this job. A job never consumes more than its original credit.

### Reservation and launch

1. Validate actual decoded image type, dimensions and bounded size before reserving. Choose an initial maximum of 10 MiB decoded with matching route/proxy limits; resize appropriately in the browser and document supported input formats. Reject arbitrary image URLs.
2. Resolve an allowed preset ID to a server-controlled prompt. Remove `speaks_greeting` from the initial UI because it contradicts the intended no-dialogue presets. Do not run paid dynamic prompt suggestions.
3. Compute a request hash including decoded image content, preset, aspect ratio and server offer version. Store only the hash. Reusing a request key with a different hash returns 409.
4. In a transaction, select the earliest-expiring eligible credit, reserve it, create the job and watchdog outbox intent, and set the session's active job ID. A concurrent different request returns an active-job conflict. An identical retry returns the original job.
5. Acquire a one-time launch token using compare-and-set. Only its owner can move `reserved` to `launching`. Never perform the provider call inside the transaction.
6. Make one bounded Gemini create call with the in-memory image. Disable automatic create-call retries where the SDK supports it, and inspect transport behavior. Retry of a polling read is different from retry of a billable create operation.
7. Persist the original operation name and `running` state, together with a polling outbox intent. If this database write transiently fails, retry the write, not the provider call.

### Ambiguous launch and process death

A timeout or process death can leave the provider call accepted while its operation name is unknown. No database transaction can make an external non-idempotent create call exactly once. Do not claim that guarantee.

- A stale `launching` job becomes `launch_unknown`. It must never automatically return to `reserved` for another launch.
- Because no image is persisted, a process death before launch also cannot be resumed by a worker; conservatively release it after the watchdog deadline, or earlier only with conclusive evidence that no create call occurred.
- Poll an operation only when its actual name is recovered. Do not invent or enumerate provider operation IDs.
- If unresolved at one hour, mark `review_released`, release the reservation and alert the operator. A late provider result is quarantined; it cannot debit a released/reused credit or become automatically downloadable.
- The business may incur a provider cost for an orphaned operation. Log this possibility as an operational incident, with no photo or credential payloads.

### Success, failure and expiry

Success requires a completed operation with a usable video reference, not merely `done=true`. Persist a stable success timestamp and `downloadExpiresAt = successAt + 1 hour` once. Bound it by any known provider expiry. Repeated polls never extend the deadline. An operation first recovered after the unresolved deadline follows the review path, not late automatic settlement.

On confirmed failure/filtering, release the credit to `available` only if its purchase is still eligible and unexpired; otherwise it becomes `expired` or `revoked`. A reservation started before purchase expiry may complete and consume that reservation after expiry. Failure after expiry does not renew the package. Downloads of an already successful job can finish their original one-hour window even if package validity ends meanwhile.

No successful video reference or a permanently inaccessible result must not leave an unexplained debit. Confirm durable delivery failure through the worker/review path; issue at most one compensating release for that job under the same expiry rules. Transient client network errors do not refund a successfully delivered generation.

## 8. Durable polling and reconciliation

Write the outbox intent in the same transaction as the state transition that requires future work. Dispatch outside the transaction with deterministic task names per job/revision. Duplicate task creation is harmless. Use dispatch leases and reclaim stale leases.

A task polls once, settles if terminal, otherwise stores the next polling intent before acknowledging. Start with a 10-second polling delay and cap backoff at 60 seconds. Task payload contains job ID/revision only; load ownership and provider information from Firestore. Every handler must tolerate replay and out-of-order delivery.

Cloud Tasks calls the private worker using OIDC and a dedicated invoker service account. Use the worker base URL as the configured audience. IAM restricts invocations to task and scheduler identities; do not authenticate merely by the presence of `X-CloudTasks-*` headers. [Cloud Run task pattern](https://docs.cloud.google.com/run/docs/triggering/using-tasks), [HTTP task authentication](https://docs.cloud.google.com/tasks/docs/creating-http-target-tasks).

Schedule reconciliation every minute. Scan bounded pages of due outbox items, stale launch states, overdue active jobs and unprocessed Stripe inbox items; reclaim expired leases and arrange further polling or settlement. Include a conservative recent-Stripe-Checkout reconciliation pass for locally pending purchases, with backoff and age bounds. Cloud Scheduler is an explicit dependency, not a browser timer.

Application restart, failed enqueue, exhausted task retries and a missed webhook must each have a durable recovery route. Reserve state before enqueueing; never rely on code continuing after an HTTP response or on a process-local `setInterval`.

## 9. Downloading and retention

`GET /api/video-jobs/:id/download` verifies session ownership, successful settlement, purchase reversal restrictions and the stored deadline. It streams the known provider file through the server with `Content-Type: video/mp4`, a sanitized filename, `Content-Disposition: attachment` and private/no-store caching. Playback can use a separate same-origin authorized response if needed.

Never accept a browser-supplied operation name, URL or API key. Prefer supported SDK downloading. If raw HTTP is required, validate HTTPS and provider host/path against tested provider URL forms, bound redirects and response sizes, and never forward an API key to an untrusted redirect host. Keep provider URLs and keys out of logs and client JSON. Handle aborts and repeated downloads without modifying credit state.

Delete provider references when they are no longer needed for the download/support policy. Do not promise immediate Google-side deletion: the application's one-hour delivery policy is distinct from provider retention. Do not persist video/image bytes in Firestore, task bodies, request logs or server files.

Browser drafts use IndexedDB blobs with `createdAt`, `expiresAt`, selected preset/aspect ratio, filename and restored-photo metadata. Read back a draft before redirecting. On return, restore only an unexpired valid draft, then remove Checkout query parameters with history replacement. Purge drafts on explicit removal, replacement and expiry checks. Describe expiry honestly: cleanup runs when the application executes, not while a browser is closed.

## 10. API contract

All response examples and final types must share one schema. Timestamps are ISO strings; monetary values are integer minor units. Errors use `{error: {code, message, retryable}, requestId}` without provider internals.

| Endpoint | Request / behavior |
|---|---|
| `GET /api/session` | Cookie establishment/renewal; returns photo quota, offer, sale/generation flags, CSRF token, available/reserved credits, purchase expiries, active job and recent unexpired result summaries |
| `POST /api/checkout` | `Idempotency-Key`, CSRF; `{offerId}` from the displayed server catalog; returns `{purchaseId, checkoutUrl}`; no client price |
| `POST /api/checkout/confirm` | `{checkoutSessionId}`; verifies ownership and authoritative paid state; returns pending/paid/failed without granting by URL alone |
| `POST /api/stripe/webhook` | Signature-verified raw body; durable event acceptance |
| `POST /api/video-jobs` | `Idempotency-Key`, CSRF; `{imageBase64, mimeType, presetId, aspectRatio}`; returns 202 and safe job snapshot |
| `GET /api/video-jobs/:id` | Safe job state, user-facing error, download deadline and availability; never operationName |
| `GET /api/video-jobs/:id/download` | Authorized repeated download; foreign ID 404; elapsed window 410 |
| `POST /internal/video/poll` | Worker only, IAM; job ID/revision |
| `POST /internal/reconcile` | Worker only, IAM; bounded recovery pass |

Use 400 for invalid input, 403 for failed browser request authorization, 409 for idempotency conflicts/another active job, 402 with `NO_VIDEO_CREDITS` for insufficient entitlement, 429 for rate limits and 503 for paused/unavailable generation. Lost session access produces an explicit recovery message; it must not attach an old purchase to a new visitor implicitly.

Remove or explicitly return 410 from old `/api/generate-video`, `/api/video-status` and `/api/video-download` routes. Disable `/api/suggest-video-prompts` in the initial release so it cannot remain an unmetered paid-model endpoint. Register API 404 handling before the production SPA catch-all.

Preserve photo endpoint aliases `/api/restore-photo` and `/api/generate-photo`. Move free photo quota to a durable atomic reservation/settlement pattern so parallel requests cannot exceed five successful restorations plus active reservations. Confirmed failures release reservations; uncertain external calls follow a documented bounded hold. Do not change existing photo prompts or output quality as part of payment work.

## 11. Frontend requirements

Represent explicit states: loading session, offer, saving draft, redirecting, confirming payment, credits available, launching, generating, launch under review, ready, failed, expired and temporarily paused.

- Use the server offer for all displayed amounts; never maintain a second hard-coded price in React.
- Preserve the current photo result and comparison controls. Keep remaining credits visible in the header before another photo is uploaded.
- Refresh authoritative state after checkout, settlement, tab focus and visibility restoration. Local disabling of a button is UX, not concurrency control.
- Store the request idempotency key until its job/purchase is resolved. A network retry reuses it; an intentional new video gets a new key.
- Payment is a user decision and generation is a separate user click. Do not auto-generate on return.
- Explain same-browser validity before purchase, including private browsing and cookie deletion. Show a precise download deadline and remaining credits per expiry group.
- Avoid promises about exact wait times, perfect resemblance, child-photo acceptance, speech or guaranteed silence.
- Accessible focus handling, status announcements, keyboard controls and mobile layout are required. Test mobile save/download behavior beyond the desktop build.

Example Estonian copy: “Osta 3 videot — 2,99 €”, “Kontrollime makset”, “Loo video — kasutab 1 korra”, “Video ei valminud. Kasutuskord vabastati.” For a released but expired credit, explain expiry rather than displaying a spendable balance that does not exist.

## 12. Configuration, IAM and deployment

Suggested environment contract; validate on boot per runtime role:

```dotenv
NODE_ENV=production
SERVICE_ROLE=web
APP_URL=https://YOUR_PUBLIC_APP
GEMINI_API_KEY=SECRET_REFERENCE
STRIPE_SECRET_KEY=SECRET_REFERENCE
STRIPE_WEBHOOK_SECRET=SECRET_REFERENCE
STRIPE_MODE=test
STRIPE_VIDEO_PRICE_ID=price_REPLACE
VIDEO_PACK_PRICE_MINOR=299
VIDEO_PACK_CREDITS=3
VIDEO_PACK_VALID_DAYS=30
VIDEO_MODEL=veo-3.1-lite-generate-preview
VIDEO_DURATION_SECONDS=8
VIDEO_RESOLUTION=720p
VIDEO_DOWNLOAD_TTL_SECONDS=3600
VIDEO_JOB_DEADLINE_SECONDS=3600
VIDEO_SALES_ENABLED=false
VIDEO_GENERATION_ENABLED=false
VIDEO_PROVIDER=fake
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT
FIRESTORE_DATABASE_ID=(default)
TASKS_LOCATION=YOUR_REGION
TASKS_QUEUE=video-jobs
VIDEO_WORKER_URL=https://YOUR_PRIVATE_WORKER
TASKS_INVOKER_SERVICE_ACCOUNT=tasks-invoker@YOUR_PROJECT.iam.gserviceaccount.com
```

`VIDEO_PROVIDER=fake` is for isolated test environments. A boot guard must reject live sales with a fake provider and reject test/live Stripe-object mismatches. Never expose these secret values through Vite build-time injection. For hosted Checkout URL redirection, no publishable Stripe key is necessary.

Owner supplies project/account details and secrets through secure settings, not chat or repository files. Provide a deployment script/runbook using their actual region and service names. Deploy web and worker from the same version. Ensure `NODE_ENV=production`, correct role, platform `PORT`, and matching task audience.

Minimum permission design to verify during provisioning:

| Identity | Intended access |
|---|---|
| Web runtime | Firestore data operations; enqueue on video queue; actAs task invoker for OIDC task creation; access its Gemini and Stripe secrets |
| Worker runtime | Firestore; enqueue follow-up tasks; actAs task invoker; Gemini secret for polling/download checks; Stripe secret for payment reconciliation |
| Task invoker | Cloud Run Invoker on private worker only |
| Scheduler invoker | Cloud Run Invoker on private worker only |
| Deployer | Explicit deployment/identity-binding access appropriate to the owner's project |

Use narrow resource-scoped grants where supported, with Cloud Tasks service-agent token permissions verified according to the provider guide. Do not grant public invoker access to the worker or create long-lived Google service-account keys. Provision required APIs, Firestore indexes, queue retry/rate settings, Scheduler target and secret access as reproducible configuration. [Cloud Run secrets guide](https://docs.cloud.google.com/run/docs/configuring/services/secrets).

Both sale and generation flags are server-enforced. Turning off sales blocks new checkout creation but preserves incoming payment settlement. Turning off generation blocks new starts while workers, existing operation polling and permitted downloads continue. If credentials or accounting storage are unavailable, fail closed for paid mutations and report a clear operational error.

## 13. Implementation order and deliverables

1. Inspect existing diffs and deployment. Run baseline type/build checks and record pre-existing failures. Add validated config and importable app boundaries.
2. Implement session/CSRF/ownership and Firestore repositories, credit ledger and fake provider. Add emulator integration tests for races and expiry.
3. Implement Checkout, signed webhook inbox, fulfillment and reversal reconciliation. Exercise Stripe test mode without real Gemini calls.
4. Implement launch leases, provider adapter, outbox, private worker and scheduler reconciliation. Inject failures around every external-call/persistence boundary.
5. Build frontend states, IndexedDB checkout recovery and authenticated downloads. Replace coffee UI and obsolete daily-video copy.
6. Update Estonian owner documentation with actual provisioning values, commands, support recovery and retention choices. No secrets in docs.
7. Deploy an isolated test environment, run Stripe and Cloud Run failure-path checks, then a bounded authorized real-video smoke test.
8. Present tested changes and launch configuration for owner review. Enable live sales only as a separate release action once the authorized launch checks are satisfied.

Deliver code, dependency lockfile, indexes, deployment/rollback runbook, test commands, test evidence and any remaining project/account blockers. Do not claim paid service readiness from a fake provider or a successful TypeScript build.

## 14. Acceptance tests

| Scenario | Required assertion |
|---|---|
| Paid test checkout | Exactly three eligible credits from one verified purchase |
| Cancelled/unpaid checkout | No credits; photo draft restored |
| Duplicate webhook + concurrent confirm | One fulfillment; one set of deterministic credits |
| Altered amount, Price, currency, quantity or mode | Rejected/held; no entitlement |
| Refund notification arrives before completion | Refunded purchase never becomes spendable |
| Full/partial/pending refund, dispute won/lost | Correct per-purchase hold/revocation; unrelated packs unaffected |
| Foreign checkout/job/download and forged client ID | No cross-session access or transfer |
| Bad signature, CSRF and forged task headers | Rejected; valid IAM task works |
| Two tabs start simultaneously | At most one active job and one reservation |
| Replayed key, identical body | Same job; no second provider call |
| Replayed key, changed body | 409; no state mutation |
| Provider success | One consumed credit and stable one-hour download deadline |
| Filter/error/empty output | One release, no negative or duplicated balance |
| Provider response timeout | No automatic new create call; bounded review/release |
| Crash before/after provider call or operation persistence | Durable watchdog; no unsafe relaunch |
| Crash between commit and enqueue, lost task, duplicate task | Outbox/reconciler recovers; no duplicate settlement |
| Late response after release | Cannot charge reused credit or expose orphaned result |
| Pack expiry while reserved | Success can consume original reservation; failure cannot renew it |
| Repeat/aborted download | No new debit; deadline does not move |
| Permanently inaccessible completed result | At most one recorded compensation/review outcome |
| Browser closes, server restarts, multiple instances | State persists; polling continues independently |
| Cookie/IndexedDB blocked or draft expired | Clear pre-checkout message or safe recovery; no lost-photo surprise |
| New pack after older purchase | Independent 30-day validity; oldest eligible credit used first |
| Sales paused during checkout | Already paid purchase still settles; no new checkout |
| Free photos, concurrent requests | Existing functionality preserved; durable quota enforced |
| Operator recovery | Original session loses access; no extra credits; active-job guard works |

Run `npm run lint` (currently TypeScript checking) and `npm run build`, then meaningful integration tests using the Firestore emulator and fake Stripe/Gemini adapters. Add the selected test command to `package.json`. Inspect generated production HTML/assets and server output for correct paths and secret exclusion.

Then run Stripe sandbox end-to-end checks using actual Checkout and signed webhook delivery; local forwarding can use `stripe listen --forward-to localhost:3001/api/stripe/webhook`. Use the CLI-provided signing secret locally, not the hosted endpoint secret. Test documented Stripe success/decline/authentication scenarios. [Stripe testing guide](https://docs.stripe.com/testing).

Cloud Tasks IAM, Cloud Run restarts and real mobile saving require deployed checks. A real Gemini call costs money even with Stripe test keys; run only the bounded test authorized for the project and report its observed result and cost separately.

## 15. Operational handover

Log safe correlation IDs: request, purchase, Stripe event and job IDs; state transitions and elapsed times. Never log cookies, images, base64 bodies, API keys, full payment payloads or provider download URLs.

Monitor failed fulfillment, pending Stripe inbox records, task outbox age, jobs near deadline, unknown launches, refund holds, provider failure rate and actual cost per successful video. Track app credit refunds separately from provider billing. The initial pricing assumptions are $0.05/second for Lite 720p and 1.5% + EUR 0.25 for standard EEA Stripe cards, checked on 2026-09-17; include exchange rate, tax, hosting and free-photo costs before treating EUR 2.99 as viable. [Google pricing](https://ai.google.dev/gemini-api/docs/pricing), [Stripe Estonia pricing](https://stripe.com/en-ee/pricing).

Rollback first disables new sales and, when needed, new generation. Keep fulfillment, workers and authorized existing downloads running. Retain compatible readers for existing job/credit schema versions; do not roll back to the old public operation-name endpoints. Document pending purchases, active jobs and manual-review incidents before switching revisions.

Final handover must distinguish completed local tests, deployed sandbox checks, real-provider checks and unverified items. This file is the work specification, not evidence that those checks have already passed.

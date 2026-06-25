# Pulse AI — E2E QA Technical Validation Checklist

This checklist defines the technical functional test cases required to certify the stability and reliability of the Pulse AI platform before launching to staging or production.

---

## 1. Authentication & Session Security

| Test Case ID | Description | Input Actions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Secure route gating | Attempt direct HTTP GET to `/admin` or `/feed` while unauthenticated. | Redirects immediately to `/login`. Returns HTTP `302` or `401`. | [ ] |
| **AUTH-02** | Google OAuth callback | Complete Google consent flow. | Session cookie set securely. Redirects to `/feed` or onboarding. | [ ] |
| **AUTH-03** | Token lifecycle | Inactive session expiration check. | Session expires gracefully. Prompted to re-login without crash. | [ ] |

---

## 2. Ingestion & AI Processing Queue

| Test Case ID | Description | Input Actions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ING-01** | RSS Sync Execution | Trigger `app/ingest.trigger` event inside Inngest. | Fetches active feed sources, saves new records in `IntelligenceItem` table in `PENDING` state. | [ ] |
| **ING-02** | Gemini Analysis retry loops | Simulate API timeout during Gemini execution. | Attempt logs increment `retryCount` in DB, retry scheduled with exponential backoff. | [ ] |
| **ING-03** | Ingestion limits (Batching) | Push 50 new articles in a single RSS feed. | Ingestion caps processing at `gemini_batch_size` (default 10) to prevent token rate limits. | [ ] |
| **ING-04** | DLQ Transfer | Exceed MAX_RETRIES (3x) on an analysis task. | `analysisStatus` sets to `FAILED`, exception logged in `SystemLog`, and alert triggers. | [ ] |

---

## 3. Delivery Operations & Timezone Logic

| Test Case ID | Description | Input Actions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEL-01** | Chron scheduling checks | Trigger hourly cron execution in Inngest. | Correctly targets users matching timezone local time slots (9 AM for daily, etc.). | [ ] |
| **DEL-02** | Sequential execution | Queue 10 delivery jobs at the same time. | Concurrency locks force sequential WhatsApp delivery runs (1-by-1) to avoid API throttling. | [ ] |
| **DEL-03** | Instant Alert conditions | Ingest opportunity with score 9, matching user interests. | Bypasses schedules, immediately dispatches single-article WhatsApp notification to user. | [ ] |
| **DEL-04** | WhatsApp retry and DLQ | Disable network connectivity, fail Meta dispatches. | Log transitions status to `FAILED` in the database after retry limits expire. | [ ] |

---

## 4. Admin Observability & Management

| Test Case ID | Description | Input Actions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | Platform Health Scores | Request `/api/admin/metrics`. | Returns dynamic constituent health scores and calculates correct overall average score. | [ ] |
| **ADM-02** | DLQ Job Reprocessing | Click "Reprocess" on a failed article in the Admin Queue tab. | DB resets retry count, clears error, and dispatches new `app/analyze.article` task. | [ ] |
| **ADM-03** | Scheduler Global Pause | Toggle scheduler state to Paused in operations. | Cron check bypasses runs. Heartbeat records pause action in `SystemLog`. | [ ] |
| **ADM-04** | Webhook verification signature | Trigger mock webhook POST with an invalid SHA256 header. | Webhook blocks payload with `401 Unauthorized` status response. | [ ] |

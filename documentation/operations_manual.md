# Pulse AI — Operations & Troubleshooting Manual

This manual details runbooks, disaster recovery plans, log auditing commands, and common operational procedures required to support the Pulse AI platform in staging and production.

---

## 1. Disaster Recovery & Database Backups

While Supabase provides managed daily logical and physical database backups (with Point-in-Time Recovery enabled for enterprise instances), operators can perform manual, database-independent snapshots.

### Executing a Manual JSON Database Snapshot
1. Log in to the **Admin Dashboard** (`/admin`).
2. Go to the **Operations Controls** tab.
3. Click the **"Export Database JSON"** button.
4. The system will query the tables via Prisma, serialize the records, and trigger a download of a `.json` file containing all tables (`users`, `intelligence_items`, `delivery_logs`, `feedbacks`, `system_logs`, `system_settings`).
5. Keep these snapshots secured.

---

## 2. Global Scheduler Operations

The background scheduler checks timezone rules and dispatches user digests.

### Action: Pause All Deliveries
If the system experiences a delivery bug or Meta Cloud API issues, operators can temporarily pause the scheduler globally:
1. Open `/admin > Operations Controls` tab.
2. Under **Global System Toggles**, click **"Pause Global Scheduler"**.
3. This sets `schedulerPaused = true` in the `system_settings` table.
4. The cron task `sendScheduledDigests` will immediately skip evaluations and log the pause state to SystemLog.

### Action: Resume Deliveries
1. Open `/admin > Operations Controls` tab.
2. Click **"Resume Global Scheduler"**.
3. This sets `schedulerPaused = false`. Normal schedules resume during the next hourly cron check.

---

## 3. Log Auditing & Monitoring

System logs are printed as structured JSON lines to stdout and written to the database under the `system_logs` table for warnings and errors.

### Querying Logs via API
Operators can retrieve logs programmatically using the gated API endpoint:
```bash
# Get last 50 error logs for Gemini component
curl -H "Authorization: Bearer [token]" "https://pulse.app.co/api/admin/logs?page=1&limit=50&level=ERROR&component=GEMINI"
```

---

## 4. Troubleshooting Common Failures

### 1. Gemini API Quota Limits / Rate Throttling
* **Symptom**: Logger displays `GEMINI` component errors: `429 Resource Exhausted` or `Quota Exceeded`.
* **Impact**: Article analysis fails. PENDING items queue up.
* **Resolution**:
  1. The system automatically retries with exponential backoff.
  2. If the quota is permanently saturated, go to the Admin Operations tab and adjust rate limiting variables in the environment.
  3. Limit sync dispatch size by reducing `gemini_batch_size` in System Settings (e.g. set value to `5` instead of `10` to ingest slower).

### 2. WhatsApp Message Mismatches / Verification Delays
* **Symptom**: Deliveries stay stuck in `SENDING` or fail with error code `100` (Invalid parameter).
* **Impact**: Subscribers fail to receive OTP or digests.
* **Resolution**:
  1. Meta requires approved templates for first-contact messages. Ensure templates are approved inside Meta Business Suite.
  2. Verify that the recipient's phone number matches international format (e.g. starting with `+` and country code).
  3. Go to `Queue Monitor (DLQ)` in `/admin`, inspect the error message details on the failed delivery, resolve user phone issues, and click **"Retry Delivery"**.

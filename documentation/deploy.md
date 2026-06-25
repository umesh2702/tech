# Pulse AI — Production Deployment & Rollback Guide

This document defines the deployment architecture, configuration keys, database migration checklists, Inngest task routes, and rollback runbooks required to host Pulse AI in a staging or production environment.

---

## 1. Fresh Production Deployment Setup

Pulse AI is built as a Next.js application using NextAuth, Prisma ORM, Inngest, and PostgreSQL. It is optimized to deploy on Vercel, with backend services running on Supabase (Postgres) and Inngest Cloud.

### Step 1: Provision Infrastructure
1. **PostgreSQL Database**: Create a new project in Supabase or any managed Postgres provider. Note the database connection string.
2. **Meta Developer Application**: Create an app inside Meta Developer portal, verify your business credentials, register a phone number, and generate a Permanent System User Access Token.
3. **Google OAuth Application**: Create a Google Cloud Project, set up the OAuth Consent Screen, and generate OAuth Client ID and Secrets.
4. **Inngest Cloud**: Create an account on Inngest, link your Git repository, and secure your production Inngest Signing Key.

### Step 2: Configure Environment Variables
Set the environment variables in your hosting provider (e.g. Vercel dashboard). Refer to the **Environment Variable Reference** section below.

### Step 3: Run Initial Migrations
Generate the Prisma client and push the schema:
```bash
npx prisma generate
npx prisma migrate deploy
```

### Step 4: Build & Deploy
Deploy the Next.js bundle to Vercel:
* Build Command: `npm run build`
* Output Directory: `.next`

---

## 2. Environment Variable Reference

| Variable Name | Description | Example / Fallback |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string. Use pgpool/Supabase Transaction mode URL (`?pgbouncer=true` if required). | `postgresql://postgres:[pass]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?connection_limit=20` |
| `NEXTAUTH_SECRET` | NextAuth secure encryption string. Generate using `openssl rand -base64 32`. | `d3NhY2Fp...` |
| `NEXTAUTH_URL` | The public base URL of the hosting domain (required for NextAuth callbacks). | `https://pulse.app.co` |
| `NEXT_PUBLIC_APP_URL` | Same base URL used inside background tasks to ping API routes. | `https://pulse.app.co` |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API permanent access token. | `EAABb...` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business Phone number identifier. | `1234567890` |
| `WHATSAPP_VERIFY_TOKEN` | Arbitrary custom token configured inside Meta webhook panel to verify GET requests. | `pulse_verify_token_2026` |
| `WHATSAPP_APP_SECRET` | Meta Application secret key. Used to verify POST request payload signatures. | `a1b2c3d4e5f6...` |
| `GEMINI_API_KEY` | Google Gemini generative AI API key. | `AIzaSy...` |

---

## 3. Database Migration Procedure

All database changes must be tracked via Prisma Migrations.

### Running Migrations in Staging/Production
During deployment pipelines, execute the following command before compiling the build:
```bash
npx prisma migrate deploy
```
*Never* run `npx prisma db push` directly against production databases as it can lead to accidental data pruning. Always use `migrate deploy`.

### Schema Validation Checks
To verify schema conformity before migrations:
```bash
npx prisma validate
npx prisma migrate status
```

---

## 4. Rollback Procedure

In the event of critical failures or deployment regressions, execute the following steps:

### Code Reversion
1. Revert the git commit in your repository to the last stable release branch (e.g., `git revert [commit_id]`).
2. Trigger the Vercel deploy pipeline to build and deploy the reverted commit.

### Database Schema Rollback (If Required)
If the failed release introduced a database schema change that needs rollback:
1. Identify the failed migration name.
2. Resolve database state by marking the migration as rolled back in the Prisma migrations history table:
   ```bash
   npx prisma migrate resolve --rolled-back [failed_migration_name]
   ```
3. Re-apply the schema definition of the previous stable state from the stable codebase.

---

## 5. Inngest Production Integration

Inngest handles task scheduling and asynchronous queues.

1. **Dashboard Configuration**: Add your application's API endpoint (e.g., `https://pulse.app.co/api/inngest`) inside Inngest Cloud as an active app.
2. **Signing Key**: Configure `INNGEST_SIGNING_KEY` as a secret environment variable inside Vercel to allow secure handshake validation.
3. **Concurrency Controls**: Monitor queuing throughput and concurrency execution paths via the Inngest Cloud dashboard.

---

## 6. Troubleshooting Guide

### Issue A: Meta Webhook Fails to Deliver / Signature Error
* **Symptom**: `401 Unauthorized` in logs for `/api/whatsapp/webhook`.
* **Fix**: Confirm `WHATSAPP_APP_SECRET` matches exactly the secret key displayed inside Meta App Dashboard > Basic Settings.

### Issue B: Gemini Throttling Warnings
* **Symptom**: `GEMINI` component logs timeout warnings.
* **Fix**: The system automatically triggers exponential backoff retries. Increase `GEMINI_RATELIMIT_LIMIT` in environment variables if quota limits have been expanded.

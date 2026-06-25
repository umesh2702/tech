# Pulse AI — Meta Business Production WhatsApp Migration

This guide details the procedure to transition the Pulse AI WhatsApp Cloud API configuration from a Meta Developer Sandbox (test numbers) to a live, verified WhatsApp Business Account (WABA).

---

## 1. Prerequisites
Before migrating, ensure you have:
* A verified **Meta Business Suite Manager** account.
* A clean phone number that is **not** currently registered to any personal WhatsApp or WhatsApp Business mobile app (if it is, delete the account via the mobile app settings first).
* A valid company website and business registration documents.

---

## 2. Migration Step-by-Step

### Step 1: Create a WhatsApp Business Account (WABA)
1. Log in to the [Meta App Dashboard](https://developers.facebook.com/).
2. Select your registered **Pulse AI** app (or create a new business app).
3. Under App Products, add **WhatsApp** and link it to your verified **Meta Business Manager** account.

### Step 2: Register & Verify Your Live Phone Number
1. Inside the developers portal WhatsApp product dashboard, navigate to **API Setup**.
2. Click **Add Phone Number**.
3. Input your display name, timezone, category (e.g. Technology), and the live phone number.
4. Verify the number via SMS or voice call verification.
5. Once verified, copy the new **WhatsApp Phone Number ID** and **WhatsApp Business Account ID** displayed.

### Step 3: Set Up a Permanent System User Token
Meta's default access token expires after 24 hours. For production, generate a permanent token:
1. Log in to your **Meta Business Suite Manager** as an admin.
2. Go to **Business Settings > Users > System Users**.
3. Create a new system user with the **Admin** role.
4. Assign the system user to your App and WABA assets, granting full permissions.
5. Click **Generate New Token**. Select the app, and check the following scopes:
   * `whatsapp_business_messaging`
   * `whatsapp_business_management`
6. Copy the token and save it immediately. This is your permanent `WHATSAPP_ACCESS_TOKEN`.

### Step 4: Configure Webhooks
1. In the Developers portal under WhatsApp > **Configuration**, set the callback URL:
   `https://[your-production-url]/api/whatsapp/webhook`
2. Set the verify token to match your `WHATSAPP_VERIFY_TOKEN` env variable.
3. Under Webhook fields, subscribe to:
   * `messages` (delivers incoming messages and status updates)
4. Set the **WhatsApp App Secret** key (`WHATSAPP_APP_SECRET`) to compute HMAC signatures.

---

## 3. Template Approval Workflows
Meta requires templates for business-initiated conversations (messages sent outside the 24-hour customer service window).

1. In the WhatsApp Manager dashboard, go to **Message Templates**.
2. Create templates for:
   * **Welcome message / Number verification**: A simple transactional message confirming activation.
   * **Digest alerts**: Structured headers notifying users that their scheduled opportunities digest is ready.
3. Submit for approval (usually approved within 2-10 minutes by Meta's automated checks).
4. Update template parameters inside `/src/lib/whatsapp/client.ts` to trigger approved templates instead of raw text when sending first-contact messages if required by Meta compliance rules in your country.

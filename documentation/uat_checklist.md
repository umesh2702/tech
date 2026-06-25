# Pulse AI — User Acceptance Testing (UAT) Checklist

This checklist is designed for non-technical beta testers to validate the user experience, personalization settings, and delivery operations of Pulse AI.

---

## Tester Instructions
Follow each step sequentially. Record your results as **PASS** or **FAIL**. If a step fails, take a screenshot and submit feedback containing the failure details.

---

### Step 1: Sign In & Authentication
* **Action**:
  1. Open the homepage URL in a web browser.
  2. Click the **"Sign In with Google"** button.
  3. Enter your Google account credentials.
* **Expected Outcome**:
  * Clean redirect to the Google Consent screen.
  * Successful authentication with no errors.
  * If logging in for the first time, you must be automatically redirected to the Onboarding Flow. If you have logged in before, you should see the feed dashboard.

---

### Step 2: Onboarding Setup
* **Action**:
  1. Fill in your Full Name.
  2. Input your verified WhatsApp phone number (in international format, e.g. `+14155552671`).
  3. Select your Country and primary timezone (e.g. `Asia/Kolkata` or `America/New_York`).
  4. Select at least 3 topics of interest (e.g., AI, Funding, Developer Tools).
  5. Click **"Save Preferences"**.
* **Expected Outcome**:
  * Loading state displays during preference registration.
  * Successful redirect to the WhatsApp Number Verification screen.

---

### Step 3: WhatsApp Verification Receipt
* **Action**:
  1. Check your WhatsApp mobile application on your phone.
  2. Look for a message from the **Pulse AI** business sender number.
  3. Read the Welcome message.
  4. Click the confirmation link or enter confirmation receipt inside the Pulse AI onboarding page.
* **Expected Outcome**:
  * You should receive a welcoming message verifying your number.
  * Setting `whatsappVerified = true` must trigger on confirmation, and you are redirected to the Dashboard Feed.

---

### Step 4: Digest Delivery Setup
* **Action**:
  1. Navigate to the **Settings** page via the sidebar.
  2. Verify that your delivery schedules are active (e.g., Daily, Three-Hourly).
  3. Click **"Send Test Digest"** to simulate a scheduled delivery.
* **Expected Outcome**:
  * Within 10 seconds, you should receive a formatted WhatsApp message containing a structured digest:
    * Header: `🧠 Pulse AI`
    * Subheader: `Today's Top Opportunities`
    * Ordered top items with titles, scores, and opportunity reasons.
    * A clickable dashboard link at the bottom.

---

### Step 5: Receiving an Instant Alert
* **Action**:
  1. Check if you receive a standalone WhatsApp alert when high-scoring opportunities are detected (opp score >= 9, founder score >= 8).
  2. (Administrators can mock this by uploading an article with a score of 9 matching your interests).
* **Expected Outcome**:
  * You receive a clean, immediate notification containing the single high-opportunity article description with details on what happened and why it matters.

---

### Step 6: Bookmarking Opportunities
* **Action**:
  1. On the Dashboard Feed, locate a compelling opportunity card.
  2. Click the **Bookmark / Save icon**.
  3. Navigate to the **Bookmarks** page in the sidebar.
* **Expected Outcome**:
  * The opportunity is successfully saved.
  * Opening `/saved` displays the bookmarked card.
  * Unbookmarking removes the card from `/saved` dynamically.

---

### Step 7: Searching & Filtering
* **Action**:
  1. Navigate to the Dashboard Feed `/feed`.
  2. Enter a specific keyword in the Search Bar (e.g., "Google" or "NVIDIA").
  3. Click the category tag filter (e.g., "AI").
* **Expected Outcome**:
  * The feed dynamically filters, displaying only matching opportunities with no page reload lags.

---

### Step 8: Submitting Beta Feedback
* **Action**:
  1. Locate the **Feedback Card** on the dashboard sidebar or in the footer.
  2. Select a star rating (1 to 5).
  3. Type a text comment (e.g. "Digest was very formatted, thank you!").
  4. Click **"Submit Feedback"**.
* **Expected Outcome**:
  * Success notification displays.
  * Feedback widget switches to completed/success state.

---

### Step 9: Session Persistence on Logout/Login
* **Action**:
  1. Click **"Logout"** in the sidebar.
  2. Confirm you are logged out.
  3. Navigate back to `/feed` URL directly.
  4. Log in again.
* **Expected Outcome**:
  * Accessing `/feed` directly while logged out redirects you to the login screen.
  * Re-authenticating returns you to the dashboard feed without losing saved settings or history records.

// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Service Test Suite
// Run: npx ts-node --skipProject scripts/test-whatsapp.ts
// ─────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-require-imports */

// ── Mock fetch before any module loads ───────

type MockFn = (url: string, opts: unknown) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

let _mockFetch: MockFn | null = null;

// Polyfill global fetch for the test environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = async (url: string, opts: unknown) => {
  if (_mockFetch) return _mockFetch(url, opts);
  throw new Error("fetch() not mocked in test");
};

// ── Test Runner ───────────────────────────────

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`       → ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expect<T>(actual: T): any {
  return {
    toBe: (expected: T) => {
      if (actual !== expected)
        throw new Error(`Expected "${expected}" but got "${actual}"`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got "${actual}"`);
    },
    toBeGreaterThan: (n: number) => {
      if ((actual as number) <= n)
        throw new Error(`Expected ${actual} > ${n}`);
    },
    toBeInstanceOf: (Cls: unknown) => {
      if (!(actual instanceof (Cls as new () => unknown)))
        throw new Error(`Expected ${(Cls as { name: string }).name}, got ${typeof actual}`);
    },
    toEqual: (expected: unknown) => {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) throw new Error(`Expected ${e} but got ${a}`);
    },
  };
}

function mockSuccess(id = "wamid.TEST123") {
  _mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      messaging_product: "whatsapp",
      contacts: [{ input: "918121693113", wa_id: "918121693113" }],
      messages: [{ id }],
    }),
  });
}

function mockError(status: number, code: number, message: string) {
  _mockFetch = async () => ({
    ok: false,
    status,
    json: async () => ({
      error: { message, type: "OAuthException", code, fbtrace_id: "trace-test" },
    }),
  });
}

// ── Main ──────────────────────────────────────

async function executeUnitTests() {
  // Set required env vars before loading modules
  process.env.WHATSAPP_PHONE_NUMBER_ID = "1187158324481697";
  process.env.WHATSAPP_ACCESS_TOKEN = "test_token_xxx";
  process.env.WHATSAPP_API_VERSION = "v21.0";
  process.env.NEXT_PUBLIC_APP_URL = "https://pulse.ai";

  // Direct relative imports (no @/ alias needed)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const types = require("../src/lib/whatsapp/types");
  const { WhatsAppValidationError, WhatsAppApiError } = types;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { validatePhone, normalizePhone, sendTemplate } = require("../src/lib/whatsapp/templates");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { formatWelcome, formatDigest, formatSubscription, formatPreferences } = require("../src/lib/whatsapp/formatter");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WHATSAPP_TEMPLATES, KNOWN_TEMPLATE_NAMES } = require("../src/lib/whatsapp/constants");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TEMPLATE_REGISTRY } = require("../src/lib/whatsapp/registry");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Pulse AI — WhatsApp Service Test Suite");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── Phone Validation ──────────────────────────

  console.log("📱 Phone Validation\n");

  await test("normalizePhone strips + prefix", async () => {
    expect(normalizePhone("+918121693113")).toBe("918121693113");
  });

  await test("normalizePhone strips spaces and dashes", async () => {
    expect(normalizePhone("+91-812-169-3113")).toBe("918121693113");
  });

  await test("validatePhone accepts valid E.164 number", async () => {
    expect(validatePhone("+918121693113")).toBe("918121693113");
  });

  await test("validatePhone rejects alphabetic string", async () => {
    try {
      validatePhone("abc");
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppValidationError);
    }
  });

  await test("validatePhone rejects empty string", async () => {
    try {
      validatePhone("");
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppValidationError);
    }
  });

  await test("validatePhone rejects 3-digit number", async () => {
    try {
      validatePhone("123");
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppValidationError);
    }
  });

  // ── Formatters ────────────────────────────────

  console.log("\n📝 Formatters\n");

  await test("formatWelcome returns body component with first name", async () => {
    const components = formatWelcome({ userName: "Umesh Daga" });
    expect(components.length).toBeGreaterThan(0);
    expect(components[0].type).toBe("body");
    expect(components[0].parameters[0].text).toBe("Umesh");
  });

  await test("formatWelcome handles single-word name", async () => {
    const components = formatWelcome({ userName: "Admin" });
    expect(components[0].parameters[0].text).toBe("Admin");
  });

  await test("formatDigest returns 4 body parameters", async () => {
    const components = formatDigest({
      digestLabel: "Morning Digest",
      itemCount: 5,
      summary: "AI news summary.",
      appUrl: "https://pulse.ai",
    });
    expect(components[0].parameters.length).toBe(4);
    expect(components[0].parameters[0].text).toBe("Morning Digest");
    expect(components[0].parameters[1].text).toBe("5");
  });

  await test("formatDigest truncates summary to 150 chars", async () => {
    const long = "A".repeat(200);
    const components = formatDigest({
      digestLabel: "Daily Digest",
      itemCount: 3,
      summary: long,
      appUrl: "https://pulse.ai",
    });
    expect(components[0].parameters[2].text.length).toBe(150);
  });

  await test("formatSubscription maps status to label", async () => {
    const components = formatSubscription({ planName: "Pro", status: "activated" });
    expect(components[0].parameters[0].text).toBe("Pro");
    expect(components[0].parameters[1].text).toBe("activated");
  });

  await test("formatSubscription maps trial_started correctly", async () => {
    const components = formatSubscription({ planName: "Founder", status: "trial_started" });
    expect(components[0].parameters[1].text).toBe("trial started");
  });

  await test("formatPreferences returns topics parameter", async () => {
    const components = formatPreferences({ topicsFormatted: "AI, Startups" });
    expect(components[0].parameters[0].text).toBe("AI, Startups");
  });

  // ── Template Registry ─────────────────────────

  console.log("\n📋 Template Registry\n");

  await test("all 4 templates are registered", async () => {
    expect(Object.keys(TEMPLATE_REGISTRY).length).toBe(4);
  });

  await test("KNOWN_TEMPLATE_NAMES contains all 4 templates", async () => {
    expect(KNOWN_TEMPLATE_NAMES.size).toBe(4);
  });

  await test("pulse_welcome has formatter and description", async () => {
    const entry = TEMPLATE_REGISTRY[WHATSAPP_TEMPLATES.WELCOME];
    expect(typeof entry.formatter).toBe("function");
    expect(typeof entry.description).toBe("string");
  });

  // ── sendTemplate — Success Cases ──────────────

  console.log("\n🚀 sendTemplate — Success Cases\n");

  await test("Welcome template → returns messageId", async () => {
    mockSuccess("wamid.WELCOME001");
    const messageId = await sendTemplate({
      userId: "u1",
      phone: "918121693113",
      template: WHATSAPP_TEMPLATES.WELCOME,
      components: formatWelcome({ userName: "Umesh" }),
    });
    expect(messageId).toBe("wamid.WELCOME001");
  });

  await test("Digest template → returns messageId", async () => {
    mockSuccess("wamid.DIGEST001");
    const messageId = await sendTemplate({
      userId: "u1",
      phone: "918121693113",
      template: WHATSAPP_TEMPLATES.DIGEST_READY,
      components: formatDigest({ digestLabel: "Daily Digest", itemCount: 5, summary: "Summary", appUrl: "https://pulse.ai" }),
    });
    expect(messageId).toBe("wamid.DIGEST001");
  });

  await test("Preferences template → returns messageId", async () => {
    mockSuccess("wamid.PREFS001");
    const messageId = await sendTemplate({
      userId: "u1",
      phone: "918121693113",
      template: WHATSAPP_TEMPLATES.PREFERENCES_UPDATED,
      components: formatPreferences({ topicsFormatted: "AI, Funding" }),
    });
    expect(messageId).toBe("wamid.PREFS001");
  });

  await test("Subscription template → returns messageId", async () => {
    mockSuccess("wamid.SUB001");
    const messageId = await sendTemplate({
      userId: "u1",
      phone: "918121693113",
      template: WHATSAPP_TEMPLATES.SUBSCRIPTION_UPDATED,
      components: formatSubscription({ planName: "Founder", status: "upgraded" }),
    });
    expect(messageId).toBe("wamid.SUB001");
  });

  // ── sendTemplate — Validation Failures ────────

  console.log("\n🚫 sendTemplate — Validation Failures\n");

  await test("Invalid phone → WhatsAppValidationError", async () => {
    try {
      await sendTemplate({
        userId: "u1",
        phone: "abc",
        template: WHATSAPP_TEMPLATES.WELCOME,
        components: formatWelcome({ userName: "Test" }),
      });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppValidationError);
    }
  });

  await test("Unknown template name → WhatsAppValidationError", async () => {
    try {
      await sendTemplate({
        userId: "u1",
        phone: "918121693113",
        template: "pulse_nonexistent",
        components: formatWelcome({ userName: "Test" }),
      });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppValidationError);
    }
  });

  await test("Empty components → WhatsAppValidationError", async () => {
    try {
      await sendTemplate({
        userId: "u1",
        phone: "918121693113",
        template: WHATSAPP_TEMPLATES.WELCOME,
        components: [],
      });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppValidationError);
    }
  });

  // ── Retry Strategy ────────────────────────────

  console.log("\n🔄 Retry Strategy\n");

  await test("Meta 500 → retryable WhatsAppApiError", async () => {
    mockError(500, 131000, "Internal server error");
    try {
      await sendTemplate({
        userId: "u1", phone: "918121693113",
        template: WHATSAPP_TEMPLATES.WELCOME,
        components: formatWelcome({ userName: "Test" }),
      });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppApiError);
      const apiErr = err as { isRetryable: boolean; statusCode: number };
      expect(apiErr.isRetryable).toBe(true);
      expect(apiErr.statusCode).toBe(500);
    }
  });

  await test("Meta 429 → retryable WhatsAppApiError", async () => {
    mockError(429, 131056, "Too many requests");
    try {
      await sendTemplate({
        userId: "u1", phone: "918121693113",
        template: WHATSAPP_TEMPLATES.WELCOME,
        components: formatWelcome({ userName: "Test" }),
      });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppApiError);
      expect((err as { isRetryable: boolean }).isRetryable).toBe(true);
    }
  });

  await test("Meta 401 → non-retryable WhatsAppApiError", async () => {
    mockError(401, 190, "Invalid OAuth access token");
    try {
      await sendTemplate({
        userId: "u1", phone: "918121693113",
        template: WHATSAPP_TEMPLATES.WELCOME,
        components: formatWelcome({ userName: "Test" }),
      });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppApiError);
      const apiErr = err as { isRetryable: boolean; statusCode: number };
      expect(apiErr.isRetryable).toBe(false);
      expect(apiErr.statusCode).toBe(401);
    }
  });

  await test("Meta 400 → non-retryable WhatsAppApiError", async () => {
    mockError(400, 131008, "Required parameter is missing");
    try {
      await sendTemplate({
        userId: "u1", phone: "918121693113",
        template: WHATSAPP_TEMPLATES.WELCOME,
        components: formatWelcome({ userName: "Test" }),
      });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppApiError);
      expect((err as { isRetryable: boolean }).isRetryable).toBe(false);
    }
  });

  await test("Meta 403 → non-retryable WhatsAppApiError", async () => {
    mockError(403, 10, "Permission denied");
    try {
      await sendTemplate({
        userId: "u1", phone: "918121693113",
        template: WHATSAPP_TEMPLATES.WELCOME,
        components: formatWelcome({ userName: "Test" }),
      });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WhatsAppApiError);
      expect((err as { isRetryable: boolean }).isRetryable).toBe(false);
    }
  });

  // ── Results ───────────────────────────────────

  const total = passed + failed;
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("  🎉 All tests passed!");
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(failed > 0 ? 1 : 0);
}

executeUnitTests().catch((err) => {
  console.error("\n💥 Test runner crashed:", err);
  process.exit(1);
});

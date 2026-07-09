import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendTemplate } from "@/lib/whatsapp/templates";
import { getRegistryEntry } from "@/lib/whatsapp/registry";
import { KNOWN_TEMPLATE_NAMES } from "@/lib/whatsapp/constants";
import type { WhatsAppTemplateName } from "@/lib/whatsapp/constants";

// ─────────────────────────────────────────────
// POST /api/admin/send-template
//
// Development endpoint to test any approved WhatsApp template
// without modifying application code.
//
// Body:
//   { "template": "pulse_digest_ready", "phone": "918121693113" }
//
// Optional overrides:
//   { "language": "en_US", "params": ["value1", "value2"] }
// ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; role?: string; name?: string | null } | undefined;

    if (!sessionUser?.id || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { template, phone, language, params } = body as {
      template: string;
      phone: string;
      language?: string;
      params?: string[];
    };

    // Validate required fields
    if (!template || !phone) {
      return NextResponse.json(
        {
          error: "Both 'template' and 'phone' are required.",
          example: {
            template: "pulse_digest_ready",
            phone: "918121693113",
          },
          registeredTemplates: Array.from(KNOWN_TEMPLATE_NAMES),
        },
        { status: 400 }
      );
    }

    // Validate template name
    if (!KNOWN_TEMPLATE_NAMES.has(template)) {
      return NextResponse.json(
        {
          error: `Unknown template: "${template}"`,
          registeredTemplates: Array.from(KNOWN_TEMPLATE_NAMES),
        },
        { status: 400 }
      );
    }

    const registryEntry = getRegistryEntry(template);

    // If custom params were provided, build a raw body component for testing
    // Otherwise, build a minimal test payload using the registry formatter
    let components;
    if (params && Array.isArray(params) && params.length > 0) {
      // Raw parameter override for testing purposes
      components = [
        {
          type: "body" as const,
          parameters: params.map((text) => ({ type: "text" as const, text })),
        },
      ];
    } else {
      // Use the registered formatter with a test data set
      const testDataMap: Record<string, unknown> = {
        pulse_welcome: { userName: sessionUser.name || "Admin" },
        pulse_digest_ready: {
          digestLabel: "Daily Digest",
          itemCount: 3,
          summary: "Test summary of today's top intelligence items.",
          appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        },
        pulse_subscription_up: { planName: "Pro", status: "activated" },
      };

      const testData = testDataMap[template];
      if (!testData) {
        return NextResponse.json(
          { error: `No test data configured for template: "${template}". Provide custom params instead.` },
          { status: 400 }
        );
      }

      components = registryEntry.formatter(testData as never);
    }

    const messageId = await sendTemplate({
      userId: sessionUser.id,
      phone,
      template: template as WhatsAppTemplateName,
      components,
      language: language ?? registryEntry.language,
    });

    return NextResponse.json({
      success: true,
      template,
      phone,
      messageId,
      description: registryEntry.description,
      componentsUsed: components,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send template";
    console.error("[Admin] send-template failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // Discovery endpoint — list all registered templates
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    if (!sessionUser?.id || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { TEMPLATE_REGISTRY } = await import("@/lib/whatsapp/registry");

    const templates = Object.entries(TEMPLATE_REGISTRY).map(([name, entry]) => ({
      name,
      description: entry.description,
      language: entry.language,
    }));

    return NextResponse.json({ templates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

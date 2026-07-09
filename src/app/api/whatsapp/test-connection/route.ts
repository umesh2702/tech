import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendWelcome } from "@/lib/whatsapp/sender";

// Tests the Meta API connection using the pulse_welcome template.
// This is the canonical connection test endpoint.

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const messageId = await sendWelcome(
      session.user.id,
      phone,
      session.user.name || "there"
    );

    return NextResponse.json({
      success: true,
      messageId,
      template: "pulse_welcome",
      message: "WhatsApp API connection is working correctly.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    console.error("Test connection failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

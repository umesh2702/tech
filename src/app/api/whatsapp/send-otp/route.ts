import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Send welcome/test message via WhatsApp
    await sendWhatsAppMessage({
      to: phone,
      text: `🧠 *Welcome to Pulse AI!*\n\nThis is a test message to verify your WhatsApp delivery channel.\n\nPlease return to the onboarding page and confirm receipt to complete verification.`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Send welcome message failed:", error);
    return NextResponse.json({ error: error.message || "Failed to send welcome message" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateDigest } from "@/lib/whatsapp/digest";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || !user.whatsappNumber || !user.whatsappVerified) {
      return NextResponse.json({ error: "Please connect and verify a WhatsApp number first." }, { status: 400 });
    }

    // Generate daily digest format
    const digest = await generateDigest(user.id, "DAILY");

    if (!digest || digest.itemIds.length === 0) {
      return NextResponse.json({ 
        error: "No matching or undelivered opportunities found for your selected interests.",
        hint: "Reset delivery history or ingest new articles first."
      }, { status: 400 });
    }

    const metaResult = await sendWhatsAppMessage({
      to: user.whatsappNumber,
      text: `🧪 *Pulse AI — Test Digest*\n\n${digest.text}`
    });

    return NextResponse.json({
      success: true,
      message: "Test digest successfully dispatched!",
      meta: metaResult
    });
  } catch (error: any) {
    console.error("Test digest failed:", error);
    return NextResponse.json({ error: error.message || "Failed to send test digest." }, { status: 500 });
  }
}

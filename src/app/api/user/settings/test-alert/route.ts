import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendDigest } from "@/lib/whatsapp/sender";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.whatsappNumber || !user.whatsappVerified) {
      return NextResponse.json(
        { error: "Please connect and verify a WhatsApp number first." },
        { status: 400 }
      );
    }

    // Find the highest-scoring completed item for the test
    const item = await prisma.intelligenceItem.findFirst({
      where: { analysisStatus: "COMPLETED" },
      orderBy: { opportunityScore: "desc" },
    });

    if (!item) {
      return NextResponse.json(
        { error: "No completed opportunities found in the database to send a test alert." },
        { status: 400 }
      );
    }

    // Send via pulse_digest_ready template (instant alert variant)
    const summary = item.whyItMatters || item.opportunity || "High-opportunity item detected.";
    const messageId = await sendDigest(
      user.id,
      user.whatsappNumber,
      "Instant Alert",
      1,
      summary
    );

    return NextResponse.json({
      success: true,
      message: "Test alert (pulse_digest_ready template) successfully dispatched!",
      messageId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send test alert.";
    console.error("Test alert failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

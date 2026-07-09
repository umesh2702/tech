import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateDigest, generateAIGeneratedSummary } from "@/lib/whatsapp/digest";
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

    const digest = await generateDigest(user.id, "DAILY");

    if (!digest || digest.itemIds.length === 0) {
      return NextResponse.json(
        {
          error: "No matching or undelivered opportunities found for your selected interests.",
          hint: "Reset delivery history or ingest new articles first.",
        },
        { status: 400 }
      );
    }

    const messageId = await sendDigest(
      user.id,
      user.whatsappNumber,
      "Daily Digest",
      digest.itemIds.length,
      digest.text.substring(0, 150)
    );

    return NextResponse.json({
      success: true,
      message: "Test digest (pulse_digest_ready template) successfully dispatched!",
      messageId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send test digest.";
    console.error("Test digest failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

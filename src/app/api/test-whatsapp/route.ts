import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { formatDigestItem } from "@/lib/whatsapp/digest";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Fetch the highest scoring IntelligenceItem
    const item = await prisma.intelligenceItem.findFirst({
      where: { analysisStatus: "COMPLETED" },
      orderBy: [
        { opportunityScore: "desc" },
        { founderScore: "desc" },
        { publishedAt: "desc" }
      ],
    });

    if (!item) {
      return NextResponse.json({ error: "No analyzed items available to send" }, { status: 404 });
    }

    const header = `🚨 *Pulse AI Delivery Test*\n\n`;
    const body = formatDigestItem(item);

    // Find the first user to associate the test log with
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "No user found in database to associate log" }, { status: 400 });
    }

    // Create log BEFORE sending (QUEUED)
    const log = await prisma.deliveryLog.create({
      data: {
        userId: user.id,
        whatsappNumber: phone,
        digestType: "DAILY",
        status: "QUEUED",
        scheduledAt: new Date(),
      }
    });

    let result;
    try {
      result = await sendWhatsAppMessage({
        to: phone,
        text: header + body,
      });

      const messageId = result.messages?.[0]?.id || result.wamid || null;

      // Update to SENT
      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          messageId,
        }
      });
    } catch (sendError: any) {
      // Parse the custom error we threw in client.ts
      let parsedError = sendError.message;
      try {
        parsedError = JSON.parse(sendError.message);
      } catch (e) {
        // Not JSON
      }

      // Update to FAILED
      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorMessage: typeof parsedError === "string" ? parsedError : JSON.stringify(parsedError),
        }
      });

      return NextResponse.json({
        error: "Failed to send to Meta API",
        metaDetails: parsedError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: item.title,
      deliveryLogId: log.id,
      messageId: result.messages?.[0]?.id || result.wamid || null,
      metaDetails: result
    });
  } catch (error: any) {
    console.error("Test delivery failed:", error);
    return NextResponse.json({ error: error.message || "Failed to send test message" }, { status: 500 });
  }
}

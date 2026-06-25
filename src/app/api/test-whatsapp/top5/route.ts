import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateDigest } from "@/lib/whatsapp/digest";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // 1. Find user by phone, or fall back to first user to auto-configure
    let user = await prisma.user.findFirst({
      where: { whatsappNumber: phone }
    });

    if (!user) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: "No users found in database to execute test" }, { status: 404 });
      }

      // Update preferences directly on the first user
      user = await prisma.user.update({
        where: { id: firstUser.id },
        data: {
          whatsappNumber: phone,
          whatsappVerified: true,
          interests: ["AI", "STARTUPS", "DEVELOPER_TOOLS", "CYBERSECURITY", "BIG_TECH", "RESEARCH", "PRODUCT_LAUNCHES", "FUNDING"],
        }
      });
    }

    // 2. Generate weighted top 5 digest
    const digest = await generateDigest(user.id, "DAILY");

    if (!digest || digest.itemIds.length === 0) {
      return NextResponse.json({ 
        error: "No matching or undelivered intelligence items available to send",
        hint: "All items might have already been delivered. Reset delivery logs or process new PENDING articles."
      }, { status: 404 });
    }

    // 3. Create log BEFORE sending (QUEUED)
    const log = await prisma.deliveryLog.create({
      data: {
        userId: user.id,
        whatsappNumber: phone,
        digestType: "DAILY",
        status: "QUEUED",
        scheduledAt: new Date(),
        items: {
          create: digest.itemIds.map(id => ({ intelligenceItemId: id }))
        }
      }
    });

    // 4. Send via Meta API
    let metaResult;
    try {
      metaResult = await sendWhatsAppMessage({
        to: phone,
        text: digest.text,
      });

      const messageId = metaResult.messages?.[0]?.id || metaResult.wamid || null;

      // Update to SENT
      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          messageId,
        }
      });

      return NextResponse.json({
        success: true,
        mode: "top5",
        deliveryLogId: log.id,
        messageId,
        itemsSentCount: digest.itemIds.length,
        contentSent: digest.text,
        metaDetails: metaResult
      });

    } catch (sendError: any) {
      let parsedError = sendError.message;
      try {
        parsedError = JSON.parse(sendError.message);
      } catch (e) {}

      // Update to FAILED
      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorMessage: typeof parsedError === "string" ? parsedError : JSON.stringify(parsedError),
        }
      });

      return NextResponse.json({
        success: false,
        error: "Failed to send to Meta API",
        contentAttempted: digest.text,
        metaDetails: parsedError
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error("Top 5 test delivery failed:", error);
    return NextResponse.json({ error: error.message || "Failed to process test request" }, { status: 500 });
  }
}

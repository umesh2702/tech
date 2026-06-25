import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

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

    let user = await prisma.user.findFirst({
      where: { whatsappNumber: phone }
    });

    if (!user) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: "No users found in database to execute test" }, { status: 404 });
      }

      user = await prisma.user.update({
        where: { id: firstUser.id },
        data: {
          whatsappNumber: phone,
          whatsappVerified: true,
          interests: ["AI", "STARTUPS", "DEVELOPER_TOOLS", "CYBERSECURITY", "BIG_TECH", "RESEARCH", "PRODUCT_LAUNCHES", "FUNDING"],
        }
      });
    }

    const item = await prisma.intelligenceItem.findFirst({
      where: {
        analysisStatus: "COMPLETED",
        opportunityScore: { gte: 9 },
        founderScore: { gte: 8 },
      },
      orderBy: [
        { opportunityScore: "desc" },
        { founderScore: "desc" },
        { publishedAt: "desc" }
      ]
    });

    if (!item) {
      return NextResponse.json({ 
        error: "No high-scoring items (Opportunity Score >= 9 AND Founder Score >= 8) found in the database.",
        hint: "Run process-batch.ts background script to analyze and score more items first."
      }, { status: 404 });
    }

    const log = await prisma.deliveryLog.create({
      data: {
        userId: user.id,
        whatsappNumber: phone,
        digestType: "INSTANT",
        status: "QUEUED",
        scheduledAt: new Date(),
        items: {
          create: [{ intelligenceItemId: item.id }]
        }
      }
    });

    const header = `🚨 *Pulse AI Instant Alert* (Score: ${item.opportunityScore}/10)\n\n`;
    const body = `
*${item.title}*

⭐ *Opportunity:* ${item.opportunityScore}/10
🚀 *Founder Fit:* ${item.founderScore || 0}/10

*Why it matters:*
_${item.whyItMatters || "N/A"}_

*Founder opportunity:*
${item.opportunity || "N/A"}

_Why you received this:_
• Matches your interests
• High Opportunity Score

_Dashboard:_
${APP_URL}/dashboard/item/${item.id}
`.trim();

    const textToSend = header + body;

    let metaResult;
    try {
      metaResult = await sendWhatsAppMessage({
        to: phone,
        text: textToSend,
      });

      const messageId = metaResult.messages?.[0]?.id || metaResult.wamid || null;

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
        mode: "instant",
        deliveryLogId: log.id,
        messageId,
        itemSentTitle: item.title,
        contentSent: textToSend,
        metaDetails: metaResult
      });

    } catch (sendError: any) {
      let parsedError = sendError.message;
      try {
        parsedError = JSON.parse(sendError.message);
      } catch (e) {}

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
        contentAttempted: textToSend,
        metaDetails: parsedError
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error("Instant test delivery failed:", error);
    return NextResponse.json({ error: error.message || "Failed to process test request" }, { status: 500 });
  }
}

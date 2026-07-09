import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendDigest } from "@/lib/whatsapp/sender";
import { DeliveryStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    if (!sessionUser?.id || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    let user = await prisma.user.findFirst({ where: { whatsappNumber: phone } });
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
        },
      });
    }

    const item = await prisma.intelligenceItem.findFirst({
      where: { analysisStatus: "COMPLETED", opportunityScore: { gte: 9 }, founderScore: { gte: 8 } },
      orderBy: [{ opportunityScore: "desc" }, { founderScore: "desc" }, { publishedAt: "desc" }],
    });

    if (!item) {
      return NextResponse.json(
        { error: "No high-scoring items (Opp >= 9 AND Founder >= 8) found.", hint: "Run process-batch.ts first." },
        { status: 404 }
      );
    }

    const log = await prisma.deliveryLog.create({
      data: {
        userId: user.id,
        whatsappNumber: phone,
        digestType: "INSTANT",
        status: DeliveryStatus.QUEUED,
        templateName: "pulse_digest_ready",
        scheduledAt: new Date(),
        items: { create: [{ intelligenceItemId: item.id }] },
      },
    });

    try {
      const summary = item.whyItMatters || item.opportunity || item.title;
      const messageId = await sendDigest(user.id, phone, "Instant Alert", 1, summary);
      await prisma.deliveryLog.update({ where: { id: log.id }, data: { status: DeliveryStatus.SENT, sentAt: new Date(), messageId } });
      return NextResponse.json({ success: true, mode: "instant", deliveryLogId: log.id, messageId, itemSentTitle: item.title, template: "pulse_digest_ready" });
    } catch (sendError: unknown) {
      const errorMessage = sendError instanceof Error ? sendError.message : "Unknown send error";
      await prisma.deliveryLog.update({ where: { id: log.id }, data: { status: DeliveryStatus.FAILED, errorMessage } });
      return NextResponse.json({ success: false, error: "Failed to send template", errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process test request";
    console.error("Admin instant test delivery failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

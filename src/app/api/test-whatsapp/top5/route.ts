import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateDigest } from "@/lib/whatsapp/digest";
import { sendDigest } from "@/lib/whatsapp/sender";
import { DeliveryStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    if (!sessionUser?.id || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findFirst({ where: { whatsappNumber: phone } });
    if (!user) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json(
          { error: "No users found in database to execute test" },
          { status: 404 }
        );
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

    const digest = await generateDigest(user.id, "DAILY");
    if (!digest || digest.itemIds.length === 0) {
      return NextResponse.json(
        {
          error: "No matching or undelivered intelligence items available to send",
          hint: "All items might have already been delivered. Reset delivery logs or process new PENDING articles.",
        },
        { status: 404 }
      );
    }

    const log = await prisma.deliveryLog.create({
      data: {
        userId: user.id,
        whatsappNumber: phone,
        digestType: "DAILY",
        status: DeliveryStatus.QUEUED,
        templateName: "pulse_digest_ready",
        scheduledAt: new Date(),
        items: { create: digest.itemIds.map((id) => ({ intelligenceItemId: id })) },
      },
    });

    try {
      const messageId = await sendDigest(
        user.id,
        phone,
        "Daily Digest",
        digest.itemIds.length,
        digest.text.substring(0, 150)
      );

      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: { status: DeliveryStatus.SENT, sentAt: new Date(), messageId },
      });

      return NextResponse.json({
        success: true,
        mode: "top5",
        deliveryLogId: log.id,
        messageId,
        itemsSentCount: digest.itemIds.length,
        template: "pulse_digest_ready",
      });
    } catch (sendError: unknown) {
      const errorMessage =
        sendError instanceof Error ? sendError.message : "Unknown send error";

      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: { status: DeliveryStatus.FAILED, errorMessage },
      });

      return NextResponse.json(
        { success: false, error: "Failed to send template", errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process test request";
    console.error("Top 5 test delivery failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

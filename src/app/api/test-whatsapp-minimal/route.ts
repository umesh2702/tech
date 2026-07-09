import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcome } from "@/lib/whatsapp/sender";
import { DeliveryStatus } from "@prisma/client";

// Minimal connection test — uses pulse_welcome template
// to verify the Meta API connection is working correctly.

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

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { error: "No user found in database to associate log" },
        { status: 400 }
      );
    }

    const log = await prisma.deliveryLog.create({
      data: {
        userId: user.id,
        whatsappNumber: phone,
        digestType: "DAILY",
        status: DeliveryStatus.QUEUED,
        templateName: "pulse_welcome",
        scheduledAt: new Date(),
      },
    });

    try {
      const messageId = await sendWelcome(user.id, phone, user.name || "Admin");

      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: { status: DeliveryStatus.SENT, sentAt: new Date(), messageId },
      });

      return NextResponse.json({
        success: true,
        mode: "minimal",
        deliveryLogId: log.id,
        messageId,
        template: "pulse_welcome",
      });
    } catch (sendError: unknown) {
      const errorMessage =
        sendError instanceof Error ? sendError.message : "Unknown error";

      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: { status: DeliveryStatus.FAILED, errorMessage },
      });

      return NextResponse.json(
        { error: "Failed to send template", errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send minimal test message";
    console.error("Minimal test delivery failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

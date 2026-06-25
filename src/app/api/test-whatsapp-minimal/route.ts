import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

    // Completely plain text: No emojis, no markdown, no URLs.
    const messageBody = "Pulse AI test message";

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

    const result = await sendWhatsAppMessage({
      to: phone,
      text: messageBody,
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

    return NextResponse.json({
      success: true,
      mode: "minimal",
      deliveryLogId: log.id,
      messageId,
      metaDetails: result
    });
  } catch (error: any) {
    console.error("Minimal test delivery failed:", error);
    
    // Parse custom error from client.ts if available
    let parsedError = error.message;
    try {
      parsedError = JSON.parse(error.message);
    } catch (e) {
      // Ignore
    }
    
    return NextResponse.json({ 
      error: "Failed to send minimal test message", 
      details: parsedError 
    }, { status: 500 });
  }
}

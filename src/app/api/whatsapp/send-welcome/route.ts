import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcome } from "@/lib/whatsapp/sender";
import { normalizePhone, validatePhone } from "@/lib/whatsapp/templates";
import { WhatsAppValidationError, WhatsAppApiError } from "@/lib/whatsapp/types";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const sessionUser = session?.user;

    if (!sessionUser?.id || !sessionUser?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    // Validate and format phone number
    let formattedPhone: string;
    try {
      formattedPhone = validatePhone(phone);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Invalid phone number format." },
        { status: 400 }
      );
    }

    // Attempt to send the welcome template FIRST
    let messageId: string;
    try {
      const userName = sessionUser.name || sessionUser.email.split("@")[0] || "there";
      messageId = await sendWelcome(sessionUser.id, formattedPhone, userName);
    } catch (err: any) {
      await logger.error("WHATSAPP", `Failed to send welcome message to ${formattedPhone}`, err);
      
      if (err instanceof WhatsAppValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      
      if (err instanceof WhatsAppApiError) {
        return NextResponse.json({ 
          error: "Failed to deliver WhatsApp message. Please check the number and try again.",
          details: err.message
        }, { status: err.statusCode || 500 });
      }
      
      return NextResponse.json({ error: "Failed to send welcome message. Please try again later." }, { status: 500 });
    }

    // Only update the database if the message was successfully dispatched
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        whatsappNumber: formattedPhone,
        whatsappVerified: true, // We auto-verify since the user received the test message and clicked continue
      },
    });

    await logger.info("WHATSAPP", `User ${sessionUser.id} connected WhatsApp number: ${formattedPhone}`);

    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error: any) {
    console.error("[send-welcome] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

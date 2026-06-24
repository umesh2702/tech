import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate old OTPs for this phone
    await prisma.otpCode.deleteMany({
      where: { phone },
    });

    // Save new OTP (expires in 10 minutes)
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send via WhatsApp
    await sendWhatsAppMessage({
      to: phone,
      text: `Your Pulse AI verification code is: *${code}*\n\nThis code will expire in 10 minutes.`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Send OTP failed:", error);
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}

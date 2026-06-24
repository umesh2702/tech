import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });
    }

    // Find the OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        code,
      },
    });

    if (!otp) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (otp.expiresAt < new Date()) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    // Valid OTP! Update user preferences
    await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      update: {
        whatsappNumber: phone,
        whatsappVerified: true,
      },
      create: {
        userId: session.user.id,
        whatsappNumber: phone,
        whatsappVerified: true,
      },
    });

    // Delete the used OTP
    await prisma.otpCode.delete({
      where: { id: otp.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify OTP failed:", error);
    return NextResponse.json({ error: error.message || "Failed to verify OTP" }, { status: 500 });
  }
}

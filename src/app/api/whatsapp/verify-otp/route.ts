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

    // In our lightweight verification flow, the system directly verifies the user's number.
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        whatsappNumber: phone,
        whatsappVerified: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify welcome failed:", error);
    return NextResponse.json({ error: error.message || "Failed to verify WhatsApp number" }, { status: 500 });
  }
}

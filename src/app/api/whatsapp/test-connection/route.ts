import { NextResponse } from "next/server";
import { auth } from "@/auth";
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

    await sendWhatsAppMessage({
      to: phone,
      text: "👋 Hello from Pulse AI! Your Meta WhatsApp Cloud API connection is successful.",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Test connection failed:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}

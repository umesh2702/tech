import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || !user.whatsappNumber || !user.whatsappVerified) {
      return NextResponse.json({ error: "Please connect and verify a WhatsApp number first." }, { status: 400 });
    }

    // Find the highest scoring completed item
    const item = await prisma.intelligenceItem.findFirst({
      where: { analysisStatus: "COMPLETED" },
      orderBy: { opportunityScore: "desc" }
    });

    if (!item) {
      return NextResponse.json({ error: "No completed opportunities found in the database to send a test alert." }, { status: 400 });
    }

    const text = `🧪 *Pulse AI — Test Alert* (Score: ${item.opportunityScore}/10)\n\n*${item.title}*\n\n⭐ *Opportunity:* ${item.opportunityScore}/10\n🚀 *Founder Fit:* ${item.founderScore || 0}/10\n\n*Why it matters:*\n_${item.whyItMatters || "N/A"}_\n\n*Founder opportunity:*\n${item.opportunity || "N/A"}\n\n_Dashboard:_\n${APP_URL}/dashboard/item/${item.id}`;

    const metaResult = await sendWhatsAppMessage({
      to: user.whatsappNumber,
      text: text
    });

    return NextResponse.json({
      success: true,
      message: "Test alert successfully dispatched!",
      meta: metaResult
    });
  } catch (error: any) {
    console.error("Test alert failed:", error);
    return NextResponse.json({ error: error.message || "Failed to send test alert." }, { status: 500 });
  }
}

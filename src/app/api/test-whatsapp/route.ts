import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendDigest } from "@/lib/whatsapp/sender";
import { calculateWeightedScore } from "@/lib/whatsapp/digest";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.id || user.role !== "ADMIN") {
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

    const item = await prisma.intelligenceItem.findFirst({
      where: { analysisStatus: "COMPLETED" },
      orderBy: [
        { opportunityScore: "desc" },
        { founderScore: "desc" },
        { publishedAt: "desc" },
      ],
    });

    if (!item) {
      return NextResponse.json(
        { error: "No analyzed items available to send" },
        { status: 404 }
      );
    }

    const dbUser = await prisma.user.findFirst();
    if (!dbUser) {
      return NextResponse.json(
        { error: "No user found in database to associate log" },
        { status: 400 }
      );
    }

    const summary = item.whyItMatters || item.opportunity || item.title;
    const messageId = await sendDigest(
      dbUser.id,
      phone,
      "Delivery Test",
      1,
      summary
    );

    return NextResponse.json({
      success: true,
      item: item.title,
      messageId,
      template: "pulse_digest_ready",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send test message";
    console.error("Test delivery failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

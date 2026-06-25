import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await prisma.deliveryLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            intelligenceItem: {
              select: {
                id: true,
                title: true,
                category: true,
                opportunityScore: true,
                founderScore: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error("Fetch delivery history failed:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch delivery history" }, { status: 500 });
  }
}

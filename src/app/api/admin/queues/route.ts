import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    let failedArticles: any[] = [];
    let failedDeliveries: any[] = [];

    if (type === "all" || type === "articles") {
      failedArticles = await prisma.intelligenceItem.findMany({
        where: { analysisStatus: "FAILED" },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          sourceName: true,
          category: true,
          opportunityScore: true,
          retryCount: true,
          errorMessage: true,
          updatedAt: true
        }
      });
    }

    if (type === "all" || type === "deliveries") {
      failedDeliveries = await prisma.deliveryLog.findMany({
        where: { status: "FAILED" },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        take: 30
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        articles: failedArticles,
        deliveries: failedDeliveries
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch queues:", error);
    return NextResponse.json({ error: "Failed to fetch failed queue items." }, { status: 500 });
  }
}

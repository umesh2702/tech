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
    const id = searchParams.get("id");
    const query = searchParams.get("query");

    if (id) {
      // Fetch detailed timeline for a specific article
      const item = await prisma.intelligenceItem.findUnique({
        where: { id },
        include: {
          deliveries: {
            include: {
              deliveryLog: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      whatsappNumber: true,
                      timezone: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!item) {
        return NextResponse.json({ error: "Article not found." }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: item });
    }

    // Otherwise return matching or recent articles
    const where: any = {};
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { sourceName: { contains: query, mode: "insensitive" } },
        { opportunity: { contains: query, mode: "insensitive" } },
      ];
    }

    const items = await prisma.intelligenceItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        sourceName: true,
        sourceUrl: true,
        category: true,
        analysisStatus: true,
        opportunityScore: true,
        publishedAt: true,
        collectedAt: true,
        retryCount: true
      }
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("Timeline query failed:", error);
    return NextResponse.json({ error: "Failed to query article processing timeline." }, { status: 500 });
  }
}

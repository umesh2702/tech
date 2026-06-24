import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const minScore = parseInt(searchParams.get("minScore") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    
    // Build where clause
    const where: any = {
      opportunityScore: {
        gte: minScore,
      },
      // Ensure we only serve analyzed items
      analysisStatus: "COMPLETED",
    };

    if (category && category !== "ALL") {
      where.category = category as Category;
    }

    const items = await prisma.intelligenceItem.findMany({
      where,
      orderBy: [
        { opportunityScore: "desc" },
        { publishedAt: "desc" },
      ],
      take: limit,
      // For future use with industryTags:
      // select: { id: true, title: true, ... }
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Failed to fetch intelligence feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed data. Ensure database is connected." },
      { status: 500 }
    );
  }
}

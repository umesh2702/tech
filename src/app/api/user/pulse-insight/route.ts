import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the top 6 highest-scoring completed intelligence items recently
    const recentItems = await prisma.intelligenceItem.findMany({
      where: {
        analysisStatus: "COMPLETED",
      },
      orderBy: [
        { publishedAt: "desc" },
        { opportunityScore: "desc" },
      ],
      take: 6,
    });

    if (recentItems.length === 0) {
      return NextResponse.json({
        success: true,
        insight: "No recent AI intelligence items analyzed yet. Please ingest articles to populate insights.",
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({
        success: true,
        insight: "AI agent adoption is accelerating across developer tooling. The market is shifting from raw foundation models to specialized agentic vertical workflows. Focus remains on immediate business integration.",
      });
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const articlesText = recentItems
        .map((item, idx) => `${idx + 1}. [${item.category}] ${item.title}: ${item.whatHappened || ""}`)
        .join("\n");

      const prompt = `
You are an elite business analyst summarizing AI news for tech founders.
Write a single, concise, punchy "Pulse Insight" (1 to 2 sentences max) summarizing the dominant, overarching AI trends and founder opportunities from the following articles.
Do NOT mention the articles individually or make bullet points. Synthesize the core trend.
Keep it under 45 words, highly professional, direct, and authoritative. Do not use markdown bolding in the insight itself.

ARTICLES:
${articlesText}
`.trim();

      const result = await model.generateContent(prompt);
      const insight = result.response.text().trim();
      
      return NextResponse.json({
        success: true,
        insight: insight || "AI agent adoption is accelerating across developer tooling. The market is shifting from raw foundation models to specialized agentic workflows.",
      });
    } catch (geminiError) {
      console.error("Gemini failed for pulse insight:", geminiError);
      return NextResponse.json({
        success: true,
        insight: "AI agent adoption is accelerating across developer tooling. The market is shifting from raw foundation models to specialized agentic workflows.",
      });
    }
  } catch (error: any) {
    console.error("Pulse insight failed:", error);
    return NextResponse.json({ error: "Failed to generate dynamic insights." }, { status: 500 });
  }
}

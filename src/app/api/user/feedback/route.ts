import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating, comment } = await req.json();

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be a number between 1 and 5" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error: any) {
    console.error("Feedback submission failed:", error);
    return NextResponse.json({ error: "Failed to submit feedback. Please try again." }, { status: 500 });
  }
}

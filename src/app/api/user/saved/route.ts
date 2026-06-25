import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saved = await prisma.savedItem.findMany({
      where: { userId: session.user.id },
      include: {
        intelligenceItem: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("Fetch saved items failed:", error);
    return NextResponse.json({ error: "Failed to load saved items." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    // Check if it exists
    const existing = await prisma.savedItem.findUnique({
      where: {
        userId_intelligenceItemId: {
          userId: session.user.id,
          intelligenceItemId: itemId,
        },
      },
    });

    if (existing) {
      // Remove
      await prisma.savedItem.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, saved: false });
    } else {
      // Add
      const created = await prisma.savedItem.create({
        data: {
          userId: session.user.id,
          intelligenceItemId: itemId,
        },
      });
      return NextResponse.json({ success: true, saved: true, data: created });
    }
  } catch (error: any) {
    console.error("Toggle saved item failed:", error);
    return NextResponse.json({ error: "Failed to bookmark opportunity." }, { status: 500 });
  }
}

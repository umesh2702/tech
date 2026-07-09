import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DigestFrequency } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        whatsappNumber: true,
        whatsappVerified: true,
        timezone: true,
        country: true,
        interests: true,
        deliveryPreferences: true,
        notificationsEnabled: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch settings";
    console.error("Fetch settings failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name || null;

    if (body.whatsappNumber !== undefined) {
      updateData.whatsappNumber = body.whatsappNumber || null;
      if (body.whatsappVerified !== undefined) {
        updateData.whatsappVerified = body.whatsappVerified;
      } else {
        const currentUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { whatsappNumber: true },
        });
        if (currentUser?.whatsappNumber !== body.whatsappNumber) {
          updateData.whatsappVerified = false;
        }
      }
    }

    if (body.country !== undefined) updateData.country = body.country || null;
    if (body.timezone !== undefined)
      updateData.timezone = body.timezone || "Asia/Kolkata";

    // Interests and deliveryPreferences: update dashboard only.
    // No automatic WhatsApp notification is sent for these changes.
    if (body.interests !== undefined) updateData.interests = body.interests || [];
    if (body.deliveryPreferences !== undefined) {
      const validPreferences = (body.deliveryPreferences || []).filter((p: string) =>
        Object.values(DigestFrequency).includes(p as DigestFrequency)
      ) as DigestFrequency[];
      updateData.deliveryPreferences = validPreferences;
    }

    if (body.notificationsEnabled !== undefined)
      updateData.notificationsEnabled = body.notificationsEnabled;
    if (body.onboardingCompleted !== undefined)
      updateData.onboardingCompleted = body.onboardingCompleted;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update settings";
    console.error("Update settings failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

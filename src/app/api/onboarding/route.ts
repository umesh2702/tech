import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DigestFrequency } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      whatsappNumber,
      country,
      timezone,
      interests,
      deliveryPreferences,
      notificationsEnabled,
    } = await req.json();

    // Basic validation
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is required" }, { status: 400 });
    }

    // Validate that delivery preferences are valid DigestFrequency enums
    const validPreferences = (deliveryPreferences || []).filter((p: any) =>
      Object.values(DigestFrequency).includes(p)
    ) as DigestFrequency[];

    // Update user preferences directly in the User model
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || null,
        whatsappNumber: whatsappNumber || null,
        country: country || null,
        timezone: timezone || "Asia/Kolkata",
        interests: interests || [],
        deliveryPreferences: validPreferences.length > 0 ? validPreferences : [DigestFrequency.DAILY],
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
        onboardingCompleted: true, // Complete onboarding!
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Onboarding API failed:", error);
    return NextResponse.json({ error: error.message || "Failed to save onboarding data" }, { status: 500 });
  }
}

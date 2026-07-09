import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcome } from "@/lib/whatsapp/sender";
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

    if (!timezone) {
      return NextResponse.json({ error: "Timezone is required" }, { status: 400 });
    }

    const validPreferences = (deliveryPreferences || []).filter((p: string) =>
      Object.values(DigestFrequency).includes(p as DigestFrequency)
    ) as DigestFrequency[];

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || null,
        whatsappNumber: whatsappNumber || null,
        country: country || null,
        timezone: timezone || "Asia/Kolkata",
        interests: interests || [],
        deliveryPreferences:
          validPreferences.length > 0 ? validPreferences : [DigestFrequency.DAILY],
        notificationsEnabled:
          notificationsEnabled !== undefined ? notificationsEnabled : true,
        onboardingCompleted: true,
      },
      include: {
        subscription: true,
      }
    });

    if (!updatedUser.subscription) {
      await prisma.subscription.create({
        data: {
          userId: updatedUser.id,
          plan: "FREE",
          status: "ACTIVE",
        }
      });
    }

    // Send pulse_welcome template if the user has a WhatsApp number
    if (updatedUser.whatsappNumber && updatedUser.whatsappVerified) {
      try {
        await sendWelcome(
          updatedUser.id,
          updatedUser.whatsappNumber,
          updatedUser.name || "there"
        );
      } catch (waErr) {
        // Never fail onboarding because of a WhatsApp error — log and continue
        console.error("[Onboarding] Failed to send pulse_welcome template:", waErr);
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save onboarding data";
    console.error("Onboarding API failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

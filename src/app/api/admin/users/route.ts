import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DigestFrequency } from "@prisma/client";

// Helper to calculate the next delivery window in user local time and UTC
function calculateNextWindow(
  frequency: DigestFrequency,
  timezone: string,
  lastDeliveryAt: Date | null
): { local: string; utc: string; isDueNow: boolean } {
  const now = new Date();
  
  // Format current date in user's timezone to calculate local offsets
  let userLocalTime: Date;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    userLocalTime = new Date(formatter.format(now));
  } catch (e) {
    // Fallback if timezone is invalid
    userLocalTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  }

  let nextLocal = new Date(userLocalTime);
  nextLocal.setMinutes(0, 0, 0); // Scheduled jobs run on the hour

  if (frequency === DigestFrequency.THREE_HOURLY) {
    if (lastDeliveryAt) {
      const nextTime = new Date(lastDeliveryAt.getTime() + 3 * 60 * 60 * 1000);
      nextLocal = new Date(nextTime.toLocaleString("en-US", { timeZone: timezone }));
    } else {
      nextLocal.setHours(nextLocal.getHours() + 1); // due next hour
    }
  } else if (frequency === DigestFrequency.MORNING) {
    nextLocal.setHours(8, 0, 0, 0);
    if (userLocalTime.getHours() >= 8) {
      nextLocal.setDate(nextLocal.getDate() + 1);
    }
  } else if (frequency === DigestFrequency.EVENING) {
    nextLocal.setHours(20, 0, 0, 0);
    if (userLocalTime.getHours() >= 20) {
      nextLocal.setDate(nextLocal.getDate() + 1);
    }
  } else if (frequency === DigestFrequency.DAILY || frequency === DigestFrequency.INSTANT) {
    nextLocal.setHours(9, 0, 0, 0);
    if (userLocalTime.getHours() >= 9) {
      nextLocal.setDate(nextLocal.getDate() + 1);
    }
  }

  // Convert local target back to UTC by computing offset
  // We can construct the date string in user timezone to parse it in UTC
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoStr = `${nextLocal.getFullYear()}-${pad(nextLocal.getMonth() + 1)}-${pad(nextLocal.getDate())}T${pad(nextLocal.getHours())}:00:00`;
  
  // Calculate UTC time using user timezone formatting
  let utcDate = new Date(now);
  try {
    // Find the date in UTC that when formatted to the user's timezone matches the target isoStr
    // A simpler approximation: parse target date as local and adjust using timezone offset
    const userTimeInUTC = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const userTimeInTZ = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMs = userTimeInTZ.getTime() - userTimeInUTC.getTime();
    
    // Parse target local time and subtract offset to get UTC
    const targetLocalParsed = new Date(isoStr.replace("T", " "));
    utcDate = new Date(targetLocalParsed.getTime() - offsetMs);
  } catch (err) {
    // Fail-safe fallback
    utcDate = new Date(now.getTime() + 60 * 60 * 1000);
  }

  // Determine if it is currently due
  let isDueNow = false;
  const hoursSinceLast = lastDeliveryAt
    ? (now.getTime() - lastDeliveryAt.getTime()) / (1000 * 60 * 60)
    : 999;

  const currentLocalHour = userLocalTime.getHours();
  if (frequency === DigestFrequency.THREE_HOURLY && hoursSinceLast >= 2.5) {
    isDueNow = true;
  } else if (frequency === DigestFrequency.MORNING && currentLocalHour === 8 && hoursSinceLast >= 20) {
    isDueNow = true;
  } else if (frequency === DigestFrequency.EVENING && currentLocalHour === 20 && hoursSinceLast >= 20) {
    isDueNow = true;
  } else if ((frequency === DigestFrequency.DAILY || frequency === DigestFrequency.INSTANT) && currentLocalHour === 9 && hoursSinceLast >= 20) {
    isDueNow = true;
  }

  return {
    local: nextLocal.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) + ` (${nextLocal.toLocaleDateString()})`,
    utc: utcDate.toISOString(),
    isDueNow
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    const usersWithSchedules = await Promise.all(
      users.map(async (user) => {
        const schedules = await Promise.all(
          user.deliveryPreferences.map(async (freq) => {
            const lastLog = await prisma.deliveryLog.findFirst({
              where: { userId: user.id, digestType: freq === DigestFrequency.INSTANT ? DigestFrequency.DAILY : freq },
              orderBy: { createdAt: "desc" }
            });

            const lastDeliveryAt = lastLog?.createdAt || null;
            const window = calculateNextWindow(freq, user.timezone, lastDeliveryAt);

            return {
              frequency: freq,
              lastDeliveryAt,
              lastStatus: lastLog?.status || null,
              nextWindowLocal: window.local,
              nextWindowUTC: window.utc,
              isDueNow: window.isDueNow
            };
          })
        );

        // Get user local current time for debugging
        let localTimeStr = "Unknown";
        try {
          localTimeStr = new Date().toLocaleTimeString("en-US", {
            timeZone: user.timezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          });
        } catch (e) {}

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
          localTime: localTimeStr,
          whatsappNumber: user.whatsappNumber,
          whatsappVerified: user.whatsappVerified,
          notificationsEnabled: user.notificationsEnabled,
          onboardingCompleted: user.onboardingCompleted,
          schedules
        };
      })
    );

    return NextResponse.json({ success: true, data: usersWithSchedules });
  } catch (error: any) {
    console.error("Scheduler simulator user query failed:", error);
    return NextResponse.json({ error: "Failed to load users for scheduler simulation." }, { status: 500 });
  }
}

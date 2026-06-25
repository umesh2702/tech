import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { exportDatabaseJSON } from "@/lib/backup";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "pauseResumeScheduler") {
      const { pause } = body;
      await prisma.systemSetting.upsert({
        where: { key: "schedulerPaused" },
        update: { value: pause ? "true" : "false" },
        create: { key: "schedulerPaused", value: pause ? "true" : "false" },
      });

      await prisma.systemLog.create({
        data: {
          component: "SCHEDULER",
          level: "INFO",
          message: `Admin ${pause ? "PAUSED" : "RESUMED"} the global scheduler.`,
        },
      });

      return NextResponse.json({ success: true, paused: pause });
    }

    if (action === "triggerScheduler") {
      // Trigger RSS ingestion and scheduled delivery evaluation
      await inngest.send([
        { name: "app/ingest.trigger", data: {} },
        { name: "app/schedule.trigger", data: {} },
      ]);

      await prisma.systemLog.create({
        data: {
          component: "SCHEDULER",
          level: "INFO",
          message: "Admin manually triggered scheduler ingestion and delivery check runs.",
        },
      });

      return NextResponse.json({ success: true, message: "Scheduler triggers sent successfully." });
    }

    if (action === "triggerBackup") {
      const result = await exportDatabaseJSON();
      
      // Save last backup time in settings
      await prisma.systemSetting.upsert({
        where: { key: "lastBackupAt" },
        update: { value: new Date().toISOString() },
        create: { key: "lastBackupAt", value: new Date().toISOString() },
      });

      return NextResponse.json({
        success: true,
        message: "Manual database export completed successfully.",
        data: result
      });
    }

    if (action === "retryJob") {
      const { type, id } = body;

      if (type === "article") {
        const item = await prisma.intelligenceItem.findUnique({ where: { id } });
        if (!item) {
          return NextResponse.json({ error: "Article not found." }, { status: 404 });
        }

        await prisma.intelligenceItem.update({
          where: { id },
          data: {
            analysisStatus: "PENDING",
            retryCount: 0,
            errorMessage: null,
          },
        });

        await inngest.send({
          name: "app/analyze.article",
          data: { itemId: id },
        });

        await prisma.systemLog.create({
          data: {
            component: "GEMINI",
            level: "INFO",
            message: `Admin manually reset and enqueued analysis for article: ${item.title}`,
          },
        });

        return NextResponse.json({ success: true, message: "Article analysis enqueued." });
      }

      if (type === "delivery") {
        const log = await prisma.deliveryLog.findUnique({ where: { id } });
        if (!log) {
          return NextResponse.json({ error: "Delivery log not found." }, { status: 404 });
        }

        await prisma.deliveryLog.update({
          where: { id },
          data: {
            status: "QUEUED",
            retryCount: 0,
            errorMessage: null,
          },
        });

        await inngest.send({
          name: "app/send.delivery",
          data: { deliveryLogId: id },
        });

        await prisma.systemLog.create({
          data: {
            component: "WHATSAPP",
            level: "INFO",
            message: `Admin manually reset and enqueued delivery for log ID: ${id}`,
          },
        });

        return NextResponse.json({ success: true, message: "WhatsApp delivery enqueued." });
      }

      return NextResponse.json({ error: "Invalid retry type specified." }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Admin operations failed:", error);
    return NextResponse.json({ error: error.message || "Failed to execute admin operation." }, { status: 500 });
  }
}

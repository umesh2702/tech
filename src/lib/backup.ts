import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export async function exportDatabaseJSON() {
  const exportDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const exportFile = path.join(exportDir, `export-${timestamp}.json`);

    // Fetch all tables
    const users = await prisma.user.findMany();
    const intelligenceItems = await prisma.intelligenceItem.findMany();
    const deliveryLogs = await prisma.deliveryLog.findMany();
    const deliveryItems = await prisma.deliveryItem.findMany();
    const sources = await prisma.source.findMany();
    const feedbacks = await prisma.feedback.findMany();
    const systemLogs = await prisma.systemLog.findMany();
    const systemSettings = await prisma.systemSetting.findMany();

    const data = {
      exportedAt: new Date().toISOString(),
      databaseProvider: "Supabase PostgreSQL",
      users,
      intelligenceItems,
      deliveryLogs,
      deliveryItems,
      sources,
      feedbacks,
      systemLogs,
      systemSettings,
    };

    fs.writeFileSync(exportFile, JSON.stringify(data, null, 2), "utf8");

    // Retention policy: Keep last 7 exports locally
    const files = fs.readdirSync(exportDir)
      .filter((f) => f.startsWith("export-") && f.endsWith(".json"))
      .map((f) => ({ name: f, time: fs.statSync(path.join(exportDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    const retentionLimit = 7;
    if (files.length > retentionLimit) {
      for (let i = retentionLimit; i < files.length; i++) {
        fs.unlinkSync(path.join(exportDir, files[i].name));
        await logger.info("BACKUP", `Cleaned up old local backup export file: ${files[i].name}`);
      }
    }

    await logger.info(
      "BACKUP",
      `Admin-triggered database export completed successfully. File saved: export-${timestamp}.json`
    );

    return {
      success: true,
      file: exportFile,
      filename: `export-${timestamp}.json`,
      recordCounts: {
        users: users.length,
        intelligenceItems: intelligenceItems.length,
        deliveryLogs: deliveryLogs.length,
        deliveryItems: deliveryItems.length,
        sources: sources.length,
        feedbacks: feedbacks.length,
        systemLogs: systemLogs.length,
      },
    };
  } catch (error: any) {
    await logger.error("BACKUP", "Admin database export failed", error);
    throw error;
  }
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type ComponentType = "RSS" | "GEMINI" | "WHATSAPP" | "SCHEDULER" | "DATABASE" | "QUEUE" | "SYSTEM" | "BACKUP";

interface LogPayload {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "ALERT_SENT";
  component: ComponentType;
  message: string;
  details?: any;
}

export const logger = {
  info: async (component: ComponentType, message: string, details?: any) => {
    const log: LogPayload = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      component,
      message,
      details,
    };
    console.log(JSON.stringify(log));
  },

  warn: async (component: ComponentType, message: string, details?: any) => {
    const log: LogPayload = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      component,
      message,
      details,
    };
    console.warn(JSON.stringify(log));

    try {
      await prisma.systemLog.create({
        data: {
          component,
          level: "WARN",
          message,
          details: details ? (typeof details === "string" ? details : JSON.stringify(details)) : null,
        },
      });
    } catch (dbErr) {
      console.error("Logger failed to write WARN to DB:", dbErr);
    }
  },

  error: async (component: ComponentType, message: string, details?: any) => {
    const log: LogPayload = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      component,
      message,
      details: details instanceof Error ? { message: details.message, stack: details.stack } : details,
    };
    console.error(JSON.stringify(log));

    try {
      const detailsStr = details 
        ? (details instanceof Error ? `${details.message}\n${details.stack || ""}` : typeof details === "string" ? details : JSON.stringify(details)) 
        : null;

      await prisma.systemLog.create({
        data: {
          component,
          level: "ERROR",
          message,
          details: detailsStr,
        },
      });

      // Dispatch alert request to Inngest for debouncing and aggregation
      try {
        const { inngest } = await import("@/inngest/client");
        await inngest.send({
          name: "app/alert.trigger",
          data: { component },
        });
      } catch (inngestErr) {
        console.error("Logger failed to trigger alert event:", inngestErr);
      }

    } catch (dbErr) {
      console.error("Logger failed to write ERROR to DB:", dbErr);
    }
  },
};

// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Inngest Functions
// Template-only delivery: no raw text messages
// ─────────────────────────────────────────────

import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { generateDigest, generateAIGeneratedSummary, calculateWeightedScore } from "@/lib/whatsapp/digest";
import { sendDigest } from "@/lib/whatsapp/sender";
import { WhatsAppApiError, WhatsAppValidationError } from "@/lib/whatsapp/types";
import { RETRYABLE_STATUS_CODES } from "@/lib/whatsapp/constants";
import { Prisma, DigestFrequency, DeliveryStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

// ── Helpers ───────────────────────────────────

/**
 * Returns the human-readable digest label for a given frequency.
 */
function getDigestLabel(freq: DigestFrequency): string {
  switch (freq) {
    case DigestFrequency.MORNING:      return "Morning Digest";
    case DigestFrequency.EVENING:      return "Evening Digest";
    case DigestFrequency.THREE_HOURLY: return "3-Hour Digest";
    case DigestFrequency.INSTANT:      return "Instant Alert";
    case DigestFrequency.DAILY:
    default:                           return "Daily Digest";
  }
}

/**
 * Returns the local hour (0-23) in the given timezone.
 */
function getLocalHour(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      });
      return parseInt(formatter.format(new Date()), 10);
    } catch {
      return new Date().getUTCHours();
    }
  }
}

/**
 * Determines if a WhatsApp API error is retryable.
 */
function isRetryableError(err: unknown): boolean {
  if (err instanceof WhatsAppApiError) {
    return err.isRetryable;
  }
  if (err instanceof WhatsAppValidationError) {
    return false; // Validation errors are never retryable
  }
  return true; // Unknown errors: retry by default
}

// ── Hourly Cron — Schedule Checker ───────────

export const sendScheduledDigests = inngest.createFunction(
  {
    id: "send-scheduled-digests",
    triggers: [
      { cron: "0 * * * *" },
      { event: "app/schedule.trigger" },
    ],
  },
  async ({ step }) => {
    await logger.info("SCHEDULER", "Starting scheduled digest cron checks");

    // Heartbeat log
    await step.run("scheduler-heartbeat", async () => {
      await prisma.systemLog.create({
        data: {
          component: "SCHEDULER",
          level: "INFO",
          message: "Scheduler heartbeat check completed.",
        },
      });
    });

    // Check if scheduler is paused
    const isPaused = await step.run("check-scheduler-paused", async () => {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "schedulerPaused" },
      });
      return setting?.value === "true";
    });

    if (isPaused) {
      await logger.warn("SCHEDULER", "Scheduled digest runs are currently PAUSED globally by admin.");
      return { message: "Scheduler is paused globally." };
    }

    // Fetch eligible users
    const users = await step.run("fetch-digest-users", async () => {
      return prisma.user.findMany({
        where: {
          whatsappVerified: true,
          whatsappNumber: { not: null },
          notificationsEnabled: true,
          onboardingCompleted: true,
          deliveryPreferences: {
            hasSome: [
              DigestFrequency.DAILY,
              DigestFrequency.THREE_HOURLY,
              DigestFrequency.MORNING,
              DigestFrequency.EVENING,
              DigestFrequency.INSTANT,
            ],
          },
          OR: [
            { subscription: null },
            { subscription: { status: { in: ["ACTIVE", "PAST_DUE"] } } },
          ],
        },
      });
    });

    const result = await step.run("process-all-schedules", async () => {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "whatsapp_batch_size" },
      });
      const whatsappBatchSize = setting ? parseInt(setting.value, 10) : 15;

      let dispatchedCount = 0;
      const eventsToDispatch: { name: string; data: { deliveryLogId: string } }[] = [];

      for (const user of users) {
        const localHour = getLocalHour(user.timezone);

        for (const freq of user.deliveryPreferences) {
          if (dispatchedCount >= whatsappBatchSize) break;

          const evaluatedFrequency =
            freq === DigestFrequency.INSTANT ? DigestFrequency.DAILY : freq;

          const lastDelivery = await prisma.deliveryLog.findFirst({
            where: { userId: user.id, digestType: evaluatedFrequency },
            orderBy: { createdAt: "desc" },
          });

          const now = new Date();
          const hoursSinceLast = lastDelivery
            ? (now.getTime() - lastDelivery.createdAt.getTime()) / (1000 * 60 * 60)
            : 999;

          let isDue = false;
          if (freq === DigestFrequency.THREE_HOURLY && hoursSinceLast >= 2.5) {
            isDue = true;
          } else if (freq === DigestFrequency.MORNING && localHour === 8 && hoursSinceLast >= 20) {
            isDue = true;
          } else if (freq === DigestFrequency.EVENING && localHour === 20 && hoursSinceLast >= 20) {
            isDue = true;
          } else if (
            (freq === DigestFrequency.DAILY || freq === DigestFrequency.INSTANT) &&
            localHour === 9 &&
            hoursSinceLast >= 20
          ) {
            isDue = true;
          }

          if (!isDue) continue;

          const digest = await generateDigest(user.id, evaluatedFrequency);
          if (!digest || digest.itemIds.length === 0) continue;

          // Create QUEUED log with template name
          const log = await prisma.deliveryLog.create({
            data: {
              userId: user.id,
              whatsappNumber: user.whatsappNumber!,
              digestType: evaluatedFrequency,
              status: DeliveryStatus.QUEUED,
              templateName: "pulse_digest_ready",
              scheduledAt: new Date(),
              items: {
                create: digest.itemIds.map((id) => ({ intelligenceItemId: id })),
              },
            },
          });

          eventsToDispatch.push({
            name: "app/send.delivery",
            data: { deliveryLogId: log.id },
          });

          dispatchedCount++;
        }

        if (dispatchedCount >= whatsappBatchSize) break;
      }

      if (eventsToDispatch.length > 0) {
        await inngest.send(eventsToDispatch);
      }

      return { dispatchedCount };
    });

    await logger.info(
      "SCHEDULER",
      `Scheduler run complete. Dispatched ${result.dispatchedCount} delivery jobs.`
    );
    return {
      usersProcessed: users.length,
      dispatchedJobs: result.dispatchedCount,
    };
  }
);

// ── Event-Driven Instant Alert ────────────────

export const sendInstantAlert = inngest.createFunction(
  { id: "send-instant-alert", triggers: [{ event: "whatsapp/send_instant" }] },
  async ({ event, step }) => {
    const { itemId } = event.data;

    const item = await step.run("fetch-item", async () => {
      return prisma.intelligenceItem.findUnique({ where: { id: itemId } });
    });

    if (!item) return { skipped: true, reason: "item_not_found" };

    const ageInHours =
      (Date.now() - new Date(item.collectedAt || item.publishedAt).getTime()) /
      (1000 * 60 * 60);
    const isFresh = ageInHours <= 2.0;

    if (item.opportunityScore < 9 || (item.founderScore || 0) < 8 || !isFresh) {
      return {
        skipped: true,
        reason: `does_not_meet_instant_criteria: oppScore=${item.opportunityScore}/9, founderScore=${item.founderScore}/8, age=${ageInHours.toFixed(2)}h/2h`,
      };
    }

    const users = await step.run("fetch-instant-users", async () => {
      return prisma.user.findMany({
        where: {
          whatsappVerified: true,
          whatsappNumber: { not: null },
          notificationsEnabled: true,
          onboardingCompleted: true,
          deliveryPreferences: { has: DigestFrequency.INSTANT },
          OR: [
            { subscription: null },
            { subscription: { status: { in: ["ACTIVE", "PAST_DUE"] } } },
          ],
        },
      });
    });

    let dispatchedCount = 0;

    for (const user of users) {
      await step.run(`send-instant-${user.id}`, async () => {
        const interests = user.interests || [];
        const matchesCategory = interests.includes(item.category as string);
        const matchesTags = item.tags.some((tag) =>
          interests.some(
            (interest) => interest.toUpperCase() === tag.toUpperCase()
          )
        );

        if (!matchesCategory && !matchesTags) {
          return { skipped: true, reason: "interests_do_not_match" };
        }

        const alreadyDelivered = await prisma.deliveryItem.findFirst({
          where: {
            intelligenceItemId: item.id,
            deliveryLog: { userId: user.id },
          },
        });

        if (alreadyDelivered) {
          return { skipped: true, reason: "already_delivered" };
        }

        const log = await prisma.deliveryLog.create({
          data: {
            userId: user.id,
            whatsappNumber: user.whatsappNumber!,
            digestType: DigestFrequency.INSTANT,
            status: DeliveryStatus.QUEUED,
            templateName: "pulse_digest_ready",
            scheduledAt: new Date(),
            items: {
              create: [{ intelligenceItemId: item.id }],
            },
          },
        });

        await inngest.send({
          name: "app/send.delivery",
          data: { deliveryLogId: log.id },
        });

        dispatchedCount++;
      });
    }

    return { alertedUsersCount: users.length, dispatchedCount };
  }
);

// ── Decoupled Delivery Job — Template Sender ──

export const sendDelivery = inngest.createFunction(
  {
    id: "send-delivery",
    concurrency: 1,
    retries: 3,
    idempotency: "event.data.deliveryLogId",
    rateLimit: {
      limit: parseInt(process.env.WHATSAPP_RATELIMIT_LIMIT || "30", 10),
      period: (process.env.WHATSAPP_RATELIMIT_PERIOD || "1m") as "1m",
    },
    triggers: [{ event: "app/send.delivery" }],
  },
  async ({ event, step, attempt }) => {
    const { deliveryLogId } = event.data;
    const MAX_RETRIES = parseInt(process.env.WHATSAPP_MAX_RETRIES || "3", 10);
    const currentAttempt = attempt ?? 0;

    const log = await step.run("fetch-log", async () => {
      return prisma.deliveryLog.findUnique({
        where: { id: deliveryLogId },
        include: {
          user: true,
          items: { include: { intelligenceItem: true } },
        },
      });
    });

    if (!log) {
      await logger.warn("WHATSAPP", `DeliveryLog ID: ${deliveryLogId} not found.`);
      return { message: "Delivery log not found" };
    }

    try {
      await logger.info(
        "WHATSAPP",
        `Attempting template delivery for log ID: ${log.id}, user: ${log.user.name} (attempt ${currentAttempt + 1}/${MAX_RETRIES + 1})`
      );

      // Mark as SENDING
      await step.run("mark-sending", async () => {
        await prisma.deliveryLog.update({
          where: { id: log.id },
          data: { status: DeliveryStatus.SENDING },
        });
      });

      // Build template variables from pre-locked items
      const { digestLabel, itemCount, summary } = await step.run(
        "build-template-variables",
        async () => {
          const items = log.items.map((i) => i.intelligenceItem);
          if (items.length === 0) {
            throw new Error("No items associated with this delivery log");
          }

          const label = getDigestLabel(log.digestType);
          const count = items.length;

          // Generate AI summary or fallback
          const aiSummary = await generateAIGeneratedSummary(items as any);

          return {
            digestLabel: label,
            itemCount: count,
            summary: aiSummary,
          };
        }
      );

      // Send via digest template
      const messageId = await step.run("send-digest-template", async () => {
        return sendDigest(
          log.userId,
          log.whatsappNumber,
          digestLabel,
          itemCount,
          summary
        );
      });

      // Mark SENT with messageId and template name
      await step.run("mark-success", async () => {
        await prisma.deliveryLog.update({
          where: { id: log.id },
          data: {
            status: DeliveryStatus.SENT,
            sentAt: new Date(),
            messageId,
            templateName: "pulse_digest_ready",
          },
        });
      });

      await logger.info(
        "WHATSAPP",
        `Digest template delivered successfully for log ID: ${log.id}. Meta ID: ${messageId}`
      );

      return { success: true, logId: log.id, messageId };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorCode =
        error instanceof WhatsAppApiError ? error.metaErrorCode : undefined;
      const rawResponse =
        error instanceof WhatsAppApiError ? error.rawResponse : null;
      const retryable = isRetryableError(error);

      // Log failure details to DeliveryLog
      await step.run("log-delivery-fail", async () => {
        await prisma.deliveryLog.update({
          where: { id: log.id },
          data: {
            retryCount: currentAttempt + 1,
            errorMessage,
            errorCode: errorCode ?? null,
            rawResponse: rawResponse ? (rawResponse as object) : Prisma.JsonNull,
            status:
              currentAttempt >= MAX_RETRIES || !retryable
                ? DeliveryStatus.FAILED
                : DeliveryStatus.QUEUED,
          },
        });
      });

      if (currentAttempt >= MAX_RETRIES || !retryable) {
        await logger.error(
          "WHATSAPP",
          `Template delivery permanently failed for log ID: ${log.id} after ${currentAttempt + 1} attempt(s). Non-retryable: ${!retryable}`,
          error instanceof Error ? error : new Error(errorMessage)
        );
        return {
          success: false,
          message: `Failed after ${currentAttempt + 1} attempt(s)`,
          error: errorMessage,
          retryable,
        };
      }

      await logger.warn(
        "WHATSAPP",
        `Template delivery attempt ${currentAttempt + 1} failed for log ID: ${log.id}. Scheduling retry...`,
        error instanceof Error ? error : new Error(errorMessage)
      );

      // Rethrow for Inngest to handle exponential backoff
      throw error;
    }
  }
);

// ── Debounced Admin Alert ─────────────────────
// WhatsApp delivery is DISABLED until `pulse_admin_alert` template is approved.
// Errors continue to be logged to the database via logger.error().

export const sendDebouncedAlert = inngest.createFunction(
  {
    id: "send-debounced-alert",
    debounce: {
      key: "event.data.component",
      period: "3m",
    },
    triggers: [{ event: "app/alert.trigger" }],
  },
  async ({ event, step }) => {
    const { component } = event.data;

    await step.run("aggregate-and-log-alerts", async () => {
      const timeframe = new Date(Date.now() - 15 * 60 * 1000);
      const errors = await prisma.systemLog.findMany({
        where: {
          component,
          level: "ERROR",
          createdAt: { gte: timeframe },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      if (errors.length === 0) return { message: "No active errors to alert." };

      // Log aggregated alert to DB (WhatsApp disabled until pulse_admin_alert template is approved)
      await prisma.systemLog.create({
        data: {
          component,
          level: "ALERT_SENT",
          message:
            `[Admin Alert – DB Only] ${errors.length} recent error(s) on component "${component}". ` +
            `WhatsApp admin alerts are disabled until the "pulse_admin_alert" template is approved by Meta. ` +
            `Check the Admin Dashboard logs for details.`,
        },
      });

      await logger.warn(
        "WHATSAPP",
        `[Admin Alert] ${errors.length} error(s) detected on "${component}". ` +
          `WhatsApp delivery suppressed — pulse_admin_alert template pending approval.`
      );
    });
  }
);

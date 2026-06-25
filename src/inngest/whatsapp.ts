import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { generateDigest, formatDeliveryMessage } from "@/lib/whatsapp/digest";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { DigestFrequency, DeliveryStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * Utility to get current local hour in user's timezone.
 */
function getLocalHour(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch (e) {
    // Default fallback to Asia/Kolkata
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      });
      return parseInt(formatter.format(new Date()), 10);
    } catch (e2) {
      return new Date().getUTCHours();
    }
  }
}

// Hourly Cron to check for due digests
export const sendScheduledDigests = inngest.createFunction(
  { id: "send-scheduled-digests", triggers: [{ cron: "0 * * * *" }, { event: "app/schedule.trigger" }] },
  async ({ step }) => {
    await logger.info("SCHEDULER", "Starting scheduled digest cron checks");

    // Add scheduler heartbeat log to database
    await step.run("scheduler-heartbeat", async () => {
      await prisma.systemLog.create({
        data: {
          component: "SCHEDULER",
          level: "INFO",
          message: "Scheduler heartbeat check completed."
        }
      });
    });

    // Check if scheduler is paused in global settings
    const isPaused = await step.run("check-scheduler-paused", async () => {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "schedulerPaused" }
      });
      return setting?.value === "true";
    });

    if (isPaused) {
      await logger.warn("SCHEDULER", "Scheduled digest runs are currently PAUSED globally by admin.");
      return { message: "Scheduler is paused globally." };
    }

    // 1. Find all verified users with daily/scheduled preferences who completed onboarding and have notifications enabled
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
            ]
          }
        },
      });
    });

    const result = await step.run("process-all-schedules", async () => {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "whatsapp_batch_size" }
      });
      const whatsappBatchSize = setting ? parseInt(setting.value, 10) : 15;

      let dispatchedCount = 0;
      const eventsToDispatch = [];

      for (const user of users) {
        const localHour = getLocalHour(user.timezone);
        
        // Evaluate all selected schedules
        for (const freq of user.deliveryPreferences) {
          if (dispatchedCount >= whatsappBatchSize) {
            break;
          }

          const evaluatedFrequency = freq === DigestFrequency.INSTANT
            ? DigestFrequency.DAILY
            : freq;

          // Find last delivery of this type
          const lastDelivery = await prisma.deliveryLog.findFirst({
            where: { userId: user.id, digestType: evaluatedFrequency },
            orderBy: { createdAt: "desc" },
          });

          const now = new Date();
          const hoursSinceLast = lastDelivery
            ? (now.getTime() - lastDelivery.createdAt.getTime()) / (1000 * 60 * 60)
            : 999;

          // Apply Timezone & Delay rules
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

          if (!isDue) {
            continue;
          }

          // 2. Generate personalized list of item IDs
          const digest = await generateDigest(user.id, evaluatedFrequency);

          if (!digest || digest.itemIds.length === 0) {
            continue;
          }

          // 3. Create log BEFORE sending (QUEUED) - locking items
          const log = await prisma.deliveryLog.create({
            data: {
              userId: user.id,
              whatsappNumber: user.whatsappNumber!,
              digestType: evaluatedFrequency,
              status: DeliveryStatus.QUEUED,
              scheduledAt: new Date(),
              items: {
                create: digest.itemIds.map((id) => ({ intelligenceItemId: id })),
              },
            },
          });

          // Queue for dispatch
          eventsToDispatch.push({
            name: "app/send.delivery",
            data: {
              deliveryLogId: log.id
            }
          });

          dispatchedCount++;
        }

        if (dispatchedCount >= whatsappBatchSize) {
          break;
        }
      }

      if (eventsToDispatch.length > 0) {
        await inngest.send(eventsToDispatch);
      }

      return { dispatchedCount };
    });

    await logger.info("SCHEDULER", `Scheduler run complete. Dispatched ${result.dispatchedCount} delivery jobs to the queue.`);
    return { usersProcessed: users.length, dispatchedJobs: result.dispatchedCount };
  }
);

// Event-driven instant alert for high-opportunity items
export const sendInstantAlert = inngest.createFunction(
  { id: "send-instant-alert", triggers: [{ event: "whatsapp/send_instant" }] },
  async ({ event, step }) => {
    const { itemId } = event.data;

    const item = await step.run("fetch-item", async () => {
      return prisma.intelligenceItem.findUnique({ where: { id: itemId } });
    });

    if (!item) {
      return { skipped: true, reason: "item_not_found" };
    }

    // Trigger rule: Opp score >= 9, Founder score >= 8, published within last 2 hours
    const ageInHours = (Date.now() - new Date(item.collectedAt || item.publishedAt).getTime()) / (1000 * 60 * 60);
    const isFresh = ageInHours <= 2.0;

    if (item.opportunityScore < 9 || (item.founderScore || 0) < 8 || !isFresh) {
      return {
        skipped: true,
        reason: `does_not_meet_instant_criteria: oppScore=${item.opportunityScore}/9, founderScore=${item.founderScore}/8, age=${ageInHours.toFixed(2)}h/2h`,
      };
    }

    // Find all INSTANT users
    const users = await step.run("fetch-instant-users", async () => {
      return prisma.user.findMany({
        where: {
          whatsappVerified: true,
          whatsappNumber: { not: null },
          notificationsEnabled: true,
          onboardingCompleted: true,
          deliveryPreferences: {
            has: DigestFrequency.INSTANT,
          },
        },
      });
    });

    let dispatchedCount = 0;

    for (const user of users) {
      await step.run(`send-instant-${user.id}`, async () => {
        // Personalization Filter
        const interests = user.interests || [];
        const matchesCategory = interests.includes(item.category as any);
        const matchesTags = item.tags.some(tag => 
          interests.some(interest => interest.toUpperCase() === tag.toUpperCase())
        );

        if (!matchesCategory && !matchesTags) {
          return { skipped: true, reason: "interests_do_not_match" };
        }

        // Deduplication Check
        const alreadyDelivered = await prisma.deliveryItem.findFirst({
          where: {
            intelligenceItemId: item.id,
            deliveryLog: {
              userId: user.id,
            },
          },
        });

        if (alreadyDelivered) {
          return { skipped: true, reason: "already_delivered" };
        }

        // Create log BEFORE sending (QUEUED) - locking the item
        const log = await prisma.deliveryLog.create({
          data: {
            userId: user.id,
            whatsappNumber: user.whatsappNumber!,
            digestType: DigestFrequency.INSTANT,
            status: DeliveryStatus.QUEUED,
            scheduledAt: new Date(),
            items: {
              create: [{ intelligenceItemId: item.id }],
            },
          },
        });

        // Dispatch background sendDelivery job
        await inngest.send({
          name: "app/send.delivery",
          data: {
            deliveryLogId: log.id
          }
        });

        dispatchedCount++;
      });
    }

    return { alertedUsersCount: users.length, dispatchedCount };
  }
);

// Decoupled, retry-resilient WhatsApp Delivery job
export const sendDelivery = inngest.createFunction(
  {
    id: "send-delivery",
    concurrency: 1, // Sequential deliveries to prevent Meta throttle
    rateLimit: {
      limit: parseInt(process.env.WHATSAPP_RATELIMIT_LIMIT || "30", 10),
      period: (process.env.WHATSAPP_RATELIMIT_PERIOD || "1m") as any,
    },
    triggers: [{ event: "app/send.delivery" }]
  },
  async ({ event, step, attempt }) => {
    const { deliveryLogId } = event.data;
    const MAX_RETRIES = parseInt(process.env.WHATSAPP_MAX_RETRIES || "3", 10);
    const currentAttempt = attempt ?? 0;

    const log = await step.run("fetch-log", async () => {
      return await prisma.deliveryLog.findUnique({
        where: { id: deliveryLogId },
        include: { user: true }
      });
    });

    if (!log) {
      await logger.warn("WHATSAPP", `DeliveryLog ID: ${deliveryLogId} not found in database.`);
      return { message: "Delivery log not found" };
    }

    try {
      await logger.info("WHATSAPP", `Attempting WhatsApp delivery for log ID: ${log.id} to user: ${log.user.name} (Attempt ${currentAttempt + 1}/${MAX_RETRIES + 1})`);

      // Update log to SENDING
      await step.run("mark-sending", async () => {
        await prisma.deliveryLog.update({
          where: { id: log.id },
          data: { status: DeliveryStatus.SENDING }
        });
      });

      // Format delivery message using the pre-locked items
      const messageText = await step.run("format-delivery-text", async () => {
        return await formatDeliveryMessage(log.id);
      });

      // Send via Meta Cloud API Client
      const result = await step.run("send-whatsapp-api", async () => {
        return await sendWhatsAppMessage({
          to: log.whatsappNumber,
          text: messageText
        });
      });

      const messageId = result.messages?.[0]?.id || result.wamid || null;

      // Update log to SENT
      await step.run("mark-success", async () => {
        await prisma.deliveryLog.update({
          where: { id: log.id },
          data: {
            status: DeliveryStatus.SENT,
            sentAt: new Date(),
            messageId,
          }
        });
      });

      await logger.info("WHATSAPP", `Successfully delivered digest for log ID: ${log.id}. Meta ID (wamid): ${messageId}`);
      return { success: true, logId: log.id, messageId };

    } catch (error: any) {
      // Log failure and increment retry count in DB
      await step.run("log-delivery-fail-attempt", async () => {
        await prisma.deliveryLog.update({
          where: { id: log.id },
          data: {
            retryCount: currentAttempt + 1,
            errorMessage: error.message,
            status: currentAttempt >= MAX_RETRIES ? DeliveryStatus.FAILED : DeliveryStatus.QUEUED
          }
        });
      });

      if (currentAttempt >= MAX_RETRIES) {
        await logger.error("WHATSAPP", `WhatsApp delivery permanently failed for log ID: ${log.id} after ${currentAttempt + 1} attempts. Transferred to Dead Letter Queue (DLQ).`, error);
        return { success: false, message: `Failed after ${currentAttempt + 1} attempts`, error: error.message };
      } else {
        await logger.warn("WHATSAPP", `WhatsApp delivery attempt ${currentAttempt + 1} failed for log ID: ${log.id}. Scheduling backoff retry...`, error);
        throw error; // Rethrow to let Inngest retry with backoff
      }
    }
  }
);

// Debounced and aggregated WhatsApp alert handler for admins
export const sendDebouncedAlert = inngest.createFunction(
  {
    id: "send-debounced-alert",
    debounce: {
      key: "event.data.component",
      period: "3m", // Quiet window: waits 3 minutes after the last failure event before processing
    },
    triggers: [{ event: "app/alert.trigger" }],
  },
  async ({ event, step }) => {
    const { component } = event.data;

    await step.run("aggregate-and-send-alerts", async () => {
      // Find all ERROR logs for this component in the last 15 minutes that haven't been resolved
      const timeframe = new Date(Date.now() - 15 * 60 * 1000);
      const errors = await prisma.systemLog.findMany({
        where: {
          component,
          level: "ERROR",
          createdAt: { gte: timeframe }
        },
        orderBy: { createdAt: "desc" },
        take: 8
      });

      if (errors.length === 0) return { message: "No active errors found to alert." };

      // Find verified admins to notify
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", whatsappVerified: true, whatsappNumber: { not: null } }
      });

      if (admins.length === 0) return { message: "No verified admins configured." };

      const errorBulletList = errors
        .map((e, idx) => `${idx + 1}. [${new Date(e.createdAt).toLocaleTimeString()}] ${e.message}`)
        .join("\n");

      const alertText = `⚠️ *Pulse AI Health Alert (${component})* ⚠️\n\nThere were *${errors.length}* recent errors detected on component *${component}*:\n\n${errorBulletList}\n\n_Please check the Admin Dashboard logs immediately._`;

      const { sendWhatsAppMessage } = await import("@/lib/whatsapp/client");
      for (const admin of admins) {
        try {
          await sendWhatsAppMessage({
            to: admin.whatsappNumber!,
            text: alertText
          });
        } catch (err) {
          console.error(`Failed to send alert to admin ${admin.name}:`, err);
        }
      }

      // Record alert sent in DB
      await prisma.systemLog.create({
        data: {
          component,
          level: "ALERT_SENT",
          message: `Aggregated alert sent to ${admins.length} admins regarding ${errors.length} errors on component ${component}.`
        }
      });
    });
  }
);

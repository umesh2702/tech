import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { generateDigest, formatDigestItem } from "@/lib/whatsapp/digest";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { DigestFrequency, DeliveryStatus } from "@prisma/client";

// Hourly Cron to check for due digests
export const sendScheduledDigests = inngest.createFunction(
  { id: "send-scheduled-digests", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    // 1. Find all verified users with DAILY or THREE_HOURLY preference
    const users = await step.run("fetch-digest-users", async () => {
      return prisma.userPreference.findMany({
        where: {
          whatsappVerified: true,
          whatsappNumber: { not: null },
          digestFrequency: { in: [DigestFrequency.DAILY, DigestFrequency.THREE_HOURLY] },
        },
      });
    });

    for (const user of users) {
      await step.run(`process-user-${user.userId}`, async () => {
        // Find last delivery
        const lastDelivery = await prisma.deliveryLog.findFirst({
          where: { userId: user.userId, digestType: user.digestFrequency },
          orderBy: { createdAt: "desc" },
        });

        const now = new Date();
        const hoursSinceLast = lastDelivery 
          ? (now.getTime() - lastDelivery.createdAt.getTime()) / (1000 * 60 * 60)
          : 999;

        // Check if it's time
        if (
          (user.digestFrequency === DigestFrequency.DAILY && hoursSinceLast < 23) ||
          (user.digestFrequency === DigestFrequency.THREE_HOURLY && hoursSinceLast < 2.5)
        ) {
          return { skipped: true, reason: "not_due" };
        }

        // Generate digest
        const limit = user.digestFrequency === DigestFrequency.DAILY ? 5 : 2;
        const digest = await generateDigest(user.userId, limit);

        if (!digest || digest.itemIds.length === 0) {
          return { skipped: true, reason: "no_new_items" };
        }

        // Create log BEFORE sending (QUEUED)
        const log = await prisma.deliveryLog.create({
          data: {
            userId: user.userId,
            whatsappNumber: user.whatsappNumber!,
            digestType: user.digestFrequency,
            status: DeliveryStatus.QUEUED,
            scheduledAt: new Date(),
            items: {
              create: digest.itemIds.map(id => ({ intelligenceItemId: id }))
            }
          }
        });

        try {
          // Send to Meta
          const result = await sendWhatsAppMessage({
            to: user.whatsappNumber!,
            text: digest.text,
          });

          // Update to SENT
          await prisma.deliveryLog.update({
            where: { id: log.id },
            data: {
              status: DeliveryStatus.SENT,
              sentAt: new Date(),
              messageId: result.messages?.[0]?.id,
            }
          });

          return { success: true, logId: log.id };
        } catch (error: any) {
          // Update to FAILED
          await prisma.deliveryLog.update({
            where: { id: log.id },
            data: {
              status: DeliveryStatus.FAILED,
              errorMessage: error.message,
            }
          });
          throw error; // Let Inngest retry mechanism handle this natively
        }
      });
    }

    return { usersProcessed: users.length };
  }
);

// Event-driven instant alert for 9+ items
export const sendInstantAlert = inngest.createFunction(
  { id: "send-instant-alert", triggers: [{ event: "whatsapp/send_instant" }] },
  async ({ event, step }) => {
    const { itemId } = event.data;

    const item = await step.run("fetch-item", async () => {
      return prisma.intelligenceItem.findUnique({ where: { id: itemId } });
    });

    if (!item || item.opportunityScore < 9) {
      return { skipped: true, reason: "score_too_low_or_missing" };
    }

    // Find all INSTANT users
    const users = await step.run("fetch-instant-users", async () => {
      return prisma.userPreference.findMany({
        where: {
          whatsappVerified: true,
          whatsappNumber: { not: null },
          digestFrequency: DigestFrequency.INSTANT,
        },
      });
    });

    for (const user of users) {
      await step.run(`send-instant-${user.userId}`, async () => {
        // Create log BEFORE sending (QUEUED)
        const log = await prisma.deliveryLog.create({
          data: {
            userId: user.userId,
            whatsappNumber: user.whatsappNumber!,
            digestType: DigestFrequency.INSTANT,
            status: DeliveryStatus.QUEUED,
            scheduledAt: new Date(),
            items: {
              create: [{ intelligenceItemId: item.id }]
            }
          }
        });

        try {
          const header = `🚨 *Pulse AI Instant Alert* (Score: ${item.opportunityScore}/10)\n\n`;
          const body = formatDigestItem(item);
          
          const result = await sendWhatsAppMessage({
            to: user.whatsappNumber!,
            text: header + body,
          });

          // Update to SENT
          await prisma.deliveryLog.update({
            where: { id: log.id },
            data: {
              status: DeliveryStatus.SENT,
              sentAt: new Date(),
              messageId: result.messages?.[0]?.id,
            }
          });

          return { success: true };
        } catch (error: any) {
          await prisma.deliveryLog.update({
            where: { id: log.id },
            data: {
              status: DeliveryStatus.FAILED,
              errorMessage: error.message,
            }
          });
          throw error; // Retries natively handled by Inngest
        }
      });
    }

    return { alertedUsersCount: users.length };
  }
);

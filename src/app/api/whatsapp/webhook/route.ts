import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

// Webhook Verification (Meta uses GET)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp Webhook Verified!");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Receive Status Updates and Messages (Meta uses POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log the entire webhook payload for debugging
    console.log("\n====== WHATSAPP WEBHOOK PAYLOAD ======");
    console.log(JSON.stringify(body, null, 2));
    console.log("======================================\n");

    // Write to a log file so we can view it in the agent workspace
    try {
      const logPath = path.join(process.cwd(), "webhook-log.json");
      let logs = [];
      if (fs.existsSync(logPath)) {
        try {
          logs = JSON.parse(fs.readFileSync(logPath, "utf-8"));
        } catch (e) {
          // If malformed, reset
        }
      }
      logs.push({
        timestamp: new Date().toISOString(),
        body,
      });
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), "utf-8");
    } catch (fsError) {
      console.error("Failed to write to webhook-log.json", fsError);
    }

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.statuses) {
            // This is a status update!
            for (const status of change.value.statuses) {
              const { id: messageId, status: deliveryStatus, recipient_id, errors } = status;

              console.log(`[WhatsApp Status Update] Message ID: ${messageId}`);
              console.log(`[WhatsApp Status Update] Status: ${deliveryStatus}`);
              console.log(`[WhatsApp Status Update] Recipient: ${recipient_id}`);

              if (errors) {
                console.error(`[WhatsApp Error Details]`, JSON.stringify(errors, null, 2));
              }

              // Try to find a matching DeliveryLog to update it
              const deliveryLog = await prisma.deliveryLog.findFirst({
                where: { messageId }
              });

              if (deliveryLog) {
                let newDbStatus = deliveryLog.status;
                if (deliveryStatus === "sent") newDbStatus = "SENT";
                if (deliveryStatus === "delivered") newDbStatus = "DELIVERED";
                if (deliveryStatus === "read") newDbStatus = "READ";
                if (deliveryStatus === "failed") newDbStatus = "FAILED";

                await prisma.deliveryLog.update({
                  where: { id: deliveryLog.id },
                  data: {
                    status: newDbStatus as any,
                    errorMessage: errors ? JSON.stringify(errors) : null,
                    ...(deliveryStatus === "delivered" ? { deliveredAt: new Date() } : {})
                  }
                });
                console.log(`[WhatsApp Webhook] Updated DB DeliveryLog ${deliveryLog.id} to ${newDbStatus}`);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    // Always return 200 to Meta so they don't disable the webhook
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac, timingSafeEqual } from "crypto";

// ─────────────────────────────────────────────────────────────
// HMAC-SHA256 signature verification (Meta webhook security)
// ─────────────────────────────────────────────────────────────
function verifySignature(
  bodyText: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader) return false;
  const parts = signatureHeader.split("sha256=");
  if (parts.length !== 2) return false;
  const signature = parts[1];

  const hmac = createHmac("sha256", appSecret);
  const digest = hmac.update(bodyText).digest("hex");

  try {
    const bufferDigest = Buffer.from(digest, "hex");
    const bufferSig = Buffer.from(signature, "hex");
    if (bufferDigest.length !== bufferSig.length) return false;
    return timingSafeEqual(bufferDigest, bufferSig);
  } catch {
    return digest === signature;
  }
}

// ─────────────────────────────────────────────────────────────
// GET — Meta webhook verification handshake
// Meta sends: hub.mode=subscribe, hub.verify_token, hub.challenge
// We must echo back hub.challenge with status 200
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Verification handshake successful.");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Verification failed — token mismatch or mode not 'subscribe'.");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─────────────────────────────────────────────────────────────
// POST — Receive delivery status updates and inbound messages
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // Read raw body first (required for HMAC verification)
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // Verify payload authenticity via HMAC-SHA256
    if (appSecret) {
      const isValid = verifySignature(rawBody, signature, appSecret);
      if (!isValid) {
        console.error("[WhatsApp Webhook] Invalid HMAC signature — payload rejected.");
        return NextResponse.json(
          { error: "Unauthorized: Invalid webhook signature" },
          { status: 401 }
        );
      }
    } else {
      // WHATSAPP_APP_SECRET not configured. Set it in Vercel environment variables
      // to enforce payload authenticity checks on all incoming webhooks.
      console.warn(
        "[WhatsApp Webhook] WHATSAPP_APP_SECRET not set — HMAC verification bypassed."
      );
    }

    const body = JSON.parse(rawBody);

    // Process whatsapp_business_account events
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value;

          // ── Delivery status updates (sent / delivered / read / failed) ──
          if (value.statuses) {
            for (const status of value.statuses) {
              const { id: messageId, status: deliveryStatus, recipient_id, errors } = status;

              console.log(
                `[WhatsApp Webhook] Status: ${deliveryStatus} | msgId: ${messageId} | recipient: ${recipient_id}`
              );

              if (errors) {
                console.error(
                  `[WhatsApp Webhook] Delivery errors:`,
                  JSON.stringify(errors)
                );
              }

              // Find the matching DeliveryLog by Meta message ID and sync status to DB
              const deliveryLog = await prisma.deliveryLog.findFirst({
                where: { messageId },
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
                    ...(deliveryStatus === "delivered" ? { deliveredAt: new Date() } : {}),
                  },
                });

                console.log(
                  `[WhatsApp Webhook] DeliveryLog ${deliveryLog.id} → ${newDbStatus}`
                );
              }
            }
          }

          // ── Inbound messages ──
          if (value.messages) {
            for (const message of value.messages) {
              // Log inbound messages for observability. Add reply handling here in a future phase.
              console.log(
                `[WhatsApp Webhook] Inbound message — type: ${message.type} | from: ${message.from}`
              );
            }
          }
        }
      }
    }

    // Always return 200 to Meta — any non-200 causes Meta to retry and eventually disable the webhook
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Processing error:", error);
    // Return 200 even on internal errors to prevent Meta from disabling the webhook
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

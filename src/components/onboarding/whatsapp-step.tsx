"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppStepProps {
  whatsappNumber: string;
  setWhatsappNumber: (value: string) => void;
  whatsappVerified: boolean;
  setWhatsappVerified: (value: boolean) => void;
  onNext: () => void;
}

export function WhatsAppStep({
  whatsappNumber,
  setWhatsappNumber,
  whatsappVerified,
  setWhatsappVerified,
  onNext,
}: WhatsAppStepProps) {
  const [testSent, setTestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendTestMessage = async () => {
    if (whatsappNumber.length < 10) return;
    setIsSending(true);
    try {
      const formattedPhone = whatsappNumber.startsWith("+") 
        ? whatsappNumber 
        : `+91${whatsappNumber}`; // default to +91 if no code

      const res = await fetch("/api/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to send welcome message");
      }

      setTestSent(true);
      toast.success("Welcome message sent successfully via WhatsApp!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send welcome message. Please verify your Meta credentials.");
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmReceipt = async () => {
    setIsVerifying(true);
    try {
      const formattedPhone = whatsappNumber.startsWith("+") 
        ? whatsappNumber 
        : `+91${whatsappNumber}`;

      const res = await fetch("/api/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, code: "CONFIRM" }), // pass confirm flag
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify phone number");

      setWhatsappVerified(true);
      toast.success("WhatsApp number verified!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-pulse-green/10 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="h-7 w-7 text-pulse-green" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect Your WhatsApp</h2>
        <p className="text-muted-foreground">
          Intelligence digests and instant alerts will be delivered directly to your phone.
        </p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        {!whatsappVerified ? (
          <>
            {/* Phone number input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp Number</label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted rounded-lg text-sm font-medium shrink-0">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={whatsappNumber.replace(/^\+91/, "")}
                  onChange={(e) =>
                    setWhatsappNumber(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={10}
                  className="h-11"
                  disabled={testSent}
                  id="whatsapp-number-input"
                />
              </div>
            </div>

            {!testSent ? (
              <Button
                onClick={handleSendTestMessage}
                disabled={whatsappNumber.length < 10 || isSending}
                className="w-full gradient-primary text-white border-0"
                size="lg"
                id="send-welcome-btn"
              >
                {isSending ? "Sending Welcome Message..." : "Send Welcome Test Message"}
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-xl bg-card">
                <div className="flex items-start gap-2.5 text-sm">
                  <AlertCircle className="h-4 w-4 text-pulse-amber shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Welcome message dispatched!</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      We sent a test message to your phone. Please check your WhatsApp. If you received it, click the receipt confirmation button below.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleConfirmReceipt}
                    disabled={isVerifying}
                    className="w-full gradient-primary text-white border-0"
                    id="confirm-receipt-btn"
                  >
                    {isVerifying ? "Verifying..." : "Yes, I received the message"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setTestSent(false)}
                    disabled={isVerifying}
                    className="w-full"
                  >
                    Change Phone Number
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-center py-4 border rounded-xl bg-card">
              <CheckCircle2 className="h-12 w-12 text-pulse-green mx-auto mb-3" />
              <p className="font-semibold text-lg">WhatsApp Connected!</p>
              <p className="text-sm text-muted-foreground mt-1">
                +91 {whatsappNumber.replace(/^\+91/, "")}
              </p>
            </div>
            <Button
              onClick={onNext}
              className="w-full gradient-primary text-white border-0"
              size="lg"
              id="whatsapp-next-btn"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {!whatsappVerified && (
        <div className="text-center">
          <button
            onClick={onNext}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now →
          </button>
        </div>
      )}
    </div>
  );
}

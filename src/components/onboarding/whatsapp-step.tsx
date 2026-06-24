"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react";

interface WhatsAppStepProps {
  whatsappNumber: string;
  setWhatsappNumber: (value: string) => void;
  onNext: () => void;
}

export function WhatsAppStep({
  whatsappNumber,
  setWhatsappNumber,
  onNext,
}: WhatsAppStepProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);

  const handleSendOtp = () => {
    if (whatsappNumber.length >= 10) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = () => {
    // Phase 1: Accept any 6-digit OTP
    if (otp.length === 6) {
      setVerified(true);
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
          Intelligence digests will be delivered directly to your WhatsApp.
        </p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        {!verified ? (
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
                  placeholder="98765 43210"
                  value={whatsappNumber}
                  onChange={(e) =>
                    setWhatsappNumber(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={10}
                  className="h-11"
                  id="whatsapp-number-input"
                />
              </div>
            </div>

            {!otpSent ? (
              <Button
                onClick={handleSendOtp}
                disabled={whatsappNumber.length < 10}
                className="w-full gradient-primary text-white border-0"
                size="lg"
                id="send-otp-btn"
              >
                Send Verification Code
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, ""))
                    }
                    maxLength={6}
                    className="h-11 text-center text-lg tracking-[0.3em] font-mono"
                    id="otp-input"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Code sent to +91 {whatsappNumber}
                  </p>
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 6}
                  className="w-full gradient-primary text-white border-0"
                  size="lg"
                  id="verify-otp-btn"
                >
                  Verify Code
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-pulse-green mx-auto mb-3" />
              <p className="font-medium text-lg">WhatsApp Verified!</p>
              <p className="text-sm text-muted-foreground mt-1">
                +91 {whatsappNumber}
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

      {!verified && (
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

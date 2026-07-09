"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WhatsAppSettings({ initialPhone, isVerified }: { initialPhone: string, isVerified: boolean }) {
  const [phone, setPhone] = useState(initialPhone);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);
  
  const router = useRouter();

  const handleTestConnection = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/whatsapp/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: "Test message sent! Check your WhatsApp." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcome = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/whatsapp/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = "Failed to send welcome message";
        try {
          const parsed = JSON.parse(text);
          errorMessage = parsed.error || errorMessage;
        } catch (e) {
          console.error("Non-JSON error response:", text);
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      if (data.success === false) {
        throw new Error(data.error || "Failed to send welcome message");
      }
      
      setMessage({ type: "success", text: "Welcome message sent! Phone verified successfully!" });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (isVerified && initialPhone === phone) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-500/10 text-green-500 rounded-md border border-green-500/20 flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <div>
            <p className="font-medium">WhatsApp Connected</p>
            <p className="text-sm opacity-90">Receiving digests at {phone}</p>
          </div>
        </div>
        <button 
          onClick={() => setPhone("")}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Change Number
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === "input" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp Number (with country code)</label>
            <input 
              type="text" 
              placeholder="e.g. +1234567890" 
              className="w-full bg-background border rounded-md px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSendWelcome}
              disabled={loading || !phone}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Verify Number via Welcome Message
            </button>
          </div>
        </div>
      ) : null}

      {message && (
        <div className={`p-3 rounded-md text-sm border ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

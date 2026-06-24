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

  const handleSendOtp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("otp");
      setMessage({ type: "success", text: "Verification code sent!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: "Phone verified successfully!" });
      router.refresh();
      setStep("input");
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
              onClick={handleTestConnection}
              disabled={loading || !phone}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50"
            >
              Test Connection
            </button>
            <button 
              onClick={handleSendOtp}
              disabled={loading || !phone}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Verify Number
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter Verification Code</label>
            <input 
              type="text" 
              placeholder="6-digit code" 
              className="w-full bg-background border rounded-md px-3 py-2 text-center text-lg tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setStep("input")}
              disabled={loading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50"
            >
              Back
            </button>
            <button 
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-md text-sm border ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

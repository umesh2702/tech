// ─────────────────────────────────────────────
// Pulse AI — OTP Generation & Validation
// Uses crypto for OTP, Redis-ready for production
// ─────────────────────────────────────────────

import { randomInt } from "crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

// In-memory store for Phase 1 (swap with Redis in Phase 2)
const otpStore = new Map<
  string,
  { otp: string; expiresAt: number; attempts: number }
>();

/**
 * Generate a cryptographically secure OTP
 */
export function generateOTP(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return randomInt(min, max).toString();
}

/**
 * Store an OTP for a phone number
 * Returns the generated OTP
 */
export function storeOTP(phoneNumber: string): string {
  const otp = generateOTP();
  otpStore.set(phoneNumber, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });
  return otp;
}

/**
 * Verify an OTP for a phone number
 */
export function verifyOTP(
  phoneNumber: string,
  inputOtp: string
): { valid: boolean; error?: string } {
  const stored = otpStore.get(phoneNumber);

  if (!stored) {
    return { valid: false, error: "No OTP found. Please request a new one." };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phoneNumber);
    return { valid: false, error: "OTP expired. Please request a new one." };
  }

  if (stored.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phoneNumber);
    return {
      valid: false,
      error: "Maximum attempts exceeded. Please request a new OTP.",
    };
  }

  stored.attempts++;

  if (stored.otp !== inputOtp) {
    return {
      valid: false,
      error: `Invalid OTP. ${MAX_ATTEMPTS - stored.attempts} attempts remaining.`,
    };
  }

  // Valid — clean up
  otpStore.delete(phoneNumber);
  return { valid: true };
}

/**
 * Clean up expired OTPs (call periodically)
 */
export function cleanupExpiredOTPs(): void {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phone);
    }
  }
}

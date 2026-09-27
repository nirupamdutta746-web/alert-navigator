import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  // Sends the OTP via Resend (https://resend.com).
  //
  // Setup:
  //   1. Create a Resend account and API key (RE_...).
  //   2. npx convex env set RESEND_API_KEY RE_your_key
  //   3. npx convex env set OTP_EMAIL_FROM "ResQ <onboarding@yourdomain.com>"
  //      (Resend's test sender "onboarding@resend.dev" works without a
  //      verified domain but only delivers to your own account's email.)
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not set. Run: npx convex env set RESEND_API_KEY RE_your_key",
      );
    }

    const from = process.env.OTP_EMAIL_FROM ?? "ResQ <onboarding@resend.dev>";
    const appName = process.env.VLY_APP_NAME ?? "ResQ";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${token} is your ${appName} verification code`,
        html: `<p>Your verification code is:</p>
               <p style="font-size:28px;font-weight:700;letter-spacing:6px">${token}</p>
               <p>This code expires in 15 minutes. If you didn't request it, you can ignore this email.</p>`,
        text: `Your ${appName} verification code is ${token}. It expires in 15 minutes.`,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Resend send failed (${response.status}): ${body || "no details"}`,
      );
    }
  },
});

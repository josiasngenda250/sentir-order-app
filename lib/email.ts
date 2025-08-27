// lib/email.ts
import { Resend } from "resend";

let client: Resend | null = null;

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing");
  if (!client) client = new Resend(key);
  return client;
}

function getFrom(): string {
  // Use onboarding@resend.dev for testing; switch to your verified domain later.
  return process.env.FROM_EMAIL || "onboarding@resend.dev";
}

function getAdmins(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function htmlToText(html: string): string {
  // Simple HTML → text fallback for better deliverability
  return html.replace(/<br\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}

/**
 * Send the customer confirmation email.
 * @returns Resend message id
 */
export async function sendCustomerEmail(to: string, html: string): Promise<string> {
  if (!to) throw new Error("Customer recipient email is empty");

  const resend = getResend();
  const from = getFrom();
  const text = htmlToText(html);

  const { data, error } = await resend.emails.send({
    from: `Sentir <${from}>`,
    to,
    subject: "Thanks for your order — Sentir",
    html,
    text,
    reply_to: from, // ✅ correct field for Resend SDK
  });

  if (error) throw new Error(`Resend(customer): ${error.message ?? String(error)}`);
  const id = data?.id;
  if (!id) throw new Error("Resend(customer): missing message id");
  return id;
}

/**
 * Send the admin notification email to all configured admins.
 * @returns Resend message id
 */
export async function sendAdminEmail(html: string, subject: string): Promise<string> {
  const admins = getAdmins();
  if (!admins.length) throw new Error("ADMIN_EMAILS is empty");

  const resend = getResend();
  const from = getFrom();
  const text = htmlToText(html);

  const { data, error } = await resend.emails.send({
    from: `Sentir <${from}>`,
    to: admins,
    subject,
    html,
    text,
    reply_to: from, // ✅ correct field
  });

  if (error) throw new Error(`Resend(admin): ${error.message ?? String(error)}`);
  const id = data?.id;
  if (!id) throw new Error("Resend(admin): missing message id");
  return id;
}

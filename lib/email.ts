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
  // Keep onboarding@resend.dev for testing; switch to your verified domain later.
  return process.env.FROM_EMAIL || "onboarding@resend.dev";
}

function getAdmins(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function htmlToText(html: string): string {
  // Basic HTML → text fallback (improves deliverability)
  return html.replace(/<br\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}

/** Make any Resend error readable (no more [object Object]) */
function formatResendError(scope: "customer" | "admin", err: unknown): string {
  try {
    if (typeof err === "string") return `Resend(${scope}): ${err}`;
    if (err instanceof Error) return `Resend(${scope}): ${err.message}`;
    return `Resend(${scope}): ${JSON.stringify(err)}`;
  } catch {
    return `Resend(${scope}): ${String(err)}`;
  }
}

/** Send the customer confirmation email; returns Resend message id. */
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
    reply_to: from, // correct field name for Resend SDK
  });

  if (error) throw new Error(formatResendError("customer", error));
  const id = data?.id;
  if (!id) throw new Error("Resend(customer): missing message id");
  return id;
}

/** Send the admin notification email to all configured admins; returns Resend message id. */
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
    reply_to: from, // correct field name
  });

  if (error) throw new Error(formatResendError("admin", error));
  const id = data?.id;
  if (!id) throw new Error("Resend(admin): missing message id");
  return id;
}

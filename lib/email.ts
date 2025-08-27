// lib/email.ts
import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!_resend) {
    if (!key) {
      // Don’t crash at build time; throw only if we actually try to send.
      throw new Error("RESEND_API_KEY missing");
    }
    _resend = new Resend(key);
  }
  return _resend;
}

export async function sendCustomerEmail(to: string, html: string) {
  const from = process.env.FROM_EMAIL;
  if (!from) throw new Error("FROM_EMAIL missing");
  await getResend().emails.send({
    from,
    to,
    subject: "Thanks for your order — Sentir",
    html,
  });
}

export async function sendAdminEmail(html: string, subject: string) {
  const from = process.env.FROM_EMAIL;
  if (!from) throw new Error("FROM_EMAIL missing");
  const adminList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!adminList.length) return;
  await getResend().emails.send({
    from,
    to: adminList,
    subject,
    html,
  });
}

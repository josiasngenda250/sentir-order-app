import { Resend } from "resend";

let resendClient: Resend | null = null;
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing");
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

export async function sendCustomerEmail(to: string, html: string) {
  const from = process.env.FROM_EMAIL;
  if (!from) throw new Error("FROM_EMAIL missing");
  return getResend().emails.send({ from, to, subject: "Thanks for your order — Sentir", html });
}

export async function sendAdminEmail(html: string, subject: string) {
  const from = process.env.FROM_EMAIL;
  if (!from) throw new Error("FROM_EMAIL missing");
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s=>s.trim()).filter(Boolean);
  if (!admins.length) throw new Error("ADMIN_EMAILS empty");
  return getResend().emails.send({ from, to: admins, subject, html });
}

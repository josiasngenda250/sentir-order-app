import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.FROM_EMAIL || "onboarding@resend.dev";
const ADMINS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());

export async function sendCustomerEmail(to: string, html: string) {
  if (!to) return { error: "Missing recipient" };
  try {
    const result = await resend.emails.send({
      from: `Sentir <${FROM}>`,
      to,
      subject: "Your Sentir Order Confirmation",
      html,
    });
    return result;
  } catch (err: any) {
    console.error("sendCustomerEmail error", err);
    return { error: err.message };
  }
}

export async function sendAdminEmail(html: string, subject: string) {
  if (!ADMINS.length) return { error: "No admin emails configured" };
  try {
    const result = await resend.emails.send({
      from: `Sentir <${FROM}>`,
      to: ADMINS,
      subject,
      html,
    });
    return result;
  } catch (err: any) {
    console.error("sendAdminEmail error", err);
    return { error: err.message };
  }
}

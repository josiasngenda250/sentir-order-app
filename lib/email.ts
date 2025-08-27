import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCustomerEmail(to: string, html: string){
  if(!process.env.FROM_EMAIL) throw new Error("FROM_EMAIL missing");
  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject: "Thanks for your order — Sentir",
    html,
  });
}

export async function sendAdminEmail(html: string, subject: string){
  if(!process.env.FROM_EMAIL) throw new Error("FROM_EMAIL missing");
  const adminList = (process.env.ADMIN_EMAILS || "").split(",").map(s=>s.trim()).filter(Boolean);
  if(!adminList.length) return;
  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: adminList,
    subject,
    html,
  });
}

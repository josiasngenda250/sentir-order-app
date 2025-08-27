import { NextResponse } from "next/server";
import { Resend } from "resend";
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const to = url.searchParams.get("to");
    const key = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s=>s.trim()).filter(Boolean);
    const dest = to || admins[0];
    if (!key) return NextResponse.json({ ok:false, error:"RESEND_API_KEY missing" }, { status:500 });
    if (!from) return NextResponse.json({ ok:false, error:"FROM_EMAIL missing" }, { status:500 });
    if (!dest) return NextResponse.json({ ok:false, error:"No recipient" }, { status:400 });
    const resend = new Resend(key);
    const result = await resend.emails.send({ from, to: dest, subject: "Sentir test email", html: "<div style='font-family:system-ui'>Hello from Sentir</div>" });
    return NextResponse.json({ ok:true, result });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message||"Unknown error" }, { status:500 });
  }
}

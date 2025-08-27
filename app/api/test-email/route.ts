import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const toParam = url.searchParams.get("to");
    const admins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const to = toParam || admins[0];

    const key = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    if (!key) return NextResponse.json({ ok: false, error: "RESEND_API_KEY missing" }, { status: 500 });
    if (!from) return NextResponse.json({ ok: false, error: "FROM_EMAIL missing" }, { status: 500 });
    if (!to) return NextResponse.json({ ok: false, error: "No 'to' param and ADMIN_EMAILS empty" }, { status: 400 });

    const resend = new Resend(key);
    const result = await resend.emails.send({
      from,
      to,
      subject: "Sentir test email",
      html: "<div style='font-family:system-ui'>Hello from Sentir — if you received this, email is wired.</div>",
    });

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
